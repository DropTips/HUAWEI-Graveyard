import type { NextConfig } from 'next';

import { BASE_PATH } from '@/site';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: BASE_PATH,
};

export default nextConfig;
