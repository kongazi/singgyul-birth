import { account } from '../../../../lib/server/account';
import { writerOrders } from '../../../../lib/server/store';
import { json } from '../../../../lib/server/auth';
export async function GET() {
  try {
    const user=await account();
    return json({authenticated:!!user,sent:user ? (await writerOrders(user.owner)).length > 0 : false});
  } catch { return json({error:'로그인 상태를 확인하지 못했어요.'},503); }
}
