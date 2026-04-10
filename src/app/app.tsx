import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { AIChatView } from './components/ai-chat-view';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { GroupProvider } from './context/GroupContext';
import { FriendProvider } from './context/FriendContext';
import { OnboardingTutorial } from './components/onboarding-tutorial';
import { WelcomeModal } from './components/welcome-modal';
import { Footer } from './components/footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './utils/supabaseClient';
import { LoginForm } from './components/auth/login-form';
import { LandingPage } from './components/landing-page';
import { ReloadPrompt } from './components/reload-prompt';
import { App as CapacitorApp } from '@capacitor/app';

// Layout Components
import { DesktopSidebar } from './components/layout/desktop-sidebar';
import { DesktopRightPanel } from './components/layout/desktop-right-panel';
import { MobileHeader } from './components/layout/mobile-header';
import { MobileNavigation } from './components/layout/mobile-navigation';

// Managers & Routes
import { InteractionManager } from './components/managers/interaction-manager';
import { NotificationManager } from './components/managers/notification-manager';
import { MigrationManager } from './components/managers/migration-manager'; // New import
import { AppRoutes } from './routes/app-routes';
import { useDiaryStore } from './store/diary-store';
import { useDiarySync } from './hooks/useDiarySync';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GroupProvider>
          <FriendProvider>
            <Toaster position="top-center" reverseOrder={false} />
            <NotificationManager>
              {() => (
                <MigrationManager>
                  <AppContent />
                </MigrationManager>
              )}
            </NotificationManager>
            <ReloadPrompt />
          </FriendProvider>
        </GroupProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { backgroundVideo } = useTheme();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Ensure hooks are called before any conditional returns
  useDiarySync();
  const diaryStore = useDiaryStore();

  // Listen for welcome entry creation event from WelcomeModal
  useEffect(() => {
    const handleCreateWelcomeEntry = (event: CustomEvent) => {
        const entry = event.detail;
        if (entry) {
            // Using addEntry is async, but we don't need to await it here
            // Just ensure it's called.
            // Note: addEntry in diaryStore handles both online and offline persistence
            // The second argument is targetGroups which expects string[]
            diaryStore.addEntry(entry, ['private']).catch(err => {
                console.error("Failed to save welcome entry:", err);
                // Even if network fails, offline persistence should work if configured correctly
            });
            toast.success('欢迎日记已生成！', { icon: '✨' });
        }
    };
    window.addEventListener('create-welcome-entry', handleCreateWelcomeEntry as EventListener);
    return () => window.removeEventListener('create-welcome-entry', handleCreateWelcomeEntry as EventListener);
  }, [diaryStore]);

  // Check for tutorial on mount
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome_v1');
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial_v1');
    
    if (hasSeenWelcome && !hasSeenTutorial) {
        setShowTutorial(true);
    }
  }, []);

  const handleWelcomeComplete = () => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial_v1');
    if (!hasSeenTutorial) {
        setShowTutorial(true);
    }
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial_v1', 'true');
  };

  // Handle Deep Links (OAuth Callback)
  useEffect(() => {
    CapacitorApp.addListener('appUrlOpen', (data) => {
      console.log('App opened with URL:', data.url);
      
      // Handle Supabase Auth Callback
      if (data.url.includes('login-callback')) {
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
                    toast.error('Login failed: ' + (error ? error.message : 'Unknown error'));
                }
            });
        }
      }
    });

    return () => {
        CapacitorApp.removeAllListeners();
    };
  }, [navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Handle unauthenticated state
  if (!user) {
    // Check if we are on the login page
    if (location.pathname === '/login') {
      return <LoginForm />;
    }
    // Otherwise show landing page
    return <LandingPage />;
  }

  // Destructure after checks, but hooks ran above
  const { entries, loading, saving, addEntry, updateEntry, deleteEntry, refresh } = diaryStore;

  return (
    <InteractionManager onAIChatOpen={() => setIsAIChatOpen(true)}>
      {({ onTouchStart, onTouchMove, onTouchEnd }) => (
        <div className={`min-h-screen md:h-screen transition-colors duration-300 relative overflow-hidden ${
            backgroundVideo === 'none' 
              ? 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900' 
              : 'bg-black/20'
          }`}>
          
          {/* Background Video */}
          {backgroundVideo !== 'none' && (
            <>
              <div 
                className="fixed inset-0 w-full h-full bg-cover bg-center z-0 pointer-events-none"
                style={{
                    backgroundImage: backgroundVideo === 'rain' 
                        ? 'url(/images/backgrounds/ocean-sunset.jpg)' 
                        : 'url(/images/backgrounds/forest-morning.jpg)'
                }}
              />
              <div className="fixed inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-[2px] z-0 pointer-events-none" />
            </>
          )}

          {/* Content Wrapper */}
          <div className="relative z-10 flex flex-col md:flex-row h-full">
            
            {/* Desktop Left Sidebar */}
            <DesktopSidebar entries={entries} />

            {/* Mobile Header (Hidden on Desktop) */}
            <div className="md:hidden">
              <MobileHeader user={user} />
            </div>

            {/* Main Content Area */}
            <main 
              className="flex-1 overflow-y-auto overflow-x-hidden relative w-full h-[100vh] bg-[#F9FAFB] dark:bg-[#0A0A0A]"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              id="main-scroll-container"
            >
              <div className="w-full h-full min-h-full max-w-[1600px] mx-auto flex flex-col relative px-4 sm:px-6 lg:px-8">
                {(() => {
                  const deleteEntrySafe = async (id: string): Promise<void> => {
                    await deleteEntry(id);
                  };
                  const addEntrySafe = async (entry: any, targetGroups: string[]): Promise<void> => {
                    await addEntry(entry, targetGroups);
                  };
                  const updateEntrySafe = async (entry: any, targetGroups: string[]): Promise<void> => {
                    await updateEntry(entry, targetGroups);
                  };

                  return (
                    <>
                      <div className={`w-full relative z-10 ${location.pathname === '/' || location.pathname === '/map' ? 'h-full flex-1 overflow-hidden py-4 md:py-8' : 'flex-1 pb-16 py-4 md:py-8'}`}>
                        <AppRoutes 
                          entries={entries} 
                          loading={loading} 
                          saving={saving} 
                          onDeleteEntry={deleteEntrySafe} 
                          onAddEntry={addEntrySafe} 
                          onUpdateEntry={updateEntrySafe} 
                          onRefresh={refresh}
                        />
                      </div>
                      {/* Only show Footer on non-timeline pages */}
                      {location.pathname !== '/' && location.pathname !== '/map' && (
                        <div className="w-full shrink-0 relative z-20">
                          <Footer />
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </main>

            {/* Desktop Right Panel (Only show on Add/Edit routes or Insights) */}
            {(location.pathname === '/add' || location.pathname.startsWith('/edit')) && (
              <DesktopRightPanel entries={entries} />
            )}

            <AIChatView  
              entries={entries}
              isOpen={isAIChatOpen}
              onClose={() => setIsAIChatOpen(false)}
            />

            <WelcomeModal onComplete={handleWelcomeComplete} />
            <OnboardingTutorial isOpen={showTutorial} onComplete={handleTutorialComplete} />
            
            {/* Mobile Navigation (Hidden on Desktop) */}
            <MobileNavigation />
          </div>
        </div>
      )}
    </InteractionManager>
  );
}