import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { AIChatView } from './components/ai-chat-view';

import { ThemeProvider } from './context/ThemeContext';
import { GroupProvider } from './context/GroupContext';
import { FriendProvider } from './context/FriendContext';
import { OnboardingTutorial } from './components/onboarding-tutorial';
import { WelcomeModal } from './components/welcome-modal';
import { Footer } from './components/footer';
import { useAuth } from './context/AuthContext';
import { supabase } from './utils/supabaseClient';
import { LoginForm } from './components/auth/login-form';
import { ReloadPrompt } from './components/reload-prompt';
import { App as CapacitorApp } from '@capacitor/app';

// Layout Components
import { DesktopHeader } from './components/layout/desktop-header';
import { MobileHeader } from './components/layout/mobile-header';
import { MobileNavigation } from './components/layout/mobile-navigation';

// Managers & Routes
import { DataSyncManager } from './components/managers/data-sync-manager';
import { InteractionManager } from './components/managers/interaction-manager';
import { AppRoutes } from './routes/app-routes';

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
  const { user, loading: authLoading } = useAuth();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for tutorial on mount
  useEffect(() => {
    // If welcome modal has already been seen (so it won't show), check for tutorial
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
    <DataSyncManager user={user}>
      {({ entries, loading, saving, onAddEntry, onUpdateEntry, onDeleteEntry, onRefresh }) => (
        <InteractionManager onAIChatOpen={() => setIsAIChatOpen(true)}>
          {({ onTouchStart, onTouchMove, onTouchEnd }) => (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 pb-20 md:pb-0">
              
              <DesktopHeader entries={entries} isAddOrEdit={isAddOrEdit} />
              <MobileHeader user={user} />

              {/* Main Content */}
              <main 
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 min-h-[calc(100vh-140px)]"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <AppRoutes 
                  entries={entries} 
                  loading={loading} 
                  saving={saving} 
                  onDeleteEntry={onDeleteEntry} 
                  onAddEntry={onAddEntry} 
                  onUpdateEntry={onUpdateEntry} 
                  onRefresh={onRefresh}
                />
              </main>

              <AIChatView  
                entries={entries}
                isOpen={isAIChatOpen}
                onClose={() => setIsAIChatOpen(false)}
              />

              <WelcomeModal onComplete={handleWelcomeComplete} />
              <OnboardingTutorial isOpen={showTutorial} onComplete={handleTutorialComplete} />
              <Footer />
              
              <MobileNavigation />
            </div>
          )}
        </InteractionManager>
      )}
    </DataSyncManager>
  );
}