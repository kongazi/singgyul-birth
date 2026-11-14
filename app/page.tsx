'use client';
import {useEffect,useState,useRef} from 'react';
import {ShoppingBag,ArrowUpRight,ArrowRight,Plus,Minus,X,Mail,Check,ChevronLeft,ChevronRight,Monitor,Heart} from 'lucide-react';
import {products,BUDGET,total,addItem,validCart,storage,type Cart,type Order} from '../lib/market';

type Panel='cart'|'letter'|'success'|null;
export default function Home(){
 const [cart,setCart]=useState<Cart>({}),[name,setName]=useState(''),[letter,setLetter]=useState(''),[ready,setReady]=useState(false),[panel,setPanel]=useState<Panel>(null),[category,setCategory]=useState('전체'),[desktop,setDesktop]=useState(false),[slide,setSlide]=useState(0),[notice,setNotice]=useState('');
 const [sending,setSending]=useState(false);
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
     }catch{setNotice('기존 편지를 서버로 옮기지 못했어요. 서버 연결 후 새로고침해 주세요. 이전 브라우저 기록은 아직 남아 있어요.');}})();
   }
 },[]);
 useEffect(()=>{if(!ready)return;try{storage.save('cart',cart);}catch{setNotice('브라우저 저장 공간을 사용할 수 없어요.');}},[cart,ready]); useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4000);return()=>clearTimeout(timer);},[notice]);
 useEffect(()=>{if(!panel)return;const prev=document.activeElement as HTMLElement;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setPanel(null);if(e.key==='Tab'){const nodes=Array.from(document.querySelectorAll<HTMLElement>('.dialog button:not(:disabled),.dialog input,.dialog textarea,.dialog a'));const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};document.body.style.overflow='hidden';document.querySelector<HTMLElement>('.dialog button')?.focus();document.addEventListener('keydown',onKey);return()=>{document.body.style.overflow='';document.removeEventListener('keydown',onKey);prev?.focus();};},[panel]);
 function add(id:string){const next=addItem(cart,id);if(next===cart){setNotice('100귤을 넘길 수 없어요. 장바구니를 조금 비워 주세요.');return;}setCart(next);setNotice('추억 한 조각을 장바구니에 담았어요.');}
 function remove(id:string){setCart(c=>({...c,[id]:Math.max(0,(c[id]||0)-1)}));}
 async function submit(e:React.FormEvent){
   e.preventDefault();if(sending||!ready||used>BUDGET||!name.trim()||!letter.trim())return;
   setSending(true);submissionId.current??=crypto.randomUUID();
   try {
     const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:submissionId.current,name:name.trim(),letter:letter.trim(),items:products.filter(p=>cart[p.id]).map(p=>({id:p.id,quantity:cart[p.id]}))})});
     const data=await response.json();if(!response.ok)throw new Error(data.error);

     setCart({});setLetter('');setName('');submissionId.current=null;setPanel('success');

   }catch(e){setNotice(e instanceof Error?e.message:'접수하지 못했어요. 다시 시도해 주세요.');}finally{setSending(false);}
 }
 const art=(p:typeof products[number])=>({backgroundImage:'url(/market-reference.png)',backgroundSize:'426.667% 642.678%',backgroundPosition:`${p.x/784*100}% ${p.y/1297*100}%`});
 return <div className={desktop?'desktop-mode':''}>
 {desktop&&<aside className="desktop-icons"><button onClick={()=>setPanel(null)}><ShoppingBag/>생일 마켓</button><button onClick={()=>setPanel('letter')}><Mail/>축하 카드</button><button onClick={()=>setDesktop(false)}><ArrowUpRight/>마켓으로</button></aside>}
 <div className="site-window">{desktop&&<div className="window-bar"><span>🍊 SINGGYUL MARKET</span><button onClick={()=>setDesktop(false)} aria-label="데스크톱 모드 닫기"><X size={18}/></button></div>}
 <header className="header"><a href="#" className="logo">SINGGYUL<br/>MARKET<span className="logo-fruit">🍊</span></a><nav><a href="#goods">추억 굿즈</a><button onClick={()=>setPanel('letter')}>축하 카드</button></nav><div className="header-actions"><span className="balance">남은 귤 <strong>{BUDGET-used}</strong><span>🍊</span></span><button className="bag" onClick={()=>setPanel('cart')} aria-label={`장바구니 ${count}개`}><ShoppingBag size={26}/>{count>0&&<b>{count}</b>}</button></div></header>
 <main><section className="intro"><div><span className="eyebrow">A LITTLE GIFT, A LOT OF LOVE</span><h1>띵귤의 생일 마켓 <span className="spark">✳</span></h1></div><p>함께 웃었던 순간들을 모아,<br/><strong>오늘은 띵귤님에게 선물해요.</strong></p></section>
 <section className={`hero hero-${slide}`} aria-label="생일 축하 배너">{slide===0?<div className="hero-photo" role="img" aria-label="HAPPY BIRTHDAY SINGGYUL, 귤과 촛불로 장식한 생일 케이크"/>:<div className="alternate-hero"><span>{slide===1?'🍊':'💌'}</span><div><small>{slide===1?'MADE OF OUR MEMORIES':'DEAR. SINGGYUL'}</small><h2>{slide===1?'추억을 담고,\n마음을 더하고.':'가장 특별한 선물은\n당신의 한마디.'}</h2><p>{slide===1?'100귤로 완성하는 나만의 생일 선물':'오래 간직할 생일 편지를 남겨 주세요.'}</p><button onClick={()=>slide===1?document.getElementById('goods')?.scrollIntoView({behavior:'smooth'}):setPanel('letter')}>{slide===1?'굿즈 둘러보기':'편지 쓰기'} <ArrowRight size={16}/></button></div></div>}<button className="hero-arrow left" aria-label="이전 배너" onClick={()=>setSlide((slide+2)%3)}><ChevronLeft/></button><button className="hero-arrow right" aria-label="다음 배너" onClick={()=>setSlide((slide+1)%3)}><ChevronRight/></button></section>
 <div className="hero-bottom"><span>FOR OUR FAVORITE PERSON, SINGGYUL</span><div className="dots">{[0,1,2].map(i=><button aria-label={`${i+1}번 배너`} aria-pressed={slide===i} key={i} className={slide===i?'active':''} onClick={()=>setSlide(i)}/>)}</div><span>생일 축하해요, 띵귤님 ♡</span></div>
 <section className="budget-note"><span className="mini-orange">🍊</span><div><strong>당신에게 도착한 100귤</strong><p>마음에 드는 굿즈를 담고, 편지와 함께 선물해 주세요.</p></div></section>
 <section id="goods" className="goods"><div className="section-heading"><div><span className="eyebrow">MEMORY COLLECTION</span><h2>추억 굿즈 <span>함께한 순간을 골라보세요</span></h2></div><span className="product-count">8 little memories</span></div><div className="filters">{['전체','방송의 순간','귤빛 일상','추억 한 조각'].map(c=><button key={c} onClick={()=>setCategory(c)} className={category===c?'selected':''}>{c}{c==='전체'&&<span>8</span>}</button>)}<span>작은 굿즈에 담긴, 커다란 마음</span></div>
 <div className="product-grid">{products.filter(p=>category==='전체'||p.category===category).map((p,i)=><article className="product" key={p.id}><div className="product-image" style={art(p)}>{i===0&&category==='전체'&&<span className="product-label">BEST MEMORY</span>}{!!cart[p.id]&&<span className="in-cart"><Check size={12}/> {cart[p.id]}개 담김</span>}<button disabled={!ready||used+p.price>BUDGET} className="add-button" onClick={()=>add(p.id)} aria-label={`${p.name} ${p.price}귤 담기`}><Plus size={22}/></button></div><p className="product-tag">{p.tag}</p><div className="product-info"><h3>{p.name}</h3><strong>{p.price}<span>귤</span></strong></div></article>)}</div></section>
 <section className="letter-banner"><div className="envelope">💌</div><div><span className="eyebrow">WITH LOVE, FROM YOU</span><h2>마지막으로, 마음 한 장 더.</h2><p>띵귤님에게 전하고 싶은 이야기를 들려주세요.</p></div><button className="primary" onClick={()=>setPanel('letter')}>축하 카드 쓰기 <ArrowUpRight size={19}/></button></section>
 <section className="how"><span>마음을 전하는 방법</span><p><b>01</b> 100귤로 굿즈 고르기</p><i>→</i><p><b>02</b> 생일 편지 쓰기</p><i>→</i><p><b>03</b> 보낸 편지는 띵귤님께 전달돼요</p></section>
 </main><footer><div><strong>SINGGYUL MARKET 🍊</strong><p>함께한 모든 순간이 선물이에요.</p></div><div><button onClick={()=>setDesktop(!desktop)}><Monitor size={16}/> {desktop?'마켓 화면으로':'귤 데스크톱'} <ArrowUpRight size={14}/></button></div></footer></div>
 {desktop&&<div className="taskbar"><button onClick={()=>setDesktop(false)}>🍊 시작</button><span><ShoppingBag size={16}/> 생일 마켓</span><time>HAPPY BIRTHDAY</time></div>}
 {notice&&<div className="toast" role="status"><span>🍊</span>{notice}</div>}
 {panel&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setPanel(null);}}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="dialog-heading"><span className="eyebrow">SINGGYUL MARKET</span><button className="icon-button" onClick={()=>setPanel(null)} aria-label="닫기"><X/></button></div><h2 id="dialog-title">{panel==='cart'?'나의 귤 장바구니':panel==='letter'?'띵귤님에게, 마음 한 장':'마음이 담긴 편지를 접수했어요!'}</h2>
 {panel==='cart'&&<><p className="muted">100귤 안에서 좋아하는 추억을 골라 주세요.</p>{!count?<div className="empty"><ShoppingBag size={42}/><h3>아직 담긴 추억이 없어요</h3><p>굿즈를 골라도 좋고, 편지만 남겨도 좋아요.</p><button className="primary" onClick={()=>setPanel('letter')}>편지만 쓰기</button><button className="secondary" onClick={()=>setPanel(null)}>굿즈 보러 가기</button></div>:<><div className="cart-list">{products.filter(p=>cart[p.id]>0).map(p=><div className="cart-row" key={p.id}><div className="thumbnail" style={art(p)}/><div className="cart-title"><strong>{p.name}</strong><span>{p.price}귤</span></div><div className="quantity"><button aria-label={`${p.name} 수량 줄이기`} onClick={()=>remove(p.id)}><Minus size={14}/></button><span>{cart[p.id]}</span><button disabled={used+p.price>100} aria-label={`${p.name} 수량 늘리기`} onClick={()=>add(p.id)}><Plus size={14}/></button></div></div>)}</div><div className="receipt"><span>담은 마음 <b>{used}귤</b></span><span>남은 귤 <b>{100-used}귤</b></span><div className="budget-track"><div style={{width:`${used}%`}}/></div></div><button className="primary full" onClick={()=>setPanel('letter')}>편지 쓰고 주문 저장하기 <ArrowRight size={17}/></button></>}</>}
 {panel==='letter'&&<form onSubmit={submit}><p className="muted">굿즈 없이 편지만 남겨도 좋아요. 마음을 꾹꾹 눌러 담아 주세요.</p><label className="field">보내는 사람<input maxLength={30} required value={name} onChange={e=>setName(e.target.value)} placeholder="띵귤님이 불러주었으면 하는 이름"/></label><label className="field">생일 축하 편지<textarea required maxLength={2000} rows={8} value={letter} onChange={e=>setLetter(e.target.value)} placeholder={'To. 띵귤님\n\n함께 웃었던 모든 순간이 소중해요.\n생일을 진심으로 축하해요!'} /></label><div className="letter-meta"><span>작성 중인 편지는 새로고침하면 사라져요.</span><span>{letter.length} / 2,000</span></div><div className="order-summary"><ShoppingBag size={20}/><span>{count ? `선택한 굿즈 ${count}개` : '편지만 남기기'}</span><strong>{count ? `${used} / 100귤` : '귤 차감 없음'}</strong><button type="button" onClick={()=>setPanel('cart')}>{count ? '수정' : '굿즈 추가'}</button></div><button className="primary full" disabled={sending||!ready||used>BUDGET||!name.trim()||!letter.trim()} type="submit">{sending ? '접수 중…' : count ? `${used}귤로 마음 보내기` : '편지만 보내기'} <Heart size={17}/></button><p className="storage-note">접수한 편지는 관리자만 확인할 수 있어요.</p></form>}
 {panel==='success'&&<div className="empty"><Mail size={42}/><h3>소중한 마음을 남겨주셔서 감사해요.</h3><p>보내주신 편지는 관리자가 확인한 뒤<br/>띵귤님께 전달할게요.</p><button className="primary full" onClick={()=>setPanel(null)}>마켓으로 돌아가기</button></div>}
 </section></div>}
 </div>;
}
