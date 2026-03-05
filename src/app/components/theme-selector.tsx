import { Moon, Sun, Palette, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useTranslation } from 'react-i18next';

export function ThemeSelector() {
  const { theme, toggleTheme, accentColor, setAccentColor, backgroundVideo, setBackgroundVideo, fontFamily, setFontFamily } = useTheme();
  const { t } = useTranslation();

  const colors = [
    { name: 'blue', class: 'bg-blue-500', label: 'appearance.colors.blue' },
    { name: 'purple', class: 'bg-purple-500', label: 'appearance.colors.purple' },
    { name: 'pink', class: 'bg-pink-500', label: 'appearance.colors.pink' },
    { name: 'orange', class: 'bg-orange-500', label: 'appearance.colors.orange' },
    { name: 'green', class: 'bg-green-500', label: 'appearance.colors.green' },
    { name: 'mint', class: 'bg-emerald-500', label: 'appearance.colors.mint' },
    { name: 'sakura', class: 'bg-rose-500', label: 'appearance.colors.sakura' },
    { name: 'ocean', class: 'bg-cyan-500', label: 'appearance.colors.ocean' },
    { name: 'violet', class: 'bg-violet-500', label: 'appearance.colors.violet' },
  ] as const;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={t('appearance.title')}
        >
          <Palette className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-h-[80vh] overflow-y-auto">
        <div className="space-y-5">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{theme === 'dark' ? t('appearance.dark_mode') : t('appearance.light_mode')}</span>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
              />
              <span className="absolute left-1.5 top-1.5 text-[10px] text-gray-500">
                <Sun className={`w-3 h-3 ${theme === 'dark' ? 'opacity-0' : 'opacity-100'}`} />
              </span>
              <span className="absolute right-1.5 top-1.5 text-[10px] text-white">
                <Moon className={`w-3 h-3 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`} />
              </span>
            </button>
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-800" />

          {/* Color Selector */}
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 block">{t('appearance.accent_color')}</span>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setAccentColor(color.name as any)}
                  className={`w-8 h-8 rounded-full ${color.class} flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-gray-400`}
                  title={t(color.label)}
                >
                  {accentColor === color.name && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-800" />

          {/* Background Video */}
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 block">{t('appearance.immersive_bg')}</span>
            <div className="grid grid-cols-3 gap-2">
                {[
                    { id: 'none', label: 'appearance.bg_none' },
                    { id: 'rain', label: 'appearance.bg_rain' },
                    { id: 'forest', label: 'appearance.bg_forest' },
                ].map(bg => (
                    <button
                        key={bg.id}
                        onClick={() => setBackgroundVideo(bg.id as any)}
                        className={`px-2 py-2 text-xs rounded-md border transition-all ${
                            backgroundVideo === bg.id
                                ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300 ring-1 ring-blue-500'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                    >
                        {t(bg.label)}
                    </button>
                ))}
            </div>
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-800" />

          {/* Font Family */}
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 block">{t('appearance.font_style')}</span>
            <div className="grid grid-cols-2 gap-2">
                {[
                    { id: 'sans', label: 'appearance.font_sans', font: 'sans-serif' },
                    { id: 'serif', label: 'appearance.font_serif', font: 'serif' },
                    { id: 'lxgw', label: 'appearance.font_lxgw', font: '"LXGW WenKai", serif' },
                    { id: 'mashanzheng', label: 'appearance.font_mashanzheng', font: '"Ma Shan Zheng", cursive' },
                    { id: 'zcool', label: 'appearance.font_zcool', font: '"ZCOOL KuaiLe", cursive' },
                ].map(font => (
                    <button
                        key={font.id}
                        onClick={() => setFontFamily(font.id as any)}
                        className={`px-2 py-2 text-xs rounded-md border transition-all truncate ${
                            fontFamily === font.id
                                ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300 ring-1 ring-blue-500'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                        style={{ fontFamily: font.font }}
                    >
                        {t(font.label)}
                    </button>
                ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}