'use client';
import { useEffect, useState } from 'react';
import type { Order } from '../lib/market';

export default function MyLetters() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(''); setOrders(null);
    void fetch('/api/my-orders', { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      setOrders(data.orders);
    }).catch(() => { if (!controller.signal.aborted) setError('보낸 편지를 불러오지 못했어요.'); });
    return () => controller.abort();
  }, [attempt]);
  return <div className="my-letters">

    {error ? <p role="alert">{error} <button onClick={() => setAttempt(n => n + 1)}>다시 시도</button></p> : orders === null ? <p role="status">불러오는 중…</p> : orders.length === 0 ? <p>아직 작성한 편지가 없어요.</p> : orders.map(order => <details key={order.id}>
      <summary><span>{order.name}님의 편지<small>{new Date(order.createdAt).toLocaleDateString('ko-KR')}</small></span><span>보기</span></summary>
      <p className="my-letter-body">{order.letter}</p>
      <ul>{order.items.map(item => <li key={item.id}>{item.name} × {item.quantity} <span>{item.price * item.quantity}귤</span></li>)}</ul>
      <p className="my-letter-total">{order.items.length ? `선택한 굿즈 ${order.total}귤` : '편지만 보냈어요.'}</p>
    </details>)}
  </div>;
}
