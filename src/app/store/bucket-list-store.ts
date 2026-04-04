import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface BucketListItem {
  id: string;
  title: string;
  target: number;
  tags: string[]; // Entries with ANY of these tags count towards progress
  iconName?: string; // name of the lucide icon
  color?: string; // tailwind color class
  createdAt: string;
}

interface BucketListState {
  bucketList: BucketListItem[];
  addBucketListItem: (item: Omit<BucketListItem, 'id' | 'createdAt'>) => void;
  updateBucketListItem: (id: string, updates: Partial<BucketListItem>) => void;
  deleteBucketListItem: (id: string) => void;
  clearBucketList: () => void;
}

export const useBucketListStore = create<BucketListState>()(
  persist(
    (set) => ({
      bucketList: [],

      addBucketListItem: (item) => {
        const newItem: BucketListItem = {
          ...item,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString()
        };
        set((state) => ({
          bucketList: [...state.bucketList, newItem]
        }));
      },

      updateBucketListItem: (id, updates) => {
        set((state) => ({
          bucketList: state.bucketList.map(item => 
            item.id === id ? { ...item, ...updates } : item
          )
        }));
      },

      deleteBucketListItem: (id) => {
        set((state) => ({
          bucketList: state.bucketList.filter(item => item.id !== id)
        }));
      },

      clearBucketList: () => {
        set({ bucketList: [] });
      }
    }),
    {
      name: 'photo-diary-bucket-list', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
