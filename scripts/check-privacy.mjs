import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import path from 'node:path';
process.loadEnvFile('.env.local');
if (process.env.DATABASE_URL) throw new Error('This check uses the local development store only.');
const origin = 'http://localhost:3000';
const id = randomUUID();
const marker = `private-test-${randomUUID()}`;
const request = (url, options={}) => fetch(origin+url, { ...options, headers: { Origin:origin, 'Content-Type':'application/json', ...options.headers } });
try {
  assert.equal((await request('/api/admin/orders')).status,401);
  assert.equal((await request('/api/admin/orders',{headers:{Cookie:'singgyul_admin=forged'}})).status,401);
  assert.equal((await request('/api/orders')).status,405);
  const page = await fetch(origin+'/admin',{redirect:'manual'});
  assert.equal(page.status,307); assert.match(page.headers.get('location'),/\/admin\/login/);
  const payload = {id,name:'개인정보 검증용',letter:marker,items:[]};
  assert.equal((await request('/api/orders',{method:'POST',headers:{Origin:'https://other.invalid'},body:JSON.stringify(payload)})).status,403);
  const posted=await request('/api/orders',{method:'POST',body:JSON.stringify(payload)});
  assert.equal(posted.status,201);
  const publicText=await posted.text(); assert.equal(publicText.includes(marker),false); assert.equal(Object.hasOwn(JSON.parse(publicText).receipt,'letter'),false);
  assert.match(posted.headers.get('cache-control'),/no-store/);
  const publicPage=await (await request('/')).text();assert.equal(publicPage.includes(marker),false);assert.equal(publicPage.includes(process.env.ADMIN_PASSWORD),false);
  assert.equal((await request('/api/admin/orders',{method:'PATCH',body:JSON.stringify({id,checked:true,delivery:'approved',note:''})})).status,401);
  assert.equal((await request('/api/admin/login',{method:'POST',body:JSON.stringify({password:'incorrect-password'})})).status,401);
  const login=await request('/api/admin/login',{method:'POST',body:JSON.stringify({password:process.env.ADMIN_PASSWORD})});assert.equal(login.status,200);
  const setCookie=login.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/i);assert.match(setCookie,/SameSite=strict/i);
  const cookie=setCookie.split(';')[0];
  const admin=await request('/api/admin/orders',{headers:{Cookie:cookie}});assert.equal(admin.status,200);assert.match(admin.headers.get('cache-control'),/no-store/);
  const data=await admin.json(); assert.equal(data.orders.find(o=>o.id===id).letter,marker);
  const patch=await request('/api/admin/orders',{method:'PATCH',headers:{Cookie:cookie},body:JSON.stringify({id,checked:false,delivery:'approved',note:'test'})});assert.equal(patch.status,200);assert.equal((await patch.json()).review.delivery,'pending');
  const approved=await request('/api/admin/orders',{method:'PATCH',headers:{Cookie:cookie},body:JSON.stringify({id,checked:true,delivery:'approved',note:'test'})});assert.equal((await approved.json()).review.delivery,'approved');
  const logout=await request('/api/admin/logout',{method:'POST',headers:{Cookie:cookie}});assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/i);
  assert.equal((await request('/api/admin/orders')).status,401);
  assert.equal((await request('/api/admin/orders',{headers:{Cookie:cookie}})).status,401);
  console.log('PASS: unauthorized/forged access, page guard, CSRF, receipt privacy, admin session, moderation, logout.');
} finally {
  for(const prefix of ['order:','review:']) rmSync(path.join(process.cwd(),'.private-data',encodeURIComponent(prefix+id)+'.json'),{force:true});
}
