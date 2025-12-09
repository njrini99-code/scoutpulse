'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Check for saved preference or system preference
    const saved = localStorage.getItem('scoutpulse-theme') as Theme | null;
    if (saved) {
      setTheme(saved);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('scoutpulse-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    // Save preference and update document class
    localStorage.setItem('scoutpulse-theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme utility classes - use these throughout the app
export const themeClasses = {
  // Backgrounds
  pageBg: {
    light: 'bg-gradient-to-br from-slate-50 via-white to-emerald-50/30',
    dark: 'bg-slate-900',
  },
  cardBg: {
    light: 'bg-white/90 border-emerald-200/60 shadow-lg shadow-emerald-500/5',
    dark: 'bg-slate-800/90 border-slate-700/50',
  },
  cardBgSolid: {
    light: 'bg-white border-emerald-200/60 shadow-lg shadow-emerald-500/5',
    dark: 'bg-slate-800 border-slate-700/50',
  },
  inputBg: {
    light: 'bg-white border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20',
    dark: 'bg-slate-800 border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20',
  },
  // Text
  textPrimary: {
    light: 'text-slate-800',
    dark: 'text-white',
  },
  textSecondary: {
    light: 'text-slate-600',
    dark: 'text-slate-300',
  },
  textMuted: {
    light: 'text-slate-500',
    dark: 'text-slate-400',
  },
  // Buttons
  buttonPrimary: {
    light: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25',
    dark: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  },
  buttonSecondary: {
    light: 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300',
    dark: 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600',
  },
  buttonGhost: {
    light: 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700',
    dark: 'text-slate-300 hover:bg-slate-700 hover:text-white',
  },
  // Navigation
  navBg: {
    light: 'bg-white/80 backdrop-blur-xl border-b border-emerald-100',
    dark: 'bg-slate-900/80 backdrop-blur-xl border-b border-slate-800',
  },
  navItem: {
    light: 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50',
    dark: 'text-slate-400 hover:text-white hover:bg-slate-800',
  },
  navItemActive: {
    light: 'text-emerald-600 bg-emerald-50 border-emerald-500',
    dark: 'text-emerald-400 bg-slate-800 border-emerald-500',
  },
  // Sidebar
  sidebarBg: {
    light: 'bg-white border-r border-emerald-100',
    dark: 'bg-slate-900 border-r border-slate-800',
  },
  // Badges
  badgePrimary: {
    light: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dark: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  badgeSecondary: {
    light: 'bg-slate-100 text-slate-700 border-slate-200',
    dark: 'bg-slate-700 text-slate-300 border-slate-600',
  },
  // Borders
  border: {
    light: 'border-emerald-200/60',
    dark: 'border-slate-700/50',
  },
  borderAccent: {
    light: 'border-emerald-300',
    dark: 'border-emerald-500/50',
  },
  // Hover effects
  hoverCard: {
    light: 'hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10',
    dark: 'hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5',
  },
  // Avatar
  avatarBg: {
    light: 'bg-emerald-500 text-white',
    dark: 'bg-emerald-500/20 text-emerald-300',
  },
  // Divider
  divider: {
    light: 'border-emerald-100',
    dark: 'border-slate-700',
  },
};

// Helper function to get theme class
export function getThemeClass(
  classes: { light: string; dark: string },
  isDark: boolean
): string {
  return isDark ? classes.dark : classes.light;
}

