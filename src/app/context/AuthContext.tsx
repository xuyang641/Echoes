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
  // Bypassing real authentication for local development/optimization
  const mockUser = {
    id: 'mock-user-123',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mock-user'
    }
  } as User;

  const [user, setUser] = useState<User | null>(mockUser);
  const [session, setSession] = useState<Session | null>({ user: mockUser } as Session);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      // Mock tracking for local development bypass
      identifyUser(mockUser.id, mockUser.email, mockUser.user_metadata.full_name);

      // Commented out real Supabase auth logic
    /*
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
    */
  }, []);

  const signOut = async () => {
    // Clear local data store to prevent data leakage between accounts
    await useDiaryStore.getState().clearStore();
    // await supabase.auth.signOut();
    resetAnalytics();
    setUser(null);
    setSession(null);
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
