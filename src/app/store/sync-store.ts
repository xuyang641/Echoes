import { create } from 'zustand';
import { offlineStorage } from '../services/offline-storage';
import { createEntry, deleteEntry, updateEntry } from '../services/diary-api';
import { supabase } from '../utils/supabaseClient';

interface SyncState {
  isOffline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;

  setOfflineStatus: (status: boolean) => void;
  updatePendingCount: () => Promise<void>;
  
  // The UI can pass a callback to be notified when sync succeeds or fails
  // so we decouple UI toast notifications from the store
  syncPendingActions: (
    userId: string | undefined, 
    onProgress?: (count: number) => void,
    onSuccess?: () => void,
    onError?: (err: any) => void
  ) => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOffline: !navigator.onLine,
  pendingSyncCount: 0,
  isSyncing: false,

  setOfflineStatus: (status) => set({ isOffline: status }),

  updatePendingCount: async () => {
    try {
      const count = await offlineStorage.getPendingCount();
      set({ pendingSyncCount: count });
    } catch (e) {
      console.error('Failed to get pending sync count', e);
    }
  },

  syncPendingActions: async (userId, onProgress, onSuccess, onError) => {
    if (!navigator.onLine) {
        if (onError) onError(new Error('Device is offline'));
        return;
    }
    
    set({ isSyncing: true });
    
    try {
      const actions = await offlineStorage.getPendingActions();
      if (actions.length === 0) {
          set({ isSyncing: false });
          return;
      }

      if (onProgress) onProgress(actions.length);

      for (const action of actions) {
        try {
          if (action.type === 'create') {
            const { entry, targetGroups } = action.payload;
            if (targetGroups.includes('private')) {
               await createEntry(entry);
            }
            const groupIds = targetGroups.filter((id: string) => id !== 'private');
            if (groupIds.length > 0 && userId) {
                await Promise.all(groupIds.map((groupId: string) => 
                    supabase.from('diary_entries').insert({
                        user_id: userId,
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
        } catch (err: any) {
          if (err?.message !== 'User not authenticated') {
            console.error('Sync failed for action:', action, err);
          }
          // Don't throw here, try to sync the rest of the actions
        }
      }
      
      await get().updatePendingCount();
      if (onSuccess) onSuccess();
      
    } catch (error) {
        console.error('Sync process failed:', error);
        if (onError) onError(error);
    } finally {
        set({ isSyncing: false });
    }
  }
}));
