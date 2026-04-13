import { describe, it, expect, vi, beforeEach } from 'vitest';
import { offlineStorage } from './offline-storage';
import { openDB } from 'idb';

// Mock IndexedDB
vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

describe('Offline Storage System', () => {
  let mockDb: any;
  let mockTransaction: any;
  let mockStore: any;

  beforeEach(() => {
    mockStore = {
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(),
      getAllFromIndex: vi.fn(),
      add: vi.fn(),
      count: vi.fn(),
    };

    mockTransaction = {
      store: mockStore,
      done: Promise.resolve(),
    };

    mockDb = {
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(),
      getAllFromIndex: vi.fn(),
      add: vi.fn(),
      count: vi.fn(),
      transaction: vi.fn().mockReturnValue(mockTransaction),
    };

    // Replace the dbPromise in the singleton with our mock
    // This allows us to intercept IDB calls without actually writing to disk
    (offlineStorage as any).dbPromise = Promise.resolve(mockDb);
    vi.clearAllMocks();
  });

  describe('Diary Entries', () => {
    const mockEntry = {
      id: 'entry-123',
      date: '2023-10-01',
      caption: 'Test Entry',
      userId: 'user-456'
    };

    it('should save a single entry', async () => {
      await offlineStorage.saveEntry(mockEntry as any);
      expect(mockDb.put).toHaveBeenCalledWith('entries', mockEntry);
    });

    it('should save multiple entries in a transaction', async () => {
      const entries = [mockEntry, { ...mockEntry, id: 'entry-456' }];
      await offlineStorage.saveEntries(entries as any[]);
      
      expect(mockDb.transaction).toHaveBeenCalledWith('entries', 'readwrite');
      expect(mockStore.put).toHaveBeenCalledTimes(2);
      expect(mockStore.put).toHaveBeenCalledWith(entries[0]);
      expect(mockStore.put).toHaveBeenCalledWith(entries[1]);
    });

    it('should get all entries by date when no user ID is provided', async () => {
      mockDb.getAllFromIndex.mockResolvedValue([mockEntry]);
      const result = await offlineStorage.getEntries();
      
      expect(mockDb.getAllFromIndex).toHaveBeenCalledWith('entries', 'by-date');
      expect(result).toEqual([mockEntry]);
    });

    it('should get entries by user ID if provided', async () => {
      mockDb.getAllFromIndex.mockResolvedValue([mockEntry]);
      const result = await offlineStorage.getEntries('user-456');
      
      expect(mockDb.getAllFromIndex).toHaveBeenCalledWith('entries', 'by-user', 'user-456');
      expect(result).toEqual([mockEntry]);
    });

    it('should delete an entry', async () => {
      await offlineStorage.deleteEntry('entry-123');
      expect(mockDb.delete).toHaveBeenCalledWith('entries', 'entry-123');
    });
  });

  describe('Pending Actions (Offline Sync Queue)', () => {
    const mockAction = {
      type: 'create' as const,
      payload: { id: 'entry-123', caption: 'Test' },
      targetGroups: ['private'],
      timestamp: Date.now()
    };

    it('should add a pending action to the queue', async () => {
      mockDb.add.mockResolvedValue(1); // Returns the auto-increment ID
      const id = await offlineStorage.addPendingAction(mockAction);
      
      expect(mockDb.add).toHaveBeenCalledWith('pending_actions', mockAction);
      expect(id).toBe(1);
    });

    it('should get all pending actions', async () => {
      mockDb.getAll.mockResolvedValue([{ id: 1, ...mockAction }]);
      const actions = await offlineStorage.getPendingActions();
      
      expect(mockDb.getAll).toHaveBeenCalledWith('pending_actions');
      expect(actions).toHaveLength(1);
      expect(actions[0].id).toBe(1);
    });

    it('should count pending actions', async () => {
      mockDb.count.mockResolvedValue(5);
      const count = await offlineStorage.getPendingCount();
      
      expect(mockDb.count).toHaveBeenCalledWith('pending_actions');
      expect(count).toBe(5);
    });

    it('should remove a pending action after successful sync', async () => {
      await offlineStorage.removePendingAction(1);
      expect(mockDb.delete).toHaveBeenCalledWith('pending_actions', 1);
    });
  });
});