'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function Login() {
  const [password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  return <main style={{maxWidth:420,margin:'12vh auto',padding:24}}><span className="eyebrow">SINGGYUL MARKET · ADMIN</span><h1 style={{fontSize:30}}>관리자 로그인</h1><form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const data=await r.json();if(!r.ok)throw new Error(data.error);setPassword('');window.location.replace('/admin');}catch(e){setError(e instanceof Error?e.message:'로그인하지 못했어요.');}finally{setBusy(false);}}}><label className="field">관리자 비밀번호<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p className="validation" role="alert">{error}</p>}<button className="primary full" disabled={busy}>{busy?'로그인 중…':'로그인'}</button></form><p style={{marginTop:25,textAlign:'center'}}><Link href="/">마켓으로 돌아가기</Link></p></main>;
}
