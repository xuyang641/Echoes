import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Calendar, Map as MapIcon, Heart, Target, Sparkles, Printer, GitCommit, PlusCircle, Settings, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InstallButton } from '../install-button';
import { ThemeSelector } from '../theme-selector';
import { ExportMenu } from '../export-menu';
import { useAuth } from '../../context/AuthContext';
import { Suspense } from 'react';
import type { DiaryEntry } from '../diary-entry-form';

export function DesktopSidebar({ entries = [] }: { entries?: DiaryEntry[] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  const mainNavItems = [
    { path: '/', icon: BookOpen, label: 'nav.timeline' },
    { path: '/calendar', icon: Calendar, label: 'nav.calendar' },
    { path: '/map', icon: MapIcon, label: 'nav.map' },
    { path: '/couple', icon: Heart, label: 'nav.couple', color: 'text-pink-600 dark:text-pink-400' },
    { path: '/insights', icon: Sparkles, label: 'nav.insights' },
  ];

  const secondaryNavItems = [
    { path: '/milestones', icon: Target, label: 'nav.milestones', color: 'text-amber-600 dark:text-amber-400' },
    { path: '/print', icon: Printer, label: 'nav.print' },
    { path: '/changelog', icon: GitCommit, label: 'nav.logs' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-800/50 shrink-0 z-30 transition-all duration-300">
      {/* Header / Logo */}
      <div className="p-6 pb-4 cursor-pointer" onClick={() => navigate('/')}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden">
            <img src="/icons/icon-192.webp" alt="Echoes Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              Echoes
            </span>
            <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase -mt-1 font-handwriting" style={{ fontFamily: 'var(--font-handwriting)' }}>
              Capture moments
            </span>
          </div>
        </div>
      </div>

      {/* Main Action */}
      <div className="px-4 py-2">
        <button
          onClick={() => navigate('/add')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <PlusCircle className="w-5 h-5" />
          <span>{t('nav.add')}</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-8">
        
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">视图</p>
          {mainNavItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                location.pathname === item.path
                  ? `bg-gray-100/80 dark:bg-gray-800/80 shadow-sm ${item.color || 'text-gray-900 dark:text-white font-medium'}`
                  : `${item.color ? 'text-gray-500 dark:text-gray-400 hover:' + item.color.split(' ')[0] : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} hover:bg-gray-50 dark:hover:bg-gray-800/50`
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{t(item.label)}</span>
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">探索</p>
          {secondaryNavItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                location.pathname === item.path
                  ? `bg-gray-100/80 dark:bg-gray-800/80 shadow-sm ${item.color || 'text-gray-900 dark:text-white font-medium'}`
                  : `${item.color ? 'text-gray-500 dark:text-gray-400 hover:' + item.color.split(' ')[0] : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} hover:bg-gray-50 dark:hover:bg-gray-800/50`
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{t(item.label)}</span>
            </button>
          ))}
        </div>

      </div>

      {/* Footer Settings / User */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50 space-y-2">
        <div className="flex items-center justify-between px-2 pb-2">
          <ThemeSelector />
          <div className="flex items-center gap-2">
            <InstallButton />
            <Suspense fallback={null}><ExportMenu entries={entries} /></Suspense>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/account')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-5 h-5" />
            )}
          </div>
          <div className="flex flex-col items-start truncate">
            <span className="font-medium text-gray-900 dark:text-white truncate w-full">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </span>
            <span className="text-xs text-gray-500 truncate w-full">
              {t('nav.account')}
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
}
