import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import ThemeToggle from '@/theme-toggle';

import '@/globals.css';

export const metadata: Metadata = {
  title: '华为坟场 | 缅怀被华为抹杀的产品',
  description:
    '华为坟场是一个开源静态站点，用于纪念被华为抹杀或终止的产品与服务。缅怀那些曾经深爱却已消失的华为产品。',
  keywords: ['华为坟场', '被华为抹杀', '华为', '荣耀', '鸿蒙', '抹杀产品'],
  icons: ['/assets/headstone.svg'],
  alternates: { canonical: '/' },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.add('light')}}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <ThemeToggle />
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
