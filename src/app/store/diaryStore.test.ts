import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDiaryStore } from '../store/diaryStore';
import { offlineStorage } from '../services/offline-storage';
import { fetchEntries } from '../utils/api';

// Mock dependencies
vi.mock('../services/offline-storage', () => ({
  offlineStorage: {
    getEntries: vi.fn(),
    saveEntries: vi.fn(),
    saveEntry: vi.fn(),
    deleteEntry: vi.fn(),
    getPendingCount: vi.fn(),
    addPendingAction: vi.fn(),
    getPendingActions: vi.fn(),
    removePendingAction: vi.fn(),
  }
}));

vi.mock('../utils/api', () => ({
  fetchEntries: vi.fn(),
  createEntry: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
}));

vi.mock('../services/filesystem-service', () => ({
  savePicture: vi.fn().mockResolvedValue('file://test.jpg'),
}));

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  }
}));

// Mock toast to avoid errors
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

describe('DiaryStore', () => {
  const mockEntries = [
    { id: '1', date: '2023-01-01', content: 'Test 1' },
    { id: '2', date: '2023-01-02', content: 'Test 2' },
  ];

  beforeEach(() => {
    // Reset store state
    useDiaryStore.setState({
      entries: [],
      loading: false,
      saving: false,
      isOffline: false,
      pendingSyncCount: 0,
      user: { id: 'test-user' } as any,
    });
    vi.clearAllMocks();
  });

  it('should load entries from offline storage when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    (offlineStorage.getEntries as any).mockResolvedValue(mockEntries);
    // Network shouldn't be called, but mock it anyway
    (fetchEntries as any).mockResolvedValue([]); 

    useDiaryStore.setState({ user: { id: 'test' } as any });
    
    await useDiaryStore.getState().loadEntries();

    expect(offlineStorage.getEntries).toHaveBeenCalled();
    const state = useDiaryStore.getState();
    expect(state.entries).toHaveLength(2);
  });

  it('should sync with API when online', async () => {
    (offlineStorage.getEntries as any).mockResolvedValue([]);
    (fetchEntries as any).mockResolvedValue(mockEntries);
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    await useDiaryStore.getState().loadEntries();

    expect(fetchEntries).toHaveBeenCalled();
    expect(useDiaryStore.getState().entries).toHaveLength(2);
    expect(offlineStorage.saveEntries).toHaveBeenCalledWith(mockEntries);
  });

  it('should handle offline mode correctly', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    
    // Simulate add entry while offline
    const newEntry = { id: '3', date: '2023-01-03', caption: 'Offline Entry', mood: 'Happy', photo: 'test.jpg' } as any;
    
    await useDiaryStore.getState().addEntry(newEntry);

    // Should update local state
    expect(useDiaryStore.getState().entries).toContainEqual(expect.objectContaining({ id: '3' }));
    
    // Should add pending action
    expect(offlineStorage.addPendingAction).toHaveBeenCalledWith(expect.objectContaining({
      type: 'create',
      payload: expect.objectContaining({ entry: expect.objectContaining({ id: '3' }) })
    }));
  });
});
