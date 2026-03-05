import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../../i18n';

type Theme = 'light' | 'dark';
type AccentColor = 'blue' | 'purple' | 'pink' | 'orange' | 'green' | 'mint' | 'sakura' | 'ocean' | 'violet';
type Language = 'en' | 'zh' | 'ja' | 'ko';
type FontSize = 'small' | 'medium' | 'large';
type BackgroundVideo = 'none' | 'rain' | 'forest';
type FontFamily = 'sans' | 'serif' | 'lxgw' | 'mashanzheng' | 'zcool';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  language: Language;
  fontSize: FontSize;
  backgroundVideo: BackgroundVideo;
  fontFamily: FontFamily;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  setLanguage: (lang: Language) => void;
  setFontSize: (size: FontSize) => void;
  setBackgroundVideo: (video: BackgroundVideo) => void;
  setFontFamily: (font: FontFamily) => void;
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

  const [backgroundVideo, setBackgroundVideo] = useState<BackgroundVideo>(() => {
    const saved = localStorage.getItem('backgroundVideo');
    return (saved as BackgroundVideo) || 'none';
  });

  const [fontFamily, setFontFamily] = useState<FontFamily>(() => {
    const saved = localStorage.getItem('fontFamily');
    return (saved as FontFamily) || 'sans';
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

  const setBackgroundVideoState = (video: BackgroundVideo) => {
    setBackgroundVideo(video);
    localStorage.setItem('backgroundVideo', video);
  };

  const setFontFamilyState = (font: FontFamily) => {
    setFontFamily(font);
    localStorage.setItem('fontFamily', font);
  };

  // Initialize i18n on mount
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, []);

  // Apply Font Family
  useEffect(() => {
    const root = window.document.documentElement;
    const fontMap = {
      sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      serif: '"Noto Serif", "Noto Serif SC", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      lxgw: '"LXGW WenKai", "Noto Serif SC", serif',
      mashanzheng: '"Ma Shan Zheng", "Noto Serif SC", cursive',
      zcool: '"ZCOOL KuaiLe", "Noto Sans SC", cursive',
    };
    // Update CSS variables if you use them
    root.style.setProperty('--font-sans', fontMap[fontFamily]);
    root.style.setProperty('--font-serif', fontMap[fontFamily]); 
    document.body.style.fontFamily = fontMap[fontFamily];
  }, [fontFamily]);

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
    <ThemeContext.Provider value={{ 
      theme, 
      accentColor, 
      language, 
      fontSize, 
      backgroundVideo,
      fontFamily,
      setTheme, 
      setAccentColor, 
      setLanguage, 
      setFontSize, 
      setBackgroundVideo: setBackgroundVideoState,
      setFontFamily: setFontFamilyState,
      toggleTheme 
    }}>
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