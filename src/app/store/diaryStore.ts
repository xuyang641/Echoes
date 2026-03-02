import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import { fetchEntries, createEntry, deleteEntry, updateEntry } from '../utils/api';
import { offlineStorage } from '../services/offline-storage';
import { supabase } from '../utils/supabaseClient';
import { savePicture } from '../services/filesystem-service';
import type { DiaryEntry } from '../components/diary-entry-form';
import type { User } from '@supabase/supabase-js';

interface DiaryState {
  entries: DiaryEntry[];
  loading: boolean;
  saving: boolean;
  isOffline: boolean;
  pendingSyncCount: number;
  user: User | null;

  setUser: (user: User | null) => void;
  loadEntries: () => Promise<void>;
  addEntry: (entry: DiaryEntry, targetGroups: string[]) => Promise<void>;
  updateEntry: (entry: DiaryEntry, targetGroups: string[]) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  syncPendingActions: () => Promise<void>;
  setOfflineStatus: (status: boolean) => void;
  updatePendingCount: () => Promise<void>;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  entries: [],
  loading: false,
  saving: false,
  isOffline: !navigator.onLine,
  pendingSyncCount: 0,
  user: null,

  setUser: (user) => {
    set({ user });
    if (user) {
      get().loadEntries();
    }
  },

  setOfflineStatus: (status) => set({ isOffline: status }),

  updatePendingCount: async () => {
    const count = await offlineStorage.getPendingCount();
    set({ pendingSyncCount: count });
  },

  loadEntries: async () => {
    const { user, updatePendingCount } = get();
    if (!user) return;

    set({ loading: true });
    try {
      // 1. Try to load from IndexedDB first (Offline-first)
      try {
        const cachedEntries = await offlineStorage.getEntries();
        if (cachedEntries.length > 0) {
          set({ entries: cachedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) });
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem('photo-diary-entries');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              set({ entries: parsed });
              await offlineStorage.saveEntries(parsed);
            } catch (e) {
              console.error('Error parsing stored entries:', e);
            }
          }
        }
      } catch (dbError) {
        console.error('Failed to load from offline storage:', dbError);
      }

      await updatePendingCount();

      // 2. Fetch from API (Network)
      if (navigator.onLine) {
        const data = await fetchEntries();
        const sortedData = data.sort((a: DiaryEntry, b: DiaryEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
        set({ entries: sortedData });
        await offlineStorage.saveEntries(sortedData);
        set({ isOffline: false });
      } else {
        console.log('App is offline');
        set({ isOffline: true });
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    if (!navigator.onLine) {
      toast.error('You are offline. Cannot refresh.');
      return;
    }
    try {
      const data = await fetchEntries();
      const sortedData = data.sort((a: DiaryEntry, b: DiaryEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
      set({ entries: sortedData });
      await offlineStorage.saveEntries(sortedData);
    } catch (error) {
      console.error('Refresh failed:', error);
      throw error;
    }
  },

  addEntry: async (entry, targetGroups = ['private']) => {
    const { user, updatePendingCount } = get();
    set({ saving: true });
    try {
      let photoPath = entry.photo;
      if (entry.photo.startsWith('data:')) {
        const fileName = `${entry.id}.jpg`;
        try {
          photoPath = await savePicture(entry.photo, fileName);
        } catch (fsErr) {
          console.error('Filesystem save failed', fsErr);
        }
      }

      const payload = {
        photo: photoPath,
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

      const newEntryWithId = { ...entry, ...payload };
      
      // Optimistic update
      set(state => ({ entries: [newEntryWithId, ...state.entries] }));
      await offlineStorage.saveEntry(newEntryWithId);

      if (!navigator.onLine) {
        await offlineStorage.addPendingAction({
          type: 'create',
          payload: { entry: newEntryWithId, targetGroups },
          targetGroups,
          timestamp: Date.now()
        });
        await updatePendingCount();
        toast.success('Saved offline. Will sync when online.', { icon: '📡' });
        return;
      }

      const promises = [];
      if (targetGroups.includes('private')) {
        promises.push(createEntry(payload));
      }

      const groupIds = targetGroups.filter(id => id !== 'private');
      if (groupIds.length > 0 && user) {
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
          if (error) throw new Error(`Failed to save to group: ${error.message}`);
        });
        promises.push(...groupInserts);
      }

      await Promise.all(promises);
      toast.success('Memory saved successfully!');
    } catch (error) {
      console.error('Failed to create entry:', error);
      toast.error('Network error. Saved offline.');
      await offlineStorage.addPendingAction({
          type: 'create',
          payload: { entry: { ...entry, tags: entry.tags || [], aiTags: entry.aiTags || [] }, targetGroups },
          targetGroups,
          timestamp: Date.now()
      });
      await updatePendingCount();
    } finally {
      set({ saving: false });
    }
  },

  updateEntry: async (entry, targetGroups) => {
    const { updatePendingCount } = get();
    set({ saving: true });
    try {
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

      const updatedEntry = { ...entry, ...payload };
      set(state => ({ entries: state.entries.map(e => e.id === entry.id ? updatedEntry : e) }));
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
        return;
      }

      await updateEntry(entry.id, payload);
      toast.success('Memory updated successfully!');
    } catch (error) {
      console.error('Failed to update entry:', error);
      toast.error('Network error. Saved offline.');
      await offlineStorage.addPendingAction({
          type: 'update',
          payload: { id: entry.id, payload: { ...entry }, targetGroups },
          targetGroups,
          timestamp: Date.now()
      });
      await updatePendingCount();
    } finally {
      set({ saving: false });
    }
  },

  deleteEntry: async (id) => {
    const { updatePendingCount } = get();
    try {
      set(state => ({ entries: state.entries.filter(e => e.id !== id) }));
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
  },

  syncPendingActions: async () => {
    const { user, loadEntries, updatePendingCount } = get();
    if (!navigator.onLine) return;
    
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
  }
}));
