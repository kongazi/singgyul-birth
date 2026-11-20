import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { get, put } from './store';

export const sessionCookie = 'singgyul_admin';
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/', maxAge: 60 * 60 * 4 };
export function configured() { return (process.env.ADMIN_PASSWORD?.length ?? 0) >= 16 && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32; }
function digest(value: string) { return createHash('sha256').update(value).digest(); }
export function checkPassword(value: string) { return configured() && timingSafeEqual(digest(value), digest(process.env.ADMIN_PASSWORD!)); }
export type AdminRole = 'admin' | 'superadmin';
export function passwordRole(value: string): AdminRole | null {
  if (!configured()) return null;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (password && password.length >= 16 && timingSafeEqual(digest(value), digest(password))) return 'superadmin';
  return checkPassword(value) ? 'admin' : null;
}
function sign(value: string) { return createHmac('sha256', process.env.ADMIN_SESSION_SECRET!).update(value).update(digest(process.env.ADMIN_PASSWORD!)).digest('hex'); }
export async function newSession(role: AdminRole = 'admin') {
  const expires = Date.now() + cookieOptions.maxAge * 1000;
  const nonce = randomBytes(24).toString('hex');
  await put(`session:${nonce}`, { expires, active: true, role, credential: role === 'superadmin' ? digest(process.env.SUPERADMIN_PASSWORD!).toString('hex') : undefined });
  const payload = `${expires}.${nonce}`; return `${payload}.${sign(payload)}`;
}
export async function adminRole(): Promise<AdminRole | null> {
  if (!configured()) return null;
  const value = (await cookies()).get(sessionCookie)?.value ?? '';
  const [expiry, nonce, signature, extra] = value.split('.');
  if (extra || !/^\d{13}$/.test(expiry ?? '') || !/^[a-f0-9]{48}$/.test(nonce ?? '') || !/^[a-f0-9]{64}$/.test(signature ?? '') || Number(expiry) <= Date.now()) return null;
  if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(sign(`${expiry}.${nonce}`), 'hex'))) return null;
  try {
    const session = await get(`session:${nonce}`) as { active?: boolean; expires?: number; role?: AdminRole; credential?: string } | undefined;
    if (!session?.active || session.expires !== Number(expiry)) return null;
    if (session.role === 'superadmin') return process.env.SUPERADMIN_PASSWORD && session.credential === digest(process.env.SUPERADMIN_PASSWORD).toString('hex') ? 'superadmin' : null;
    return session.role === 'admin' || session.role === undefined ? 'admin' : null;
  } catch { return null; }
}
export async function isAdmin() { return (await adminRole()) !== null; }
export async function revokeSession() {
  if (!await isAdmin()) return;
  const value = (await cookies()).get(sessionCookie)!.value;
  await put(`session:${value.split('.')[1]}`, { active: false });
}
export function sameOrigin(request: Request) { const origin = request.headers.get('origin'); return !!origin && origin === new URL(request.url).origin; }
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' } }); }
export async function body(request: Request) {
  if (Number(request.headers.get('content-length')) > 24000) throw new Error('TOO_LARGE');
  const reader = request.body?.getReader(); if (!reader) throw new Error('INVALID');
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; length += value.byteLength; if (length > 24000) { await reader.cancel(); throw new Error('TOO_LARGE'); } chunks.push(value); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Error('INVALID'); }
}
