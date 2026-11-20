'use client';

import { useEffect, useRef } from 'react';
import { initGiftMotion } from '../lib/gift-motion';
import './gift-guide.css';

const copies = [
  ['coin', 'big', '100귤 코인'],
  ['budget', 'line', '선물을 담을 때 쓰는 크레딧이에요.\n100귤 안에서 골라주세요.'],
  ['gamepad', 'name', '게임'], ['microphone', 'name', '노래'], ['clapperboard', 'name', '콘텐츠'],
  ['pick', 'line', '띵귤님에게 선물하고 싶은 순간을 골라보세요.'],
  ['pack', 'line', '고른 선물이 한 상자에 담겨요.'],
  ['finish', 'big', '생일 편지와 함께'],
  ['send', 'line', '띵귤님에게 보내주세요.'],
];

export default function GiftGuide() {
  const story = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (story.current && stage.current) return initGiftMotion(story.current, stage.current);
  }, []);
  return <div className="gift-guide" id="gift-guide">
    <section ref={story} className="gift-story" aria-label="생일 선물 안내">
      <div ref={stage} className="gift-stage">
        <a className="gift-skip" href="#goods">안내 건너뛰고 굿즈 보기 ↓</a>
        <p className="gift-sr">100귤 안에서 선물을 고르고 생일 편지와 함께 띵귤님께 보내주세요. 굿즈 없이 편지만 보낼 수도 있어요.</p>
        <div className="snow" aria-hidden="true" />
        <canvas aria-hidden="true" />
        <div aria-hidden="true">{copies.map(([id, size, text]) => <p key={id} data-copy={id} className={`gift-caption ${size}`}>{text}</p>)}</div>
      </div>
    </section>
    <section className="gift-static" aria-label="생일 선물 안내">
      <article><img src="/assets/gift-guide/refined/coin.png" alt="귤 코인" width="240" height="240"/><h2>100귤 코인</h2><p>100귤 안에서 선물을 골라주세요.</p></article>
      <article><div>{['gamepad','microphone','clapperboard'].map(name => <img key={name} src={`/assets/gift-guide/refined/${name}.png`} alt="" width="120" height="150"/>)}</div><h2>고른 선물이 한 상자에 담겨요.</h2></article>
      <article><img src="/assets/gift-guide/refined/box-closed.png" alt="리본으로 포장한 선물" width="240" height="240"/><h2>생일 편지와 함께</h2><p>띵귤님에게 보내주세요.<br/>굿즈 없이 편지만 보내도 좋아요.</p></article>
    </section>
  </div>;
}
