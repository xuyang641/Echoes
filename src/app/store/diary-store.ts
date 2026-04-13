// Photo Diary Store - State Management (Refactored)
import { create } from 'zustand';
import { fetchEntries, createEntry, deleteEntry, updateEntry } from '../services/diary-api';
import { offlineStorage } from '../services/offline-storage';
import { supabase } from '../utils/supabaseClient';
import { savePicture, deletePicture } from '../services/filesystem-service';
import { useSyncStore } from './sync-store';
import type { DiaryEntry } from '../types/diary';
import type { User } from '@supabase/supabase-js';

interface DiaryState {
  entries: DiaryEntry[];
  loading: boolean;
  saving: boolean;
  user: User | null;

  setUser: (user: User | null) => void;
  loadEntries: () => Promise<void>;
  addEntry: (entry: DiaryEntry, targetGroups: string[]) => Promise<{ offline: boolean }>;
  updateEntry: (entry: DiaryEntry, targetGroups: string[]) => Promise<{ offline: boolean }>;
  deleteEntry: (id: string) => Promise<{ offline: boolean }>;
  refresh: () => Promise<void>;
  clearStore: () => Promise<void>;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  entries: [],
  loading: false,
  saving: false,
  user: null,

  setUser: (user) => {
    set({ user });
    if (user) {
      get().loadEntries();
    }
  },

  clearStore: async () => {
    set({ entries: [], user: null });
    localStorage.removeItem('photo-diary-entries');
    await offlineStorage.clear();
  },

  loadEntries: async () => {
    const { user } = get();
    if (!user) return;

    set({ loading: true });
    try {
      // 1. Try to load from IndexedDB first (Offline-first)
      try {
        const cachedEntries = await offlineStorage.getEntries(user.id);
        if (cachedEntries && cachedEntries.length > 0) {
          set({ entries: cachedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) });
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem('photo-diary-entries');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              // Ensure we only load entries for current user if userId exists
              const userEntries = (Array.isArray(parsed) ? parsed : [])
                .filter((e: any) => !e.userId || e.userId === user.id);
                
              if (userEntries.length > 0) {
                 set({ entries: userEntries });
                 // Update offline storage with userId
                 const updatedEntries = userEntries.map((e: any) => ({ ...e, userId: user.id }));
                 await offlineStorage.saveEntries(updatedEntries);
              }
            } catch (e) {
              console.error('Error parsing stored entries:', e);
            }
          }
        }
      } catch (dbError) {
        console.error('Failed to load from offline storage:', dbError);
      }

      await useSyncStore.getState().updatePendingCount();

      // 2. Fetch from API (Network)
      if (navigator.onLine) {
        try {
            const data = await fetchEntries();
            const sortedData = data.sort((a: DiaryEntry, b: DiaryEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
            set({ entries: sortedData });
            await offlineStorage.saveEntries(sortedData);
            useSyncStore.getState().setOfflineStatus(false);
        } catch (fetchErr: any) {
            if (fetchErr.message !== 'User not authenticated') {
              console.error('Network fetch failed:', fetchErr);
            }
            useSyncStore.getState().setOfflineStatus(true);
        }
      } else {
        useSyncStore.getState().setOfflineStatus(true);
      }
    } catch (err: any) {
      if (err.message !== 'User not authenticated') {
        console.error('Error fetching entries:', err);
      }
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    if (!navigator.onLine) {
      throw new Error('You are offline. Cannot refresh.');
    }
    try {
      const data = await fetchEntries();
      const sortedData = data.sort((a: DiaryEntry, b: DiaryEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
      set({ entries: sortedData });
      await offlineStorage.saveEntries(sortedData);
    } catch (error: any) {
      if (error.message !== 'User not authenticated') {
        console.error('Refresh failed:', error);
      }
      throw error;
    }
  },

  addEntry: async (entry: DiaryEntry, targetGroups: string[] = ['private']) => {
    const { user } = get();
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
        palette: entry.palette,
        likes: entry.likes || [],
        comments: entry.comments || [],
        userId: user?.id,
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
        await useSyncStore.getState().updatePendingCount();
        return { offline: true };
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
      return { offline: false };
    } catch (error: any) {
      if (error.message !== 'User not authenticated') {
        console.error('Failed to create entry:', error);
      }
      // Save to pending sync queue on error
      await offlineStorage.addPendingAction({
          type: 'create',
          payload: { entry: { ...entry, tags: entry.tags || [] }, targetGroups },
          targetGroups,
          timestamp: Date.now()
      });
      await useSyncStore.getState().updatePendingCount();
      return { offline: true };
    } finally {
      set({ saving: false });
    }
  },

  updateEntry: async (entry: DiaryEntry, targetGroups: string[]) => {
    const { user } = get();
    set({ saving: true });
    try {
      const payload = {
        photo: entry.photo,
        caption: entry.caption,
        mood: entry.mood,
        date: entry.date,
        location: entry.location,
        tags: entry.tags || [],
        palette: entry.palette,
        likes: entry.likes || [],
        comments: entry.comments || [],
        userId: user?.id,
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
        await useSyncStore.getState().updatePendingCount();
        return { offline: true };
      }

      await updateEntry(entry.id, payload);
      return { offline: false };
    } catch (error: any) {
      if (error.message !== 'User not authenticated') {
        console.error('Failed to update entry:', error);
      }
      await offlineStorage.addPendingAction({
          type: 'update',
          payload: { id: entry.id, payload: { ...entry }, targetGroups },
          targetGroups,
          timestamp: Date.now()
      });
      await useSyncStore.getState().updatePendingCount();
      return { offline: true };
    } finally {
      set({ saving: false });
    }
  },

  deleteEntry: async (id: string) => {
    const { entries } = get();
    const entryToDelete = entries.find(e => e.id === id);
    
    try {
      // Delete from local memory state first (optimistic)
      set(state => ({ entries: state.entries.filter(e => e.id !== id) }));
      
      // 1. Delete the physical file from filesystem if on native
      if (entryToDelete && entryToDelete.photo) {
        await deletePicture(entryToDelete.photo);
      }

      // 2. Delete from offline storage (IndexedDB)
      await offlineStorage.deleteEntry(id);

      if (!navigator.onLine) {
        await offlineStorage.addPendingAction({
          type: 'delete',
          payload: { id },
          targetGroups: ['private'],
          timestamp: Date.now()
        });
        await useSyncStore.getState().updatePendingCount();
        return { offline: true };
      }

      // 3. Delete from cloud (Supabase)
      await deleteEntry(id);
      return { offline: false };
    } catch (error: any) {
      if (error.message !== 'User not authenticated') {
        console.error('Failed to delete entry:', error);
      }
      await offlineStorage.addPendingAction({
          type: 'delete',
          payload: { id },
          targetGroups: ['private'],
          timestamp: Date.now()
      });
      await useSyncStore.getState().updatePendingCount();
      return { offline: true };
    }
  }
}));
