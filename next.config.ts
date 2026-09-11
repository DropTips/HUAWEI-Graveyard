import type { NextConfig } from 'next';

// GitHub Pages 需要 basePath + export，Vercel 不需要
const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  ...(isGitHubPages && {
    basePath: '/HUAWEI-Graveyard',
    output: 'export',
  }),
};

export default nextConfig;
