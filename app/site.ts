// 站点级常量：next.config.ts 与客户端组件共用，避免 basePath 两处定义不同步
export const BASE_PATH = '/HUAWEI-Graveyard';

export const SITE_URL = 'https://droptips.github.io';

export const CANONICAL_URL = `${SITE_URL}${BASE_PATH}/`;

// 静态导出部署在子路径下，资源必须拼上 basePath，否则子路由会 404
export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}
