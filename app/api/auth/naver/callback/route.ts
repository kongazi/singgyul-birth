import { cookies } from 'next/headers';
import { accountOptions, hash, loginAccount } from '../../../../../lib/server/account';
import { consumeOAuth } from '../../../../../lib/server/store';
export async function GET(request:Request) {
  const url=new URL(request.url), jar=await cookies();
  const state=url.searchParams.get('state'),code=url.searchParams.get('code');
  const expected=jar.get('singgyul_oauth')?.value;
  jar.set('singgyul_oauth','',{...accountOptions,maxAge:0});
  const finish=(result:string)=>new Response(null,{status:302,headers:{Location:url.origin+'/?login='+result,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
  try {
    if(!state || !/^[a-f0-9]{64}$/.test(state) || state!==expected || !await consumeOAuth(hash(state)) || !code || url.searchParams.has('error')) return finish('error');
    const response=await fetch('https://nid.naver.com/oauth2.0/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:process.env.NAVER_CLIENT_ID!,client_secret:process.env.NAVER_CLIENT_SECRET!,code,state}),cache:'no-store',signal:AbortSignal.timeout(15000)});
    const token=await response.json();
    if(!response.ok || typeof token.access_token!=='string') return finish('error');
    const profileResponse=await fetch('https://openapi.naver.com/v1/nid/me',{headers:{Authorization:`Bearer ${token.access_token}`},cache:'no-store',signal:AbortSignal.timeout(15000)});
    const profile=await profileResponse.json();
    if(!profileResponse.ok || profile.resultcode!=='00' || typeof profile.response?.id!=='string' || !profile.response.id) return finish('error');
    await loginAccount(profile.response.id);
    return finish('success');
  } catch { return finish('error'); }
}
