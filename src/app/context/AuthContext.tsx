import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
import { useDiaryStore } from '../store/diary-store';
import { identifyUser, resetAnalytics } from '../utils/analytics';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // === LOCAL DEVELOPMENT BYPASS ===
    if (import.meta.env.DEV) {
      const mockUser = {
        id: 'local-dev-user-id',
        email: 'dev@localhost.com',
        user_metadata: { full_name: 'Local Developer' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser,
      } as Session;

      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
      return;
    }
    // ==================================

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        identifyUser(session.user.id, session.user.email, session.user.user_metadata?.full_name);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        identifyUser(session.user.id, session.user.email, session.user.user_metadata?.full_name);
      } else {
        resetAnalytics();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // 1. Clear Supabase auth session
      await supabase.auth.signOut();
      
      // 2. Clear all Zustand stores
      useDiaryStore.getState().clearStore();
      
      // 3. Clear localStorage cache
      localStorage.removeItem('diary-storage');
      
      // 4. Clear analytics
      resetAnalytics();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
