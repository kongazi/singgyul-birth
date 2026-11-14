import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { get, put } from './store';

export const sessionCookie = 'singgyul_admin';
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/', maxAge: 60 * 60 * 4 };
export function configured() { return (process.env.ADMIN_PASSWORD?.length ?? 0) >= 16 && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32; }
function digest(value: string) { return createHash('sha256').update(value).digest(); }
export function checkPassword(value: string) { return configured() && timingSafeEqual(digest(value), digest(process.env.ADMIN_PASSWORD!)); }
function sign(value: string) { return createHmac('sha256', process.env.ADMIN_SESSION_SECRET!).update(value).update(digest(process.env.ADMIN_PASSWORD!)).digest('hex'); }
export async function newSession() {
  const expires = Date.now() + cookieOptions.maxAge * 1000;
  const nonce = randomBytes(24).toString('hex');
  await put(`session:${nonce}`, { expires, active: true });
  const payload = `${expires}.${nonce}`; return `${payload}.${sign(payload)}`;
}
export async function isAdmin() {
  if (!configured()) return false;
  const value = (await cookies()).get(sessionCookie)?.value ?? '';
  const [expiry, nonce, signature, extra] = value.split('.');
  if (extra || !/^\d{13}$/.test(expiry ?? '') || !/^[a-f0-9]{48}$/.test(nonce ?? '') || !/^[a-f0-9]{64}$/.test(signature ?? '') || Number(expiry) <= Date.now()) return false;
  if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(sign(`${expiry}.${nonce}`), 'hex'))) return false;
  try { const session = await get(`session:${nonce}`) as { active?: boolean; expires?: number } | undefined; return session?.active === true && session.expires === Number(expiry); } catch { return false; }
}
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
