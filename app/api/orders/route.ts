import { body, json, sameOrigin, configured } from '../../../lib/server/auth';
import { submitOnce, rateLimit } from '../../../lib/server/store';
import { account } from '../../../lib/server/account';
import { parseSubmission, receipt } from '../../../lib/submission';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: '허용되지 않은 요청입니다.' }, 403);
  if (!configured()) return json({ error: '지금은 편지를 보낼 수 없어요. 잠시 후 다시 시도해 주세요.' }, 503);
  try {
    const user=await account();
    if(!user)return json({error:'네이버 로그인 후 편지를 보낼 수 있어요.'},401);
    const order = parseSubmission(await body(request));
    if (!await rateLimit('submissions', 500, 3600)) return json({ error: '잠시 후 다시 보내 주세요.' }, 429);
    const saved = await submitOnce(order,user.owner);
    return json({ receipt: receipt(saved) }, 201);
  } catch (e) { if(e instanceof Error && e.message==='ALREADY_SENT')return json({error:'이미 편지를 보낸 계정이에요.',code:'ALREADY_SENT'},409); return json({ error: e instanceof Error && ['INVALID','TOO_LARGE'].includes(e.message) ? '이름, 편지와 굿즈 수량을 확인해 주세요.' : '편지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.' }, e instanceof Error && ['INVALID','TOO_LARGE'].includes(e.message) ? 400 : 503); }
}
