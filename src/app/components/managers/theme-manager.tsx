import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Palette, Moon, Sun, Type } from 'lucide-react';

const colors = [
    { id: 'blue', color: 'bg-blue-500', label: 'Default' },
    { id: 'mint', color: 'bg-emerald-500', label: 'Mint' },
    { id: 'sakura', color: 'bg-rose-500', label: 'Sakura' },
    { id: 'ocean', color: 'bg-cyan-500', label: 'Ocean' },
    { id: 'violet', color: 'bg-violet-500', label: 'Violet' },
    { id: 'orange', color: 'bg-orange-500', label: 'Sunset' },
];

export function ThemeManager() {
  const { theme, toggleTheme, accentColor, setAccentColor, fontSize, setFontSize } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Palette className="w-5 h-5 text-indigo-500" />
        {t('appearance.title', 'Appearance')}
      </h3>

      <div className="space-y-6">
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {theme === 'dark' ? t('appearance.dark_mode', 'Dark Mode') : t('appearance.light_mode', 'Light Mode')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('appearance.theme_desc', 'Adjust the interface brightness')}
                    </div>
                </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={theme === 'dark'}
                    onChange={toggleTheme}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <Type className="w-4 h-4" />
                {t('appearance.font_size', 'Font Size')}
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
                {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                            fontSize === size
                                ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        {size === 'small' && 'Aa'}
                        {size === 'medium' && 'Aa'}
                        {size === 'large' && 'Aa'}
                        <span className="text-xs ml-1 opacity-60 capitalize">{size}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Accent Colors */}
        <div className="space-y-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
                {t('appearance.accent_color', 'Accent Color')}
            </div>
            <div className="flex flex-wrap gap-3">
                {colors.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => setAccentColor(c.id as any)}
                        className={`w-10 h-10 rounded-full ${c.color} transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ${
                            accentColor === c.id ? 'ring-gray-400 dark:ring-gray-500 scale-110' : 'ring-transparent'
                        }`}
                        title={c.label}
                        aria-label={`Select ${c.label} color`}
                    />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
