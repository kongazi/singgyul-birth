'use client';
import {useEffect,useState,useRef} from 'react';
import {ShoppingBag,ArrowUpRight,Plus,Minus,X,Mail,Check} from 'lucide-react';
import {products,BUDGET,total,addItem,validCart,storage,type Cart,type Order} from '../lib/market';

import LandingHero from './LandingHero';
import GiftGuide from './GiftGuide';
import MyLetters from './MyLetters';
import './storefront.css';

type Panel='welcome'|'cart'|'letter'|'success'|'history'|null;
function shuffledProducts() {
 const list=[...products];
 for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
 return list;
}
export default function Home(){
 const [productOrder,setProductOrder]=useState(products);
 useEffect(()=>{
   const saved=storage.load<unknown>('product-order',null);
   const valid=Array.isArray(saved)&&saved.length===products.length&&new Set(saved).size===products.length&&saved.every(id=>typeof id==='string'&&products.some(p=>p.id===id));
   const ordered=valid ? (saved as string[]).map(id=>products.find(p=>p.id===id)!) : shuffledProducts();
   setProductOrder(ordered);
   try { storage.save('product-order',ordered.map(p=>p.id)); } catch {}
 },[]);
 function selectCategory(next:string){setCategory(next);}
 const [cart,setCart]=useState<Cart>({}),[name,setName]=useState(''),[letter,setLetter]=useState(''),[ready,setReady]=useState(false),[panel,setPanelState]=useState<Panel>(null),[category,setCategory]=useState('전체'),[scrolled,setScrolled]=useState(false),[notice,setNotice]=useState('');
 function setPanel(next:Panel){
   if(panel==='welcome'&&next!=='welcome'){
     try { storage.save('welcome-dismissed',true); } catch {}
   }
   setPanelState(next);
 }
 useEffect(()=>{
   if(!storage.load('welcome-dismissed',false))setPanelState('welcome');
 },[]);
 const [sending,setSending]=useState(false);
 const visibleProducts=productOrder.filter(p=>category==='전체'||p.category===category);
 useEffect(()=>{const update=()=>setScrolled(window.scrollY>80);update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);},[]);
 const submissionId=useRef<string|null>(null);
 const migrationStarted=useRef(false);
 const used=total(cart),count=Object.values(cart).reduce((a,b)=>a+b,0);
 useEffect(()=>{
   setCart(validCart(storage.load('cart',{})));
   try { localStorage.removeItem('singgyul.v1.receipts'); } catch {}
   const draft=storage.load('draft',{name:'',letter:''});
   setName(typeof draft?.name==='string'?draft.name:'');setLetter(typeof draft?.letter==='string'?draft.letter:'');
   try { localStorage.removeItem('singgyul.v1.draft'); } catch {}
   setReady(true);
   // Only remove legacy browser letters after the server acknowledges every record.
   if(migrationStarted.current)return; migrationStarted.current=true;
   const legacy=storage.load<Order[]>('orders',[]);
   if(Array.isArray(legacy)&&legacy.length) {
     void (async()=>{try {

       for(const order of legacy) {
         const r=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)});
         if(!r.ok)throw new Error();
       }
       localStorage.removeItem('singgyul.v1.orders');
     }catch{setNotice('이전에 작성한 편지를 보내지 못했어요. 기존 내용은 이 브라우저에 남아 있으니 잠시 후 다시 시도해 주세요.');}})();
   }
 },[]);
 useEffect(()=>{if(!ready)return;try{storage.save('cart',cart);}catch{setNotice('새로고침하면 장바구니가 비워질 수 있어요.');}},[cart,ready]); useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4000);return()=>clearTimeout(timer);},[notice]);
 useEffect(()=>{if(!panel)return;const prev=document.activeElement as HTMLElement;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setPanel(null);if(e.key==='Tab'){const nodes=Array.from(document.querySelectorAll<HTMLElement>('.dialog button:not(:disabled),.dialog input,.dialog textarea,.dialog a'));const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};document.body.style.overflow='hidden';document.querySelector<HTMLElement>('.dialog button')?.focus();document.addEventListener('keydown',onKey);return()=>{document.body.style.overflow='';document.removeEventListener('keydown',onKey);prev?.focus();};},[panel]);
 function add(id:string){const next=addItem(cart,id);if(next===cart){setNotice('100귤을 넘길 수 없어요. 장바구니를 조금 비워 주세요.');return;}setCart(next);}
 function remove(id:string){setCart(c=>({...c,[id]:Math.max(0,(c[id]||0)-1)}));}
 async function submit(e:React.FormEvent){
   e.preventDefault();if(sending||!ready||used>BUDGET||!name.trim()||!letter.trim())return;
   setSending(true);submissionId.current??=crypto.randomUUID();
   try {
     const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:submissionId.current,name:name.trim(),letter:letter.trim(),items:products.filter(p=>cart[p.id]).map(p=>({id:p.id,quantity:cart[p.id]}))})});
     const data=await response.json();if(!response.ok)throw new Error(data.error);

     // Keep the current view stable; prepare a new order for the next visit.
     const nextOrder=shuffledProducts();
     if(nextOrder.every((p,i)=>p.id===productOrder[i].id)) nextOrder.push(nextOrder.shift()!);
     try { storage.save('product-order',nextOrder.map(p=>p.id)); } catch {}

     setCart({});setLetter('');setName('');submissionId.current=null;setPanel('success');

   }catch(e){setNotice(e instanceof Error?e.message:'편지를 보내지 못했어요. 다시 시도해 주세요.');}finally{setSending(false);}
 }
 const art=(p:typeof products[number])=>({backgroundImage:`url("${encodeURI(p.image)}")`,backgroundSize:'contain',backgroundPosition:'center',backgroundRepeat:'no-repeat'});
 return <div className="storefront">
 <div className="site-window">
 <header className={`market-header${scrolled?' scrolled':''}`}><nav aria-label="마켓 메뉴"><a href="#goods">MEMORIES</a><button onClick={()=>setPanel('letter')}>LETTER</button></nav><a href="#" className="market-brand" aria-label="싱귤 마켓 처음으로">SINGGYUL<small>MARKET</small></a><div className="header-actions"><span className="balance">남은 귤 <strong>{BUDGET-used}</strong></span><button className="bag" onClick={()=>setPanel('cart')} aria-label={`장바구니 ${count}개`}><ShoppingBag size={26}/>{count>0&&<b>{count}</b>}</button></div></header>
 <main className="market-main"><LandingHero/><GiftGuide/>
 <section id="goods" className="goods"><div className="section-heading"><h2>MEMORIES</h2></div><p className="goods-disclaimer">이미지는 연출된 예시이며 실제 상품 사진이 아닙니다. 모든 굿즈는 마음을 전하는 가상 선물로, 실물이 제공되거나 배송되지 않습니다.</p><div className="filters" aria-label="굿즈 카테고리">{['전체','게임','노래','콘텐츠'].map(c=><button key={c} onClick={()=>selectCategory(c)} aria-pressed={category===c} className={category===c?'selected':''}>{c}</button>)}</div>
 <div className="product-grid">{visibleProducts.map(p=><article className="product" key={p.id}><div className="product-image" style={art(p)}>{!!cart[p.id]&&<span className="in-cart"><Check size={12}/> {cart[p.id]}개 담김</span>}</div><div className="product-info"><div><h3>{p.name}</h3><p className="product-price">{p.price}귤</p></div><div className="goods-controls">{!!cart[p.id]&&<><button className="goods-remove" onClick={()=>remove(p.id)} aria-label={`${p.name} 한 개 빼기`}><Minus size={17}/></button><span className="goods-quantity" aria-live="polite">{cart[p.id]}</span></>}<button disabled={!ready||used+p.price>BUDGET} className="goods-add" onClick={()=>add(p.id)} aria-label={`${p.name} ${p.price}귤 담기`}><Plus size={17}/>{!cart[p.id]&&<span>담기</span>}</button></div></div></article>)}</div></section>
 <section className="letter-invitation" aria-labelledby="letter-invitation-title"><div><h2 id="letter-invitation-title">띵귤님에게 생일 편지를 남겨주세요.</h2><p>굿즈 없이 편지만 보내도 좋아요.<br/>보내주신 편지는 띵귤님께 전달돼요.</p></div><button className="letter-write" onClick={()=>setPanel('letter')}>편지 쓰기 <ArrowUpRight size={18}/></button></section>
 </main><footer className="market-footer"><strong>SINGGYUL MARKET</strong><button className="my-letters-link" onClick={()=>setPanel('history')}>내가 보낸 편지</button></footer></div>
 {notice&&<div className="toast" role="status"><span>🍊</span>{notice}</div>}
 {panel&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setPanel(null);}}><section className={panel === 'welcome' ? 'dialog welcome-dialog' : panel === 'cart' ? 'dialog cart-dialog' : panel === 'letter' ? 'dialog letter-dialog' : 'dialog'} role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="dialog-heading"><span className="eyebrow">SINGGYUL MARKET</span><button className="icon-button" onClick={()=>setPanel(null)} aria-label="닫기"><X/></button></div><h2 id="dialog-title">{panel==='welcome'?'어떻게 시작할까요?':panel==='cart'?'장바구니':panel==='letter'?'생일 편지 쓰기':panel==='history'?'내가 보낸 편지':'편지를 보냈어요!'}</h2>
 {panel==='welcome'&&<><p className="muted">띵귤님에게 편지를 쓰거나, 마켓을 먼저 둘러보세요.</p><div className="welcome-actions"><button className="primary full" onClick={()=>setPanel('letter')}>바로 편지 쓰기</button><button className="secondary full" onClick={()=>setPanel(null)}>사이트 둘러보기</button></div></>}
 {panel==='cart'&&<><p className="muted">100귤 안에서 선택하세요. 실물 배송이 없는 가상 선물입니다.</p>{!count?<div className="cart-empty"><h3>장바구니가 비어 있어요.</h3><p>굿즈 없이 편지만 보낼 수도 있어요.</p><div className="cart-empty-actions"><button className="secondary" onClick={()=>{setPanel(null);document.getElementById('goods')?.scrollIntoView({behavior:'smooth'});}}>굿즈 보기</button><button className="primary" onClick={()=>setPanel('letter')}>편지 쓰기</button></div></div>:<><div className="cart-list">{products.filter(p=>cart[p.id]>0).map(p=><div className="cart-row" key={p.id}><div className="thumbnail" style={art(p)}/><div className="cart-title"><strong>{p.name}</strong><span>{p.price}귤</span></div><div className="quantity"><button aria-label={`${p.name} 수량 줄이기`} onClick={()=>remove(p.id)}><Minus size={14}/></button><span>{cart[p.id]}</span><button disabled={used+p.price>100} aria-label={`${p.name} 수량 늘리기`} onClick={()=>add(p.id)}><Plus size={14}/></button></div></div>)}</div><div className="receipt"><span>담은 마음 <b>{used}귤</b></span><span>남은 귤 <b>{100-used}귤</b></span><div className="budget-track"><div style={{width:`${used}%`}}/></div></div><button className="primary full" onClick={()=>setPanel('letter')}>편지 쓰고 선물 보내기</button></>}</>}
 {panel==='letter'&&<form onSubmit={submit}><p className="muted">띵귤님에게 전하고 싶은 이야기를 적어주세요.</p><label className="field">보내는 사람<input maxLength={30} required value={name} onChange={e=>setName(e.target.value)} placeholder="닉네임"/></label><label className="field">생일 축하 편지<textarea required maxLength={2000} rows={8} value={letter} onChange={e=>setLetter(e.target.value)} placeholder="편지 내용을 입력해주세요." /></label><div className="letter-meta"><span></span><span>{letter.length} / 2,000</span></div><div className="order-summary"><span>{count ? `선택한 굿즈 ${count}개` : '편지만 보내기'}</span><strong>{count ? `${used} / 100귤` : '귤 차감 없음'}</strong><button type="button" onClick={()=>setPanel('cart')}>{count ? '수정' : '굿즈 추가'}</button></div><button className="primary full" disabled={sending||!ready||used>BUDGET||!name.trim()||!letter.trim()} type="submit">{sending ? '보내는 중…' : count ? `${used}귤로 선물 보내기` : '편지만 보내기'}</button></form>}
 {panel==='history'&&<MyLetters/>}
 {panel==='success'&&<div className="empty"><Mail size={42}/><h3>소중한 마음을 남겨주셔서 감사해요.</h3><p>보내주신 편지는 띵귤님께 전달할게요.</p><button className="primary full" onClick={()=>setPanel(null)}>마켓으로 돌아가기</button><button className="secondary full" onClick={()=>setPanel('history')}>내가 보낸 편지 보기</button></div>}
 </section></div>}
 </div>;
}
