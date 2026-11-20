'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Package, Search, Check, Download, Save } from 'lucide-react';
import { products, type Order } from '../../lib/market';
import { deliveryLabels, getReview, deliveryReady, type Delivery, type Reviews } from '../../lib/moderation';
import './admin.css';


export default function Admin({ canDelete = false }: { canDelete?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Reviews>({});
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<'letters' | 'goods'>('letters');
  const [query, setQuery] = useState('');
  const [checked, setChecked] = useState('all');
  const [delivery, setDelivery] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const [deleting, setDeleting] = useState(false);
  function selectLetter(id: string) { if (dirty && id !== selected) { setMessage('현재 편지의 변경사항을 먼저 저장해 주세요.'); return; } setSelected(id); }

  async function load() {
    try {
      const response = await fetch('/api/admin/orders', { cache: 'no-store' });
      if (response.status === 401) { setOrders([]); setReviews({}); window.location.replace('/admin/login'); return; }
      let data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const refreshed = await fetch('/api/admin/orders', { cache: 'no-store' });
      if (!refreshed.ok) throw new Error();
      data = await refreshed.json();
      setOrders(data.orders); setReviews(data.reviews); setReady(true);
    } catch { setMessage('기록을 불러오지 못했어요. 다시 시도해 주세요.'); }
  }
  useEffect(() => { void load(); const onShow = (e: PageTransitionEvent) => { if (e.persisted) window.location.reload(); }; window.addEventListener('pageshow', onShow); return () => window.removeEventListener('pageshow', onShow); }, []);
  async function save(id: string, values: { checked: boolean; delivery: Delivery; note: string }) {
    try {
      const response = await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...values }) });
      if (response.status === 401) { setOrders([]); setReviews({}); window.location.replace('/admin/login'); return false; }
      let data = await response.json(); if (!response.ok) throw new Error(data.error);
      setReviews(previous => ({ ...previous, [id]: data.review }));
      setMessage('확인 여부와 전달 분류를 저장했어요.'); return true;
    } catch { setMessage('저장하지 못했어요. 다시 시도해 주세요.'); return false; }
  }
  async function removeLetter(order: Order) {
    if (deleting || !window.confirm(`${order.name}님의 편지를 삭제할까요? 함께 담은 굿즈와 검토 기록도 삭제되며 복구할 수 없습니다.`)) return;
    setDeleting(true);
    try {
      const response = await fetch('/api/admin/orders', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: order.id }) });
      if (response.status === 401) { window.location.replace('/admin/login'); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setOrders(previous => previous.filter(item => item.id !== order.id));
      setReviews(previous => { const next = {...previous}; delete next[order.id]; return next; });
      setSelected(null); setDirty(false); setMessage('편지를 삭제했어요.');
    } catch (error) { setMessage(error instanceof Error ? error.message : '삭제하지 못했어요.'); }
    finally { setDeleting(false); }
  }
  async function logout() {
    const response = await fetch('/api/admin/logout', { method: 'POST' });
    if (!response.ok) { setMessage('로그아웃하지 못했어요. 다시 시도해 주세요.'); return; }
    setOrders([]); setReviews({}); window.location.replace('/admin/login');
  }
  function download() {
    const approved = deliveryReady(orders, reviews);
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, orders: approved }, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'singgyul-approved-letters.json'; a.click(); URL.revokeObjectURL(url);
  }

  const filtered = orders.filter(o => {
    const review = getReview(reviews, o.id);
    return `${o.name} ${o.letter} ${o.id}`.toLowerCase().includes(query.trim().toLowerCase()) && (checked === 'all' || review.checked === (checked === 'yes')) && (delivery === 'all' || review.delivery === delivery);
  });
  const active = orders.find(o => o.id === selected);
  const approvedCount = deliveryReady(orders, reviews).length;

  return <main className="admin-page">
    <div className="admin-top"><Link href="/"><ArrowLeft size={15} /> 마켓으로</Link><span>SINGGYUL MARKET · {canDelete ? '최고 관리자' : '관리자'}</span><button onClick={logout}>로그아웃</button></div>
    <div className="admin-title"><div><span className="eyebrow">EVERY LITTLE HEART MATTERS</span><h1>마음 보관함 <span>🍊</span></h1><p>도착한 선물과 편지를 살펴보고, 전달할 마음을 정리해요.</p></div><button className="secondary" disabled={!approvedCount} onClick={download}><Download size={16} /> 전달 가능 편지 내보내기</button></div>
    <p className="admin-local">관리자 전용 · 편지와 검토 기록은 서버에 보관되며 일반 방문자에게 제공되지 않습니다.</p>
    <section className="admin-stats" aria-label="편지 현황">
      {[['전체 편지', orders.length], ['미확인', orders.filter(o => !getReview(reviews, o.id).checked).length], ['전달 가능', approvedCount], ['보류 · 전달 불가', orders.filter(o => ['held', 'rejected'].includes(getReview(reviews, o.id).delivery)).length]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{ready ? value : '—'}</strong></div>)}
    </section>
    <div className="admin-tabs"><button className={tab === 'letters' ? 'active' : ''} onClick={() => setTab('letters')}><Mail size={17} /> 편지 리스트 <b>{orders.length}</b></button><button className={tab === 'goods' ? 'active' : ''} onClick={() => { if (dirty) { setMessage('현재 편지의 변경사항을 먼저 저장해 주세요.'); return; } setTab('goods'); }}><Package size={17} /> 굿즈 리스트 <b>{products.length}</b></button></div>
    {message && <div className="admin-message" role="status">{message}<button aria-label="알림 닫기" onClick={() => setMessage('')}>×</button></div>}
    {!ready ? <div className="empty">기록을 불러오는 중이에요.</div> : tab === 'letters' ? <>
      <div className="admin-filters"><label className="admin-search"><Search size={17} /><input aria-label="편지 검색" placeholder="보내는 사람, 편지 내용, 주문번호 검색" value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="확인 여부 필터" value={checked} onChange={e => setChecked(e.target.value)}><option value="all">확인 여부 전체</option><option value="no">미확인</option><option value="yes">확인 완료</option></select><select aria-label="전달 분류 필터" value={delivery} onChange={e => setDelivery(e.target.value)}><option value="all">전달 분류 전체</option>{Object.entries(deliveryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
      <div className="admin-columns"><section className="admin-list" aria-label="편지 목록"><div className="admin-list-title">도착한 마음 <span>{filtered.length}개</span></div>{filtered.length ? filtered.map(o => { const r = getReview(reviews, o.id); return <button className={`letter-row ${selected === o.id ? 'selected' : ''}`} key={o.id} onClick={() => selectLetter(o.id)}><div><strong>{o.name}</strong><time>{new Date(o.createdAt).toLocaleDateString('ko-KR')}</time></div><p>{o.letter}</p><div><span className={`review-badge ${r.checked ? 'checked' : ''}`}>{r.checked ? '확인 완료' : '미확인'}</span><span className={`review-badge ${r.delivery}`}>{deliveryLabels[r.delivery]}</span><small>{o.items.length ? `굿즈 ${o.items.reduce((sum, p) => sum + p.quantity, 0)}개` : '편지만'}</small></div></button>; }) : <div className="empty"><Mail size={32} /><h3>{orders.length ? '검색 결과가 없어요' : '아직 도착한 편지가 없어요'}</h3><p>{orders.length ? '검색어나 분류 조건을 바꿔 주세요.' : '마켓에서 저장한 편지가 여기에 표시돼요.'}</p></div>}</section>
      <section className="admin-detail" aria-label="편지 검토">{active ? <><LetterReview key={`${active.id}:${getReview(reviews, active.id).updatedAt}`} order={active} reviews={reviews} onSave={save} onDirty={setDirty} />{canDelete && <button className="secondary full admin-delete" disabled={deleting} onClick={() => removeLetter(active)}>{deleting ? '삭제 중…' : '편지 삭제'}</button>}</> : <div className="empty"><Mail size={38} /><h3>어떤 마음이 도착했을까요?</h3><p>목록에서 편지를 선택해 내용을 확인해 주세요.</p></div>}</section></div>
    </> : <section className="admin-goods"><div className="admin-list-title">굿즈별 선택 현황 <span>전체 저장 기록 기준</span></div><div className="admin-table-wrap"><table><thead><tr><th>굿즈</th><th>분류</th><th>가격</th><th>선택 수량</th><th>포함된 주문</th></tr></thead><tbody>{products.map(p => { const related = orders.filter(o => o.items.some(i => i.id === p.id)); return <tr key={p.id}><th>{p.name}</th><td>{p.category}</td><td>{p.price}귤</td><td><strong>{related.reduce((sum, o) => sum + o.items.filter(i => i.id === p.id).reduce((n, i) => n + i.quantity, 0), 0)}개</strong></td><td>{related.length}건{related.length > 0 && <details><summary>선택 내역 보기</summary>{related.map(o => <button key={o.id} onClick={() => { selectLetter(o.id); setTab('letters'); setQuery(''); setChecked('all'); setDelivery('all'); }}>{o.name} · {o.items.filter(i => i.id === p.id).reduce((n, i) => n + i.quantity, 0)}개 →</button>)}</details>}</td></tr>; })}</tbody></table></div></section>}
  </main>;
}

function LetterReview({ order, reviews, onSave, onDirty }: { onDirty: (dirty: boolean) => void; order: Order; reviews: Reviews; onSave: (id: string, values: { checked: boolean; delivery: Delivery; note: string }) => Promise<boolean> }) {
  const review = getReview(reviews, order.id);
  const [checked, setChecked] = useState(review.checked);
  const [delivery, setDelivery] = useState<Delivery>(review.delivery);
  const [note, setNote] = useState(review.note);
  const [saving, setSaving] = useState(false);
  const dirty = checked !== review.checked || delivery !== review.delivery || note !== review.note;
  useEffect(() => { onDirty(dirty); return () => onDirty(false); }, [dirty, onDirty]);
  useEffect(() => { if (!dirty) return; const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  return <><div className="admin-detail-head"><span className="eyebrow">A LETTER FOR SINGGYUL</span><h2>{order.name}님의 편지</h2><p>{new Date(order.createdAt).toLocaleString('ko-KR')} · #{order.id.slice(0, 8).toUpperCase()}</p></div><div className="admin-letter"><span>To. 띵귤님</span><p>{order.letter}</p><span>From. {order.name}</span></div><div className="admin-gift-summary"><strong>함께 담은 굿즈</strong>{order.items.length ? order.items.map(i => <p key={i.id}>{i.name} × {i.quantity}<span>{i.price * i.quantity}귤</span></p>) : <p>굿즈 없이 보낸 편지예요.</p>}</div>
    <form className="review-form" onSubmit={async e => { e.preventDefault(); if (saving) return; setSaving(true); await onSave(order.id, { checked, delivery, note }); setSaving(false); }}><h3>편지 검토</h3><label className="admin-checkbox"><input type="checkbox" checked={checked} onChange={e => { setChecked(e.target.checked); if (!e.target.checked && delivery === 'approved') setDelivery('pending'); }} /><Check size={17} /> 편지 내용을 확인했어요</label><label className="field">전달 분류<select value={delivery} onChange={e => setDelivery(e.target.value as Delivery)}>{Object.entries(deliveryLabels).map(([value, label]) => <option key={value} value={value} disabled={value === 'approved' && !checked}>{label}</option>)}</select></label>{!checked && <p className="admin-help">내용 확인 후 ‘전달 가능’으로 분류할 수 있어요.</p>}<label className="field">관리 메모<textarea rows={3} maxLength={1000} placeholder="보류 사유나 확인할 내용을 남겨 주세요." value={note} onChange={e => setNote(e.target.value)} /></label><button className="primary full" disabled={!dirty || saving} type="submit"><Save size={16} /> 검토 상태 저장</button><p className="admin-help">{dirty ? '변경사항을 저장한 뒤 다른 편지를 선택해 주세요.' : review.updatedAt ? `마지막 저장: ${new Date(review.updatedAt).toLocaleString('ko-KR')}` : '아직 검토 기록이 없어요.'}</p></form></>;
}
