'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  fontSize: number;
  setTheme: (t: Theme) => void;
  setFontSize: (s: number) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  fontSize: 16,
  setTheme: () => {},
  setFontSize: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [fontSize, setFontSizeState] = useState(16);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('kv-theme') as Theme) || 'dark';
    const savedFontSize = parseInt(localStorage.getItem('kv-font-size') || '16', 10);
    setThemeState(savedTheme);
    setFontSizeState(savedFontSize);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
    localStorage.setItem('kv-theme', theme);
    localStorage.setItem('kv-font-size', String(fontSize));
  }, [theme, fontSize, mounted]);

  function setTheme(t: Theme) { setThemeState(t); }
  function setFontSize(s: number) { setFontSizeState(Math.min(22, Math.max(12, s))); }

  return (
    <ThemeContext.Provider value={{ theme, fontSize, setTheme, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

