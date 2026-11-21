'use client';

import { createElement } from 'react';
import Script from 'next/script';

export default function BgmPlayer() {
  return <>
    {createElement('singgyul-cd-player')}
    <Script src="/singgyul-cd-player/singgyul-cd-player.js" strategy="afterInteractive" />
  </>;
}
