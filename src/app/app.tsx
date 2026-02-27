import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { PlusCircle, BookOpen, Loader2, Calendar, GitCommit, Map as MapIcon, Sparkles, Printer, UserCircle, Heart, Bot, Target, X, Home, Mail, Grid } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { DiaryEntryForm, type DiaryEntry } from './components/diary-entry-form';
import { AIChatView } from './components/ai-chat-view';
// Lazy load views
const TimelineView = lazy(() => import('./components/timeline-view').then(module => ({ default: module.TimelineView })));
const CalendarView = lazy(() => import('./components/calendar-view').then(module => ({ default: module.CalendarView })));
const MapView = lazy(() => import('./components/map-view').then(module => ({ default: module.MapView })));
const InsightsView = lazy(() => import('./components/insights-view').then(module => ({ default: module.InsightsView })));
const MilestonesView = lazy(() => import('./components/milestones-view').then(module => ({ default: module.MilestonesView })));
const ExportMenu = lazy(() => import('./components/export-menu').then(module => ({ default: module.ExportMenu })));
const ChangelogView = lazy(() => import('./components/changelog-view').then(module => ({ default: module.ChangelogView })));
const PrintShopView = lazy(() => import('./components/print-shop-view').then(module => ({ default: module.PrintShopView })));
const AccountView = lazy(() => import('./components/account-view').then(module => ({ default: module.AccountView })));
const CoupleSplitView = lazy(() => import('./components/couple-split-view').then(module => ({ default: module.CoupleSplitView })));
const SharedBookView = lazy(() => import('./components/shared-book-view').then(module => ({ default: module.SharedBookView })));
const AboutView = lazy(() => import('./components/legal-pages').then(module => ({ default: module.AboutView })));
const PrivacyView = lazy(() => import('./components/legal-pages').then(module => ({ default: module.PrivacyView })));
const TermsView = lazy(() => import('./components/legal-pages').then(module => ({ default: module.TermsView })));
const SubscriptionView = lazy(() => import('./components/subscription-view').then(module => ({ default: module.SubscriptionView })));

