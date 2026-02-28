import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { fetchEntries, createEntry, deleteEntry, updateEntry } from '../../utils/api';
import { offlineStorage } from '../../services/offline-storage';
import { supabase } from '../../utils/supabaseClient';
import type { DiaryEntry } from '../diary-entry-form';
import type { User } from '@supabase/supabase-js';

interface DataSyncManagerProps {
  user: User | null;
  children: (props: {
    entries: DiaryEntry[];
    loading: boolean;
    saving: boolean;
    onAddEntry: (entry: DiaryEntry, targetGroups: string[]) => Promise<void>;
    onUpdateEntry: (entry: DiaryEntry, targetGroups: string[]) => Promise<void>;
    onDeleteEntry: (id: string) => Promise<void>;
    onRefresh: () => Promise<void>;
    isOffline: boolean;
    pendingSyncCount: number;
  }) => React.ReactElement;
}

export function DataSyncManager({ user, children }: DataSyncManagerProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Network Status Listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending count when needed
  const updatePendingCount = async () => {
    const count = await offlineStorage.getPendingCount();
    setPendingSyncCount(count);
  };

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
      
      // Update pending count
      await updatePendingCount();

      // 2. Fetch from API (Network)
      if (navigator.onLine) {
        const data = await fetchEntries();
        // Sort by date desc
        const sortedData = data.sort((a: DiaryEntry, b: DiaryEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEntries(sortedData);
        // Update cache
        await offlineStorage.saveEntries(sortedData);
      }

      // If offline, just log it, don't show toast
      if (!navigator.onLine) {
        console.log('App is offline');
        setIsOffline(true);
      } else {
        setIsOffline(false);
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
      // Silent fail
    } finally {
      setLoading(false);
    }
  }

  // Explicit refresh function for Pull-to-Refresh
  async function handleRefresh() {
    if (!navigator.onLine) {
        toast.error('You are offline. Cannot refresh.');
        return;
    }
    
    try {
        // Force fetch from API
        const data = await fetchEntries();
        const sortedData = data.sort((a: DiaryEntry, b: DiaryEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEntries(sortedData);
        await offlineStorage.saveEntries(sortedData);
    } catch (error) {
        console.error('Refresh failed:', error);
        throw error; // Let the UI handle the error state if needed
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
        await updatePendingCount();
        toast.success('Saved offline. Will sync when online.', {
          icon: '📡',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
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
      
    } catch (error) {
      console.error('Failed to create entry:', error);
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
      await updatePendingCount();
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
        likes: entry.likes || [],
        comments: entry.comments || [],
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
        await updatePendingCount();
        toast.success('Updated offline. Will sync when online.', { icon: '📡' });
        navigate('/');return;
      }

      console.log('Updating entry with payload:', payload);
      await updateEntry(entry.id, payload);
      toast.success('Memory updated successfully!');
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
      await updatePendingCount();
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
          targetGroups: ['private'],
          timestamp: Date.now()
        });
        await updatePendingCount();
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
      await updatePendingCount();
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
            if (targetGroups.includes('private')) {
               await createEntry(entry);
            }
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
      await updatePendingCount();
      toast.success('Sync complete!', { id: 'sync-toast' });
      loadEntries();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  return children({
    entries,
    loading,
    saving,
    onAddEntry: handleAddEntry,
    onUpdateEntry: handleUpdateEntry,
    onDeleteEntry: handleDeleteEntry,
    onRefresh: handleRefresh,
    isOffline,
    pendingSyncCount
  });
}