import type { NextConfig } from 'next';
const config: NextConfig = {
  async headers() {
    return [{ source: '/admin/:path*', headers: [
      { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'same-origin' },
    ] }];
  },
};
export default config;
