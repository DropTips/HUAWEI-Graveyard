'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'dark' | 'light';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  // 首帧与预渲染 HTML 保持一致，挂载后再渲染真实图标，避免亮色用户看到图标闪一下
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('theme');
    } catch {
      // 忽略隐私模式下 localStorage 不可用的情况
    }
    const next: Theme = saved === 'light' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('light', next === 'light');
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('light', next === 'light');
    try {
      localStorage.setItem('theme', next);
    } catch {
      // 忽略隐私模式下 localStorage 不可用的情况
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="切换亮暗模式"
      className="theme-toggle glass fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--heading)]"
    >
      {mounted ? (
        theme === 'dark' ? (
          <Sun key="sun" size={18} />
        ) : (
          <Moon key="moon" size={18} />
        )
      ) : null}
    </button>
  );
}
