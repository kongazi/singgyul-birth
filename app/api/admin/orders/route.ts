import { body, json, sameOrigin, isAdmin } from '../../../../lib/server/auth';
import { allRecords, get, put } from '../../../../lib/server/store';
import { deliveryLabels, updateReview, type Review } from '../../../../lib/moderation';
export const runtime = 'nodejs';
export async function GET() {
  if (!await isAdmin()) return json({ error:'관리자 로그인이 필요해요.' },401);
  try { return json(await allRecords()); } catch { return json({ error:'기록을 불러오지 못했어요.' },503); }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return json({ error:'허용되지 않은 요청입니다.' },403);
  if (!await isAdmin()) return json({ error:'관리자 로그인이 필요해요.' },401);
  try {
    const d = await body(request);
    if (typeof d.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(d.id) || typeof d.checked !== 'boolean' || typeof d.delivery !== 'string' || !Object.hasOwn(deliveryLabels,d.delivery) || typeof d.note !== 'string' || d.note.length > 1000) return json({ error:'검토 내용을 확인해 주세요.' },400);
    if (!await get(`order:${d.id}`)) return json({ error:'편지가 없어요.' },404);
    const old = await get(`review:${d.id}`) as Review | undefined;
    const review = updateReview(old ? {[d.id]:old} : {},d.id,{checked:d.checked,delivery:d.delivery,note:d.note})[d.id];
    await put(`review:${d.id}`,review); return json({ review });
  } catch { return json({ error:'검토 상태를 저장하지 못했어요.' },503); }
}
