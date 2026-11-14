import { cookies } from 'next/headers';
import { json, sameOrigin, sessionCookie, cookieOptions, revokeSession } from '../../../../lib/server/auth';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error:'허용되지 않은 요청입니다.' },403);
  try { await revokeSession(); } catch { return json({ error:'로그아웃하지 못했어요. 다시 시도해 주세요.' },503); }
  (await cookies()).set(sessionCookie,'',{...cookieOptions,maxAge:0});
  return json({ ok:true });
}
