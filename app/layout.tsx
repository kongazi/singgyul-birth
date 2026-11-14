import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'SINGGYUL MARKET | 띵귤의 생일 마켓', description: '100귤로 고르는 추억, 마음을 담아 보내는 생일 편지.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="ko"><body>{children}</body></html>; }
