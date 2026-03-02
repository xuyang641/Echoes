import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../../i18n';

type Theme = 'light' | 'dark';
type AccentColor = 'blue' | 'purple' | 'pink' | 'orange' | 'green' | 'mint' | 'sakura' | 'ocean' | 'violet';
type Language = 'en' | 'zh' | 'ja' | 'ko';
type FontSize = 'small' | 'medium' | 'large';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  language: Language;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  setLanguage: (lang: Language) => void;
  setFontSize: (size: FontSize) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage or default
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });
  
  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('accentColor');
    return (saved as AccentColor) || 'blue';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const saved = localStorage.getItem('fontSize');
    return (saved as FontSize) || 'medium';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    // Default to browser language or 'en'
    const browserLang = navigator.language.split('-')[0];
    const supported = ['en', 'zh', 'ja', 'ko'];
    return (saved as Language) || (supported.includes(browserLang) ? browserLang as Language : 'en');
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('fontSize', size);
  };

  // Initialize i18n on mount
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply Font Size
  useEffect(() => {
    const root = window.document.documentElement;
    // Map sizes to percentages or rem
    const sizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px'
    };
    root.style.fontSize = sizeMap[fontSize];
  }, [fontSize]);

  // Apply accent color
  useEffect(() => {
    localStorage.setItem('accentColor', accentColor);
    
    const root = window.document.documentElement;
    let primaryColor = '#2563eb'; // Default blue
    let primaryForeground = '#ffffff';

    // Color definitions
    // Format: [Light, Dark]
    const colors: Record<AccentColor, [string, string]> = {
        blue:   ['#2563eb', '#60a5fa'],
        purple: ['#9333ea', '#c084fc'],
        pink:   ['#db2777', '#f472b6'],
        orange: ['#ea580c', '#fb923c'],
        green:  ['#16a34a', '#4ade80'],
        mint:   ['#059669', '#34d399'], // Emerald-600/400
        sakura: ['#e11d48', '#fb7185'], // Rose-600/400
        ocean:  ['#0891b2', '#22d3ee'], // Cyan-600/400
        violet: ['#7c3aed', '#a78bfa'], // Violet-600/400
    };

    const [lightColor, darkColor] = colors[accentColor] || colors.blue;
    primaryColor = theme === 'light' ? lightColor : darkColor;

    root.style.setProperty('--primary', primaryColor);
    // You might also want to set --primary-foreground if needed for contrast
  }, [accentColor, theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, accentColor, language, fontSize, setTheme, setAccentColor, setLanguage, setFontSize, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}