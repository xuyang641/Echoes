import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Calendar, Map as MapIcon, Heart, Target, Sparkles, Printer, GitCommit, PlusCircle, UserCircle, WifiOff, CloudUpload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InstallButton } from '../install-button';
import { ThemeSelector } from '../theme-selector';
import { ExportMenu } from '../export-menu';
import { Suspense } from 'react';
import type { DiaryEntry } from '../diary-entry-form';

interface DesktopHeaderProps {
  entries: DiaryEntry[];
  isAddOrEdit: boolean;
  isOffline?: boolean;
  pendingSyncCount?: number;
}

export function DesktopHeader({ entries, isAddOrEdit, isOffline = false, pendingSyncCount = 0 }: DesktopHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <header className="hidden md:block bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-30 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors tracking-tight font-serif" style={{ fontFamily: 'var(--font-serif)' }}>Echoes</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block font-handwriting" style={{ fontFamily: 'var(--font-handwriting)' }}>Capture your daily moments</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="flex items-center gap-3 shrink-0">
              {pendingSyncCount > 0 && (
                <div className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                  <CloudUpload className="w-3 h-3 animate-bounce" />
                  <span>{pendingSyncCount} 待同步</span>
                </div>
              )}
              <InstallButton />
              <ThemeSelector />
              {!isAddOrEdit && <div className="shrink-0"><Suspense fallback={null}><ExportMenu entries={entries} /></Suspense></div>}
            </div>

            {/* Desktop Navigation */}
            <nav className="flex gap-2 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-xl transition-colors overflow-x-auto max-w-full no-scrollbar">
              {[
                { path: '/', icon: BookOpen, label: 'nav.timeline' },
                { path: '/calendar', icon: Calendar, label: 'nav.calendar' },
                { path: '/map', icon: MapIcon, label: 'nav.map' },
                { path: '/couple', icon: Heart, label: 'nav.couple', color: 'text-pink-600 dark:text-pink-400' },
                { path: '/milestones', icon: Target, label: 'nav.milestones', color: 'text-amber-600 dark:text-amber-400' },
                { path: '/insights', icon: Sparkles, label: 'nav.insights' },
                { path: '/print', icon: Printer, label: 'nav.print' },
                { path: '/changelog', icon: GitCommit, label: 'nav.logs' },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap shrink-0 ${
                    location.pathname === item.path
                      ? `bg-white/80 dark:bg-gray-700/80 shadow-sm backdrop-blur-sm ${item.color || 'text-gray-900 dark:text-white'}`
                      : `${item.color ? 'text-gray-500 dark:text-gray-400 hover:' + item.color.split(' ')[0] : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{t(item.label)}</span>
                </button>
              ))}
            </nav>

            <button
              onClick={() => navigate('/add')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('nav.add')}</span>
            </button>

            <button
              onClick={() => navigate('/account')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex-shrink-0"
              title={t('nav.account')}
            >
              <UserCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}