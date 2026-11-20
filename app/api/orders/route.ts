import { body, json, sameOrigin, configured } from '../../../lib/server/auth';
import { get, put, rateLimit } from '../../../lib/server/store';
import { writer } from '../../../lib/server/visitor';
import { parseSubmission, receipt } from '../../../lib/submission';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: '허용되지 않은 요청입니다.' }, 403);
  if (!configured()) return json({ error: '지금은 편지를 보낼 수 없어요. 잠시 후 다시 시도해 주세요.' }, 503);
  try {
    const order = parseSubmission(await body(request));
    if (!await rateLimit('submissions', 500, 3600)) return json({ error: '잠시 후 다시 보내 주세요.' }, 429);
    const owner = await writer(true);
    await put(`order:${order.id}`, { ...order, owner }, true);
    const saved = await get(`order:${order.id}`) as typeof order & { owner?: string };
    if (saved.owner !== owner) return json({ error: '편지를 보내지 못했어요. 새로고침 후 다시 보내 주세요.' }, 409);
    return json({ receipt: receipt(order) }, 201);
  } catch (e) { return json({ error: e instanceof Error && ['INVALID','TOO_LARGE'].includes(e.message) ? '이름, 편지와 굿즈 수량을 확인해 주세요.' : '편지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.' }, e instanceof Error && ['INVALID','TOO_LARGE'].includes(e.message) ? 400 : 503); }
}
