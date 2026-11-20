export const BUDGET = 100;
export const products = [
 {id:'mic',name:'빈티지 데스크 마이크',price:40,category:'노래',tag:'목소리가 추억이 되는 순간',x:18,y:778},
 {id:'controller',name:'무선 게임 컨트롤러',price:35,category:'게임',tag:'같이 웃고, 같이 이겼던 날',x:271,y:778},
 {id:'mug',name:'귤 머그컵',price:25,category:'콘텐츠',tag:'따뜻한 하루에 귤 한 스푼',x:518,y:778},
 {id:'doll',name:'귤 인형',price:30,category:'콘텐츠',tag:'꼬옥 안아주고 싶은 마음',x:767,y:778},
 {id:'headphones',name:'유선 헤드폰',price:30,category:'노래',tag:'오래 듣고 싶은 우리의 이야기',x:18,y:1073},
 {id:'keyboard',name:'미니 키보드',price:25,category:'게임',tag:'채팅창에 꾹꾹 눌러 담은 응원',x:271,y:1073},
 {id:'blanket',name:'체크 담요',price:20,category:'콘텐츠',tag:'포근한 마음을 덮어줄게요',x:518,y:1073},
 {id:'photo',name:'즉석 사진 세트',price:15,category:'콘텐츠',tag:'우리의 반짝이는 순간들',x:767,y:1073},
];
export type Cart = Record<string,number>;
export type Order = {id:string;createdAt:string;name:string;letter:string;items:{id:string;name:string;price:number;quantity:number}[];total:number};
export function total(cart:Cart) { return products.reduce((sum,p)=>sum+p.price*(cart[p.id]||0),0); }
export function addItem(cart:Cart,id:string):Cart { const p=products.find(p=>p.id===id); if(!p||total(cart)+p.price>BUDGET)return cart; return {...cart,[id]:(cart[id]||0)+1}; }
export function validCart(value:unknown):Cart { if(!value||typeof value!=='object')return {}; const cart:Cart={}; for(const p of products){const n=(value as Cart)[p.id];if(Number.isInteger(n)&&n>0&&n<=6)cart[p.id]=n;}return total(cart)<=BUDGET?cart:{}; }
export const storage = {
 load<T>(key:string,fallback:T):T { try { const raw=localStorage.getItem('singgyul.v1.'+key);return raw?JSON.parse(raw):fallback;}catch{return fallback;} },
 save(key:string,value:unknown) {localStorage.setItem('singgyul.v1.'+key,JSON.stringify(value));},
};
