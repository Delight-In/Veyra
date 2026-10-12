import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  getThemeClasses: () => {
    containerFont: string;
    cardRadius: string;
    buttonStyle: string;
    accentBg: string;
    accentText: string;
    heroGradient: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('veyra_theme_dark') || localStorage.getItem('edunova_theme_dark');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('veyra_theme_dark', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const getThemeClasses = () => {
    return {
      containerFont: 'font-sans',
      cardRadius: 'rounded-xl shadow-sm border border-slate-200 dark:border-slate-800',
      buttonStyle: 'rounded-lg font-medium transition-colors',
      accentBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      accentText: 'text-indigo-600 dark:text-indigo-400 font-semibold',
      heroGradient: 'from-indigo-50/80 via-white to-purple-50/50 dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-900',
    };
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, getThemeClasses }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

