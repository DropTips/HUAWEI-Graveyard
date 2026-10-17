import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

// next-env.d.ts 由 Next 自动生成，postcss.config.js 为构建配置，均不纳入 lint
const config = [
  { ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts', 'postcss.config.js'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default config;
