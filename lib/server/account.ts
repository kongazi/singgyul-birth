import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { get, put } from './store';
export const accountCookie = 'singgyul_account';
export const accountOptions = { httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'lax' as const, path:'/', maxAge:60*60*24*30 };
export const hash = (value:string) => createHash('sha256').update(value).digest('hex');
export async function account() {
  const token=(await cookies()).get(accountCookie)?.value;
  if(!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session=await get(`account-session:${hash(token)}`) as {owner:string;expires:number}|undefined;
  return session && session.expires>Date.now() ? session : null;
}
export async function loginAccount(id:string) {
  const owner='naver:'+hash(id);
  const token=randomBytes(32).toString('hex');
  await put(`account-session:${hash(token)}`,{owner,expires:Date.now()+accountOptions.maxAge*1000});
  (await cookies()).set(accountCookie,token,accountOptions);
}
