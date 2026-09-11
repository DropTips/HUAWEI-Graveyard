import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './app/globals.css'],
  theme: {
    extend: {
      colors: {
        grave: {
          bg: '#1a1a1a',
          card: '#242424',
          border: '#383838',
          stone: '#6b7280',
          warn: '#d97706',
          blood: '#991b1b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
