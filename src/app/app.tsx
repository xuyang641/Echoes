import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { PlusCircle, BookOpen, Loader2, Calendar, LogOut, GitCommit, Map as MapIcon, Sparkles, Printer, UserCircle, Heart, Bot, Target, Menu, X } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { DiaryEntryForm, type DiaryEntry } from './components/diary-entry-form';
import { AIChatView } from './components/ai-chat-view';
import { TimelineView } from './components/timeline-view';
import { CalendarView } from './components/calendar-view';
import { MapView } from './components/map-view';
import { InsightsView } from './components/insights-view';
import { MilestonesView } from './components/milestones-view';
import { ExportMenu } from './components/export-menu';
import { ChangelogView } from './components/changelog-view';
import { PrintShopView } from './components/print-shop-view';
import { AccountView } from './components/account-view';
import { CoupleSplitView } from './components/couple-split-view';
import { ThemeProvider } from './context/ThemeContext';
import { GroupProvider } from './context/GroupContext';
import { FriendProvider } from './context/FriendContext';
import { ThemeSelector } from './components/theme-selector';
import { InstallButton } from './components/install-button';
import { WelcomeModal } from './components/welcome-modal';
import { Footer } from './components/footer';
import { AboutView, PrivacyView, TermsView } from './components/legal-pages';
import { SubscriptionView } from './components/subscription-view';
import { fetchEntries, createEntry, deleteEntry, updateEntry } from './utils/api';
import { useAuth } from './context/AuthContext';
import { useGroup } from './context/GroupContext';
import { supabase } from './utils/supabaseClient';
import { LoginForm } from './components/auth/login-form';
import { offlineStorage } from './services/offline-storage';

import { useTranslation } from 'react-i18next';
import { ReloadPrompt } from './components/reload-prompt';

import { AnimatePresence, motion } from 'framer-motion';

import { SharedBookView } from './components/shared-book-view';

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
  const { user, loading: authLoading, signOut } = useAuth();
  const { currentGroupId } = useGroup();
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

  const FloatingAIButton = () => (
    <button
      onClick={() => setIsAIChatOpen(true)}
      className="fixed bottom-24 right-6 md:bottom-6 md:right-6 z-40 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
    >
      <Bot className="w-6 h-6 animate-pulse" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Chat with Memories
      </span>
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
        promises.push(createEntry(payload).then(newEntry => {
          // Update ID if server returns a real one (though we might use UUIDs on client)
          // For now, assume client ID is fine or server returns same data
        }));
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
                        date: entry.date
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">Echoes</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block" style={{ fontFamily: '"Dancing Script", cursive' }}>Capture your daily moments</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="hidden md:flex items-center gap-3 shrink-0">
                 <InstallButton />
                 <ThemeSelector />
                 {!isAddOrEdit && <div className="shrink-0"><ExportMenu entries={entries} /></div>}
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex gap-2 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-xl transition-colors overflow-x-auto max-w-full no-scrollbar">
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
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('nav.add')}</span>
              </button>

              <button
                onClick={() => navigate('/account')}
                className="hidden md:flex p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex-shrink-0"
                title={t('nav.account')}
              >
                <UserCircle className="w-5 h-5" />
              </button>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg shrink-0"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xl"
            >
              <div className="px-4 py-6 space-y-6">
                 <div className="flex items-center justify-between gap-4 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                     <InstallButton />
                     <ThemeSelector />
                     {!isAddOrEdit && <ExportMenu entries={entries} />}
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    {[
                      { path: '/', icon: BookOpen, label: 'nav.timeline' },
                      { path: '/add', icon: PlusCircle, label: 'nav.add' },
                      { path: '/calendar', icon: Calendar, label: 'nav.calendar' },
                      { path: '/map', icon: MapIcon, label: 'nav.map' },
                      { path: '/couple', icon: Heart, label: 'nav.couple', color: 'text-pink-600 dark:text-pink-400' },
                      { path: '/milestones', icon: Target, label: 'nav.milestones', color: 'text-amber-600 dark:text-amber-400' },
                      { path: '/insights', icon: Sparkles, label: 'nav.insights' },
                      { path: '/print', icon: Printer, label: 'nav.print' },
                      { path: '/changelog', icon: GitCommit, label: 'nav.logs' },
                      { path: '/account', icon: UserCircle, label: 'nav.account' },
                    ].map(item => (
                      <button
                        key={item.path}
                        onClick={() => {
                            navigate(item.path);
                            setIsMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 p-4 rounded-xl text-sm transition-all border ${
                          location.pathname === item.path
                            ? `bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 font-medium ${item.color || 'text-gray-900 dark:text-white'}`
                            : `border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 ${item.color ? 'text-gray-600 dark:text-gray-400' : 'text-gray-600 dark:text-gray-400'}`
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{t(item.label)}</span>
                      </button>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <MapView entries={entries} />
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
      </main>

      {/* Floating Action Button - Mobile */}
      {!isAddOrEdit && location.pathname !== '/changelog' && (
        <button
          onClick={() => navigate('/add')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center md:hidden z-50"
          aria-label="Add new entry"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
      )}

      {!isAddOrEdit && <FloatingAIButton />}

      <AIChatView 
        entries={entries}
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />

      <WelcomeModal />
      <Footer />
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
