export const BUDGET = 100;
export const products = [
  {
    "id": "goods-경도",
    "name": "경찰과 도둑",
    "price": 10,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_경도.png"
  },
  {
    "id": "goods-유로트럭",
    "name": "유로트럭",
    "price": 10,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_유로트럭.png"
  },
  {
    "id": "goods-로블록스",
    "name": "로블록스",
    "price": 10,
    "category": "게임",
    "image": "/assets/goods/게임_로블록스.png"
  },
  {
    "id": "goods-주루마블",
    "name": "주루마블",
    "price": 30,
    "category": "콘텐츠",
    "image": "/assets/goods/주루마블.png"
  },
  {
    "id": "goods-WASD",
    "name": "WASD",
    "price": 10,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_WASD.png"
  },
  {
    "id": "goods-YAP-YAP",
    "name": "YAP YAP",
    "price": 10,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_YAP YAP.png"
  },
  {
    "id": "goods-낙원",
    "name": "낙원",
    "price": 10,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_낙원.png"
  },
  {
    "id": "goods-고래시티",
    "name": "고래시티 나익자",
    "price": 30,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_고래시티.png"
  },
  {
    "id": "goods-멧챠",
    "name": "메챠 카멜레온",
    "price": 10,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_멧챠.png"
  },
  {
    "id": "goods-팰월드(하나룽)",
    "name": "하나룽",
    "price": 10,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_팰월드(하나룽).png"
  },
  {
    "id": "goods-픽크타2",
    "name": "픽크타2",
    "price": 30,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_픽크타2.png"
  },
  {
    "id": "goods-지수의꿈",
    "name": "지수의 꿈",
    "price": 30,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_지수의꿈.png"
  },
  {
    "id": "goods-피온시식컵",
    "name": "시식컵",
    "price": 10,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_피온시식컵.png"
  },
  {
    "id": "goods-그냥서버",
    "name": "그냥 서버",
    "price": 10,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_그냥서버.png"
  },
  {
    "id": "goods-도깨비",
    "name": "도깨비",
    "price": 10,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_도깨비.png"
  },
  {
    "id": "goods-로이세끼",
    "name": "로이세끼",
    "price": 30,
    "category": "게임",
    "image": "/assets/goods/에셋_게임_로이세끼.png"
  },
  {
    "id": "goods-콘서트",
    "name": "콘서트",
    "price": 30,
    "category": "노래",
    "image": "/assets/goods/노래_콘서트.png"
  },
  {
    "id": "goods-귤락도-락이다",
    "name": "귤락도 락이다",
    "price": 30,
    "category": "노래",
    "image": "/assets/goods/노래_귤락도 락이다.png"
  },
  {
    "id": "goods-상상-노래대회",
    "name": "상상 노래대회",
    "price": 30,
    "category": "노래",
    "image": "/assets/goods/노래_상상 노래대회.png"
  },
  {
    "id": "goods-듀엣가요제",
    "name": "듀엣가요제",
    "price": 30,
    "category": "노래",
    "image": "/assets/goods/노래_듀엣가요제.png"
  },
  {
    "id": "goods-풀트-노래뱅",
    "name": "풀트 노래뱅",
    "price": 30,
    "category": "노래",
    "image": "/assets/goods/노래_풀트 노래뱅.png"
  },
  {
    "id": "goods-풀세션-재즈바",
    "name": "풀세션 재즈바",
    "price": 30,
    "category": "노래",
    "image": "/assets/goods/노래_풀세션 재즈바.png"
  },
  {
    "id": "goods-ASMR",
    "name": "ASMR",
    "price": 30,
    "category": "콘텐츠",
    "image": "/assets/goods/에셋_컨텐츠_ASMR.png"
  },
  {
    "id": "goods-낑깡컵",
    "name": "낑깡컵",
    "price": 30,
    "category": "콘텐츠",
    "image": "/assets/goods/에셋_컨텐츠_낑깡컵.png"
  },
  {
    "id": "goods-뉴-오리지널",
    "name": "뉴 오리지널",
    "price": 30,
    "category": "콘텐츠",
    "image": "/assets/goods/콘텐츠_뉴 오리지널.png"
  },
  {
    "id": "goods-하데스모캡",
    "name": "하데스 모캡 합방",
    "price": 30,
    "category": "콘텐츠",
    "image": "/assets/goods/에셋_컨텐츠_하데스모캡.png"
  }
];
export type Cart = Record<string,number>;
export type Order = {id:string;createdAt:string;name:string;letter:string;items:{id:string;name:string;price:number;quantity:number}[];total:number};
export function total(cart:Cart) { return products.reduce((sum,p)=>sum+p.price*(cart[p.id]||0),0); }
export function addItem(cart:Cart,id:string):Cart { const p=products.find(p=>p.id===id); if(!p||total(cart)+p.price>BUDGET)return cart; return {...cart,[id]:(cart[id]||0)+1}; }
export function validCart(value:unknown):Cart { if(!value||typeof value!=='object')return {}; const cart:Cart={}; for(const p of products){const n=(value as Cart)[p.id];if(Number.isInteger(n)&&n>0&&n<=Math.floor(BUDGET/p.price))cart[p.id]=n;}return total(cart)<=BUDGET?cart:{}; }
export const storage = {
 load<T>(key:string,fallback:T):T { try { const raw=localStorage.getItem('singgyul.v1.'+key);return raw?JSON.parse(raw):fallback;}catch{return fallback;} },
 save(key:string,value:unknown) {localStorage.setItem('singgyul.v1.'+key,JSON.stringify(value));},
};
