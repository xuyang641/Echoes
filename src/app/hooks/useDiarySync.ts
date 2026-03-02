import { useEffect } from 'react';
import { useDiaryStore } from '../store/diaryStore';
import { useAuth } from '../context/AuthContext';
import { offlineStorage } from '../services/offline-storage';

export function useDiarySync() {
  const { user } = useAuth();
  const { setUser, setOfflineStatus, syncPendingActions, addEntry } = useDiaryStore();

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  useEffect(() => {
    const handleOnline = () => {
      setOfflineStatus(false);
      syncPendingActions();
    };
    const handleOffline = () => setOfflineStatus(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus, syncPendingActions]);

  // Welcome Entry Listener
  useEffect(() => {
    const handleCreateWelcomeEntry = async (e: Event) => {
        const customEvent = e as CustomEvent;
        const entry = customEvent.detail;
        
        try {
            const existing = await offlineStorage.getEntries();
            // Check based on tags as in original logic
            // Note: offlineStorage.getEntries() might be different from store.entries if store hasn't loaded yet, 
            // but store loads on setUser.
            const hasWelcome = existing.some(e => e.tags?.includes('Echoes') && e.tags?.includes('新的开始'));
            if (hasWelcome) return;

            const response = await fetch('/assets/splash.jpg');
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                addEntry({
                    ...entry,
                    photo: base64data
                }, ['private']);
            };
            reader.readAsDataURL(blob);
        } catch (err) {
            console.error('Failed to create welcome entry:', err);
            addEntry(entry, ['private']);
        }
    };

    window.addEventListener('create-welcome-entry', handleCreateWelcomeEntry);
    return () => window.removeEventListener('create-welcome-entry', handleCreateWelcomeEntry);
  }, [addEntry]);
}
