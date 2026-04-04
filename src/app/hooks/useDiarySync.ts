import { useEffect, useCallback } from 'react';
import { useDiaryStore } from '../store/diary-store';
import { useSyncStore } from '../store/sync-store';
import { useAuth } from '../context/AuthContext';
import { offlineStorage } from '../services/offline-storage';
import { toast } from 'react-hot-toast';

export function useDiarySync() {
  const { user } = useAuth();
  const { setUser, addEntry, loadEntries } = useDiaryStore();
  const { setOfflineStatus, syncPendingActions, isSyncing } = useSyncStore();

  const handleSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    
    await syncPendingActions(
      user?.id,
      (count) => {
        toast.loading(`Syncing ${count} pending changes...`, { id: 'sync-toast' });
      },
      () => {
        toast.success('Sync complete!', { id: 'sync-toast' });
        loadEntries();
      },
      (err) => {
        console.error('Sync failed', err);
        toast.dismiss('sync-toast');
      }
    );
  }, [user?.id, syncPendingActions, loadEntries, isSyncing]);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  useEffect(() => {
    const handleOnline = () => {
      setOfflineStatus(false);
      handleSync();
    };
    const handleOffline = () => setOfflineStatus(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus, handleSync]);

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