import { ThemeProvider } from './context/ThemeContext';
import { GroupProvider } from './context/GroupContext';
import { FriendProvider } from './context/FriendContext';
import { ThemeSelector } from './components/theme-selector';
import { InstallButton } from './components/install-button';
import { WelcomeModal } from './components/welcome-modal';
import { Footer } from './components/footer';
import { fetchEntries, createEntry, deleteEntry, updateEntry } from './utils/api';
import { useAuth } from './context/AuthContext';
import { supabase } from './utils/supabaseClient';
import { LoginForm } from './components/auth/login-form';
import { offlineStorage } from './services/offline-storage';
import { useTranslation } from 'react-i18next';
import { ReloadPrompt } from './components/reload-prompt';
import { AnimatePresence, motion } from 'framer-motion';
import { App as CapacitorApp } from '@capacitor/app';

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export default function App() {
  return (
    <ThemeProvider>
      <GroupProvider>
        <FriendProvider>
          <AppContent />
          <ReloadPrompt />
          <Toaster position="top-center" reverseOrder={false} />
        </FriendProvider>
      </GroupProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useState(new URLSearchParams(location.search));

  // Handle Deep Linking
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'print') {
      navigate('/print' + location.search);
    }
  }, [searchParams, navigate]);

  // Handle Deep Links (OAuth Callback)
  useEffect(() => {
    CapacitorApp.addListener('appUrlOpen', (data) => {
      console.log('App opened with URL:', data.url);
      
      // Handle Supabase Auth Callback
      if (data.url.includes('login-callback')) {
        // Extract tokens from URL fragment if present (implicit flow)
        // or just let Supabase client handle the session recovery if it detected the URL opening
        
        // Specifically for PKCE flow which is default in recent Supabase:
        // The URL usually looks like: com.echoes.app://login-callback#access_token=...&refresh_token=...
        
        const params = new URLSearchParams(data.url.split('#')[1]);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            }).then(({ error }) => {
                if (!error) {
                    toast.success('Successfully logged in!');
                    navigate('/');
                } else {
                    toast.error('Login failed: ' + error.message);
                }
            });
        }
      }
    });

    return () => {
        CapacitorApp.removeAllListeners();
    };
  }, [navigate]);

  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- Swipe Navigation Logic ---
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Define the order of tabs for swipe navigation
  const tabs = ['/', '/calendar', '/map', '/insights', '/couple', '/milestones'];

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    // Disable swipe navigation on Map view to prevent conflict with map panning
    if (location.pathname === '/map') return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.indexOf(location.pathname);
      if (currentIndex !== -1) {
        if (isLeftSwipe && currentIndex < tabs.length - 1) {
          navigate(tabs[currentIndex + 1]);
        }
        if (isRightSwipe && currentIndex > 0) {
          navigate(tabs[currentIndex - 1]);
        }
      }
    }
  };
  // ------------------------------

  // Scroll detection for AI Button visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const FloatingAIButton = () => (
    <button
      onClick={() => setIsAIChatOpen(true)}
      className={`fixed right-6 z-40 p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group ${
        scrollDirection === 'down' ? 'translate-x-24 opacity-50' : 'translate-x-0 opacity-100'
      } bottom-24 md:bottom-6`}
    >
      <Bot className="w-6 h-6" />
    </button>
  );

  // Load entries from server on mount
  useEffect(() => {
    if (user?.id) {
      loadEntries();
    }
  }, [user?.id]);

  async function loadEntries() {
    try {
      setLoading(true);
      
      // 1. Try to load from IndexedDB first (Offline-first)
      try {
        const cachedEntries = await offlineStorage.getEntries();
        if (cachedEntries.length > 0) {
          setEntries(cachedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } else {
          // Fallback to localStorage if IndexedDB is empty (migration path)
          const stored = localStorage.getItem('photo-diary-entries');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setEntries(parsed);
              // Migrate to IndexedDB
              await offlineStorage.saveEntries(parsed);
            } catch (e) {
              console.error('Error parsing stored entries:', e);
            }
          }
        }
      } catch (dbError) {
        console.error('Failed to load from offline storage:', dbError);
      }

      // 2. Fetch from API (Network)
      if (navigator.onLine) {
        const data = await fetchEntries();
        // Sort by date desc
        const sortedData = data.sort((a: DiaryEntry, b: DiaryEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEntries(sortedData);
        // Update cache
        await offlineStorage.saveEntries(sortedData);
      }
    } catch (error) {
      console.error('Failed to load entries from API:', error);
      toast.error('Offline mode: Showing cached entries');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEntry(entry: DiaryEntry, targetGroups: string[] = ['private']) {
    try {
      setSaving(true);
      const payload = {
        photo: entry.photo,
        caption: entry.caption,
        mood: entry.mood,
        date: entry.date,
        location: entry.location,
        tags: entry.tags || [],
        aiTags: entry.aiTags || [],
        palette: entry.palette,
        likes: entry.likes || [],
        comments: entry.comments || [],
      };

      // 1. Optimistic UI Update & Offline Save
      const newEntryWithId = { ...entry, ...payload };
      setEntries(prev => [newEntryWithId, ...prev]);
      await offlineStorage.saveEntry(newEntryWithId);

      if (!navigator.onLine) {
        await offlineStorage.addPendingAction({
          type: 'create',
          payload: { entry: newEntryWithId, targetGroups },
          targetGroups,
          timestamp: Date.now()
        });
        toast.success('Saved offline. Will sync when online.', {
          icon: '📡',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
        if (targetGroups.includes('private') && targetGroups.length === 1) {
          navigate('/');
        } else {
          navigate('/map');
        }
        return;
      }

      const promises = [];

      // 2. Save to Private (Edge Function / API) if selected
      if (targetGroups.includes('private')) {
        console.log('Saving to Private Diary...');
        promises.push(createEntry(payload));
      }

      // 3. Save to Groups (Supabase) if selected
      const groupIds = targetGroups.filter(id => id !== 'private');
      if (groupIds.length > 0 && user) {
        console.log('Saving to Groups:', groupIds);
        const groupInserts = groupIds.map(async (groupId) => {
          const { error } = await supabase.from('diary_entries').insert({
            user_id: user.id,
            group_id: groupId,
            photo_url: payload.photo,
            caption: payload.caption,
            mood: payload.mood,
            location: payload.location,
            date: payload.date
          });
          
          if (error) {
            console.error(`Error saving to group ${groupId}:`, error);
            throw new Error(`Failed to save to group: ${error.message}`);
          }
        });
        promises.push(...groupInserts);
      }

      await Promise.all(promises);
      
      toast.success('Memory saved successfully!', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      
      // Navigate based on context
      if (targetGroups.includes('private') && targetGroups.length === 1) {
        navigate('/');
      } else {
        navigate('/map'); // Go to map to see group entries
      }

    } catch (error) {
      console.error('Failed to create entry:', error);
      // Even if API fails, we have it in offline storage. 
      // Maybe we should queue it for sync?
      // For now, just show error but keep data in UI/Storage
      toast.error('Network error. Saved offline.');
      await offlineStorage.addPendingAction({
          type: 'create',
          payload: {
            entry: {
              ...entry,
              tags: entry.tags || [],
              aiTags: entry.aiTags || []
            },
            targetGroups
          },
          targetGroups,
          timestamp: Date.now()
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateEntry(entry: DiaryEntry, targetGroups: string[]) {
    try {
      setSaving(true);
      const payload = {
        photo: entry.photo,
        caption: entry.caption,
        mood: entry.mood,
        date: entry.date,
        location: entry.location,
        tags: entry.tags || [],
        aiTags: entry.aiTags || [],
        palette: entry.palette,
      };
      
      // 1. Optimistic Update
      const updatedEntry = { ...entry, ...payload };
      setEntries(prev => prev.map(e => e.id === entry.id ? updatedEntry : e));
      await offlineStorage.saveEntry(updatedEntry);

      if (!navigator.onLine) {
        await offlineStorage.addPendingAction({
          type: 'update',
          payload: { id: entry.id, payload, targetGroups },
          targetGroups,
          timestamp: Date.now()
        });
        toast.success('Updated offline. Will sync when online.', { icon: '📡' });
        navigate('/');
        return;
      }

      console.log('Updating entry with payload:', payload);

      // Note: Update currently only supports updating Personal Entries in Edge Function
      // Group Entry updates are more complex (need to update Supabase row)
      // For now, we only update the personal copy if it exists.
      
      await updateEntry(entry.id, payload);

      toast.success('Memory updated successfully!');
      navigate('/');
    } catch (error) {
      console.error('Failed to update entry:', error);
      toast.error('Network error. Saved offline.');
      await offlineStorage.addPendingAction({
          type: 'update',
          payload: { id: entry.id, payload: {
            photo: entry.photo,
            caption: entry.caption,
            mood: entry.mood,
            date: entry.date,
            location: entry.location,
            tags: entry.tags || [],
            aiTags: entry.aiTags || [],
            palette: entry.palette,
            likes: entry.likes || [],
            comments: entry.comments || [],
          }, targetGroups },
          targetGroups,
          timestamp: Date.now()
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEntry(id: string) {
    try {
      // 1. Optimistic Delete
      setEntries(prev => prev.filter(entry => entry.id !== id));
      await offlineStorage.deleteEntry(id);

      if (!navigator.onLine) {
        await offlineStorage.addPendingAction({
          type: 'delete',
          payload: { id },
          targetGroups: ['private'], // Assuming delete is for private mainly
          timestamp: Date.now()
        });
        toast.success('Deleted locally. Will sync when online.', { icon: '🗑️' });
        return;
      }

      await deleteEntry(id);
      toast.success('Memory deleted.');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast.error('Network error. Queued for deletion.');
      await offlineStorage.addPendingAction({
          type: 'delete',
          payload: { id },
          targetGroups: ['private'],
          timestamp: Date.now()
      });
    }
  }

  // Sync Effect
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Online! Syncing pending actions...');
      const actions = await offlineStorage.getPendingActions();
      if (actions.length === 0) return;

      toast.loading(`Syncing ${actions.length} pending changes...`, { id: 'sync-toast' });

      for (const action of actions) {
        try {
          if (action.type === 'create') {
            const { entry, targetGroups } = action.payload;
            // Re-use logic or call API directly
            // For simplicity, calling APIs directly here
            if (targetGroups.includes('private')) {
               await createEntry(entry);
            }
            // Group sync logic... (simplified)
            const groupIds = targetGroups.filter((id: string) => id !== 'private');
            if (groupIds.length > 0 && user) {
                await Promise.all(groupIds.map((groupId: string) => 
                    supabase.from('diary_entries').insert({
                        user_id: user.id,
                        group_id: groupId,
                        photo_url: entry.photo,
                        caption: entry.caption,
                        mood: entry.mood,
                        location: entry.location,
                        date: entry.date,
                        likes: entry.likes || [],
                        comments: entry.comments || []
                    })
                ));
            }
          } else if (action.type === 'update') {
             const { id, payload } = action.payload;
             await updateEntry(id, payload);
          } else if (action.type === 'delete') {
             const { id } = action.payload;
             await deleteEntry(id);
          }
          
          if (action.id) await offlineStorage.removePendingAction(action.id);
        } catch (err) {
          console.error('Sync failed for action:', action, err);
        }
      }
      toast.success('Sync complete!', { id: 'sync-toast' });
      // Refresh to ensure consistency
      loadEntries();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const isAddOrEdit = location.pathname === '/add' || location.pathname.startsWith('/edit');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 pb-20 md:pb-0">
      {/* Header - Desktop */}
      <header className="hidden md:block bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">光阴</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block" style={{ fontFamily: '"Dancing Script", cursive' }}>记录你的日常点滴</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="flex items-center gap-3 shrink-0">
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

      {/* Header - Mobile (Bilibili Style) */}
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
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
            </div>

            {/* Search Bar (Center) */}
            <div className="flex-1 flex justify-center items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                    <BookOpen className="w-5 h-5 text-white" />
                </div>
            </div>

            {/* Inbox / Messages (Right) */}
            <button className="shrink-0 p-1 relative text-gray-600 dark:text-gray-300">
                <Mail className="w-6 h-6" />
                {/* Badge if needed */}
                {/* <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500 transform translate-x-1/2 -translate-y-1/2"></span> */}
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

      {/* Main Content */}
      <main 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 min-h-[calc(100vh-140px)]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        }>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <PageTransition>
                <TimelineView 
                  entries={entries} 
                  onDeleteEntry={handleDeleteEntry} 
                  loading={loading}
                />
              </PageTransition>
            } />
            <Route path="/calendar" element={
              <PageTransition>
                <CalendarView 
                  entries={entries} 
                  onDeleteEntry={handleDeleteEntry} 
                />
              </PageTransition>
            } />
            <Route path="/couple" element={
              <PageTransition>
                <CoupleSplitView />
              </PageTransition>
            } />
            <Route path="/map" element={
              <PageTransition>
                <MapView entries={entries} onUpdateEntry={handleUpdateEntry} />
              </PageTransition>
            } />
            <Route path="/insights" element={
              <PageTransition>
                <InsightsView entries={entries} />
              </PageTransition>
            } />
            <Route path="/milestones" element={
              <PageTransition>
                <MilestonesView entries={entries} />
              </PageTransition>
            } />
            <Route path="/print" element={
              <PageTransition>
                <PrintShopView entries={entries} />
              </PageTransition>
            } />
            <Route path="/account" element={
              <PageTransition>
                <AccountView />
              </PageTransition>
            } />
            <Route path="/changelog" element={
              <PageTransition>
                <ChangelogView />
              </PageTransition>
            } />
            <Route path="/about" element={
              <PageTransition>
                <AboutView />
              </PageTransition>
            } />
            <Route path="/privacy" element={
              <PageTransition>
                <PrivacyView />
              </PageTransition>
            } />
            <Route path="/terms" element={
              <PageTransition>
                <TermsView />
              </PageTransition>
            } />
            <Route path="/subscription" element={
              <PageTransition>
                <SubscriptionView />
              </PageTransition>
            } />
            <Route path="/share/book/:id" element={
              <PageTransition>
                <SharedBookView />
              </PageTransition>
            } />
            <Route path="/add" element={
              <PageTransition>
                <div className="max-w-2xl mx-auto">
                  <DiaryEntryForm onSave={handleAddEntry} saving={saving} />
                </div>
              </PageTransition>
            } />
            <Route path="/edit/:id" element={
              <PageTransition>
                <div className="max-w-2xl mx-auto">
                  {/* Logic to find entry by ID */}
                  <EditEntryWrapper entries={entries} onSave={handleUpdateEntry} saving={saving} loading={loading} />
                </div>
              </PageTransition>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </AnimatePresence>
        </Suspense>
      </main>

      {/* Floating Action Button - Mobile (REMOVED - Replaced by Bottom Nav) */}
      
      {!isAddOrEdit && <FloatingAIButton />}

      <AIChatView  
        entries={entries}
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />

      <WelcomeModal />
      <Footer />
      
      {/* Mobile Bottom Navigation Bar */}
      {!isAddOrEdit && !isAIChatOpen && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe z-50 flex justify-around items-center h-16">
            <button 
                onClick={() => navigate('/')}
                className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${
                    location.pathname === '/' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                }`}
            >
                <Home className={`w-6 h-6 ${location.pathname === '/' ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-medium">{t('nav.timeline')}</span>
            </button>
            
            <button 
                onClick={() => navigate('/add')}
                className="flex flex-col items-center justify-center w-16 h-full -mt-6"
            >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg text-white">
                    <PlusCircle className="w-7 h-7" />
                </div>
            </button>

            <button 
                onClick={() => navigate('/account')}
                className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${
                    location.pathname === '/account' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                }`}
            >
                <UserCircle className={`w-6 h-6 ${location.pathname === '/account' ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-medium">{t('nav.account')}</span>
            </button>
        </nav>
      )}
    </div>
  );
}

// Wrapper to handle finding the entry for editing
function EditEntryWrapper({ entries, onSave, saving, loading }: { entries: DiaryEntry[], onSave: (entry: DiaryEntry, targetGroups: string[]) => void, saving: boolean, loading: boolean }) {
  const { id } = useParams();
  const entry = entries.find(e => e.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl text-gray-900">Entry not found</h3>
        <p className="text-gray-500 mt-2">The memory you are trying to edit does not exist.</p>
      </div>
    );
  }

  return <DiaryEntryForm initialData={entry} onSave={onSave} saving={saving} isEdit />;
}
