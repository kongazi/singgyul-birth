'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { heroMedia } from '../lib/site';

export default function LandingHero() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { if (motion.matches) element.pause(); else void element.play().catch(() => {}); };
    update(); motion.addEventListener('change', update);
    return () => motion.removeEventListener('change', update);
  }, []);
  return <section className="landing-hero" aria-label="띵귤의 생일 마켓">
    <div className="landing-backdrop" style={{ backgroundImage: `url(${heroMedia.poster})` }} aria-hidden="true" />
    {heroMedia.video && !failed ? <video ref={video} className="landing-video" src={heroMedia.video} poster={heroMedia.poster} muted loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} aria-label="띵귤 생일 영상" /> : <div className="landing-poster" style={{ backgroundImage: `url(${heroMedia.poster})` }} role="img" aria-label="HAPPY BIRTHDAY SINGGYUL, 귤과 촛불로 장식한 생일 케이크" />}
    <div className="landing-shade" aria-hidden="true" />
    {heroMedia.video && !failed && <button className="video-toggle" aria-label={playing ? '영상 일시정지' : '영상 재생'} onClick={() => { if (playing) video.current?.pause(); else void video.current?.play().catch(() => {}); }}>{playing ? <Pause size={16}/> : <Play size={16}/>}</button>}
  </section>;
}
