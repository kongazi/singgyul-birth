import { cookies } from 'next/headers';
import { body, json, sameOrigin, configured, checkPassword, newSession, sessionCookie, cookieOptions } from '../../../../lib/server/auth';
import { rateLimit } from '../../../../lib/server/store';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error:'허용되지 않은 요청입니다.' },403);
  if (!configured()) return json({ error:'서버에 관리자 환경변수를 설정해 주세요.' },503);
  try {
    if (!await rateLimit('admin-login', 10, 300)) return json({ error:'로그인 시도가 많아요. 5분 후 다시 시도해 주세요.' },429);
    const data = await body(request);
    if (typeof data.password !== 'string' || !checkPassword(data.password)) return json({ error:'비밀번호가 올바르지 않아요.' },401);
    (await cookies()).set(sessionCookie,await newSession(),cookieOptions);
    return json({ ok:true });
  } catch { return json({ error:'로그인할 수 없어요. 서버 설정을 확인해 주세요.' },503); }
}
