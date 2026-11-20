import 'server-only';
import { randomBytes, createHash } from 'node:crypto';
import { cookies } from 'next/headers';

const name = 'singgyul_writer';
export async function writer(create = false) {
  const jar = await cookies();
  let token = jar.get(name)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    if (!create) return null;
    token = randomBytes(32).toString('hex');
    jar.set(name, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  return createHash('sha256').update(token).digest('hex');
}
