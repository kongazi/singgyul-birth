import { body, json, sameOrigin, configured } from '../../../lib/server/auth';
import { submitOnce, rateLimit } from '../../../lib/server/store';
import { account } from '../../../lib/server/account';
import { parseSubmission, receipt } from '../../../lib/submission';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: '허용되지 않은 요청입니다.' }, 403);
  if (!configured()) return json({ error: '지금은 편지를 보낼 수 없어요. 잠시 후 다시 시도해 주세요.' }, 503);
  try {
    const data = await body(request);
    const anonymous = data?.anonymous === true;
    const owner = anonymous ? null : (await account())?.owner;
    if (owner === undefined) return json({ error: '네이버 로그인 후 편지를 보낼 수 있어요.' }, 401);
    const order = parseSubmission(data, anonymous);
    const rateKey = anonymous ? 'anonymous-submissions' : 'submissions';
    if (!await rateLimit(rateKey, 500, 3600)) return json({ error: '잠시 후 다시 보내 주세요.' }, 429);
    const saved = await submitOnce(order, owner);
    return json({ receipt: receipt(saved) }, 201);
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'ALREADY_SENT') return json({ error: '이미 편지를 보낸 계정이에요.', code }, 409);
    if (code === 'ID_CONFLICT') return json({ error: '이전 접수 번호가 사용 중이에요. 보내기 버튼을 다시 눌러 주세요.', code }, 409);
    if (['INVALID', 'TOO_LARGE'].includes(code)) return json({ error: '편지 입력 내용과 굿즈 수량을 확인해 주세요.' }, 400);
    return json({ error: '편지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.' }, 503);
  }
}
