import type { NextConfig } from 'next';

// GitHub Pages 需要 basePath 子路径，Vercel 不需要
const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  output: 'export',
  ...(isGitHubPages && { basePath: '/HUAWEI-Graveyard' }),
};

export default nextConfig;
