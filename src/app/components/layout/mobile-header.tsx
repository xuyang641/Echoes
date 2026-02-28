import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCircle, BookOpen, Mail, Grid, X, Calendar, Map as MapIcon, Sparkles, Heart, Target, Printer, GitCommit, WifiOff, CloudUpload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '@supabase/supabase-js';

interface MobileHeaderProps {
  user: User | null;
  isOffline?: boolean;
  pendingSyncCount?: number;
}

export function MobileHeader({ user, isOffline = false, pendingSyncCount = 0 }: MobileHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="md:hidden bg-white dark:bg-gray-900 sticky top-0 z-30 transition-all duration-300 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        {/* Avatar (Left) */}
        <div className="relative shrink-0" onClick={() => navigate('/account')}>
          <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
          {/* Online Status Dot */}
          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${isOffline ? 'bg-gray-400' : 'bg-green-500'}`}></div>
        </div>

        {/* Search Bar (Center) */}
        <div className="flex-1 flex justify-center items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Inbox / Messages (Right) */}
        <button className="shrink-0 p-1 relative text-gray-600 dark:text-gray-300">
          {pendingSyncCount > 0 ? (
             <CloudUpload className="w-6 h-6 text-blue-500 animate-pulse" />
          ) : (
             <Mail className="w-6 h-6" />
          )}
          
          {/* Badge if needed */}
          {pendingSyncCount > 0 && (
             <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-blue-500 transform translate-x-1/2 -translate-y-1/2"></span> 
          )}
        </button>
      </div>
      
      {/* Scrollable Navigation Bar (Below Header) */}
      <div className="px-2 pb-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex-1 overflow-x-auto no-scrollbar flex gap-4 pr-8">
          {[
            { path: '/', label: 'nav.timeline', active: location.pathname === '/' },
            { path: '/calendar', label: 'nav.calendar', active: location.pathname === '/calendar' },
            { path: '/map', label: 'nav.map', active: location.pathname === '/map' },
            { path: '/insights', label: 'nav.insights', active: location.pathname === '/insights' },
            { path: '/couple', label: 'nav.couple', active: location.pathname === '/couple' },
            { path: '/milestones', label: 'nav.milestones', active: location.pathname === '/milestones' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`whitespace-nowrap px-2 py-1 text-sm font-medium transition-colors relative shrink-0 ${
                item.active 
                ? 'text-pink-600 dark:text-pink-400' 
                : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {t(item.label)}
              {item.active && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 dark:bg-pink-400 rounded-full" 
                />
              )}
            </button>
          ))}
        </div>
        {/* Show All / More Button */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full shrink-0"
        >
          <Grid className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Menu Overlay (Full Functional Partitions) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 bg-white dark:bg-gray-900 pt-safe w-screen h-screen overflow-hidden overscroll-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">全部功能</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-4 pb-safe">
                {[
                  { path: '/', icon: BookOpen, label: 'nav.timeline', color: 'bg-blue-100 text-blue-600' },
                  { path: '/calendar', icon: Calendar, label: 'nav.calendar', color: 'bg-purple-100 text-purple-600' },
                  { path: '/map', icon: MapIcon, label: 'nav.map', color: 'bg-green-100 text-green-600' },
                  { path: '/insights', icon: Sparkles, label: 'nav.insights', color: 'bg-yellow-100 text-yellow-600' },
                  { path: '/couple', icon: Heart, label: 'nav.couple', color: 'bg-pink-100 text-pink-600' },
                  { path: '/milestones', icon: Target, label: 'nav.milestones', color: 'bg-orange-100 text-orange-600' },
                  { path: '/print', icon: Printer, label: 'nav.print', color: 'bg-indigo-100 text-indigo-600' },
                  { path: '/changelog', icon: GitCommit, label: 'nav.logs', color: 'bg-gray-100 text-gray-600' },
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color} dark:bg-opacity-20`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-center font-medium text-gray-600 dark:text-gray-300">{t(item.label)}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}