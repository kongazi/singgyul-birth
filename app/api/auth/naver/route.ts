import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { accountOptions, hash } from '../../../../lib/server/account';
import { put } from '../../../../lib/server/store';
export async function GET(request:Request) {
  const origin=new URL(request.url).origin;
  if(!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) return Response.redirect(origin+'/?login=error');
  const state=randomBytes(32).toString('hex');
  await put(`oauth:${hash(state)}`,{expires:Date.now()+600000});
  (await cookies()).set('singgyul_oauth',state,{...accountOptions,maxAge:600});
  const url=new URL('https://nid.naver.com/oauth2.0/authorize');
  url.search=new URLSearchParams({response_type:'code',client_id:process.env.NAVER_CLIENT_ID,redirect_uri:process.env.NAVER_CALLBACK_URL || origin+'/api/auth/naver/callback',state}).toString();
  return new Response(null,{status:302,headers:{Location:url.toString(),'Cache-Control':'no-store'}});
}
