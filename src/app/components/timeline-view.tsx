import { useState, useMemo } from 'react';
import { Filter, Calendar } from 'lucide-react';
import { EntryCard } from './entry-card';
import { SearchBar } from './search-bar';
import type { DiaryEntry } from './diary-entry-form';
import { Skeleton } from './ui/skeleton';
import { useTranslation } from 'react-i18next';
import { MOODS } from '../utils/mood-constants';
import { haptics } from '../utils/haptics';
import { ImagePreviewModal } from './image-preview-modal';
import { EmptyState } from './ui/empty-state';
import { useNavigate } from 'react-router-dom';
import { VirtuosoGrid } from 'react-virtuoso';

interface TimelineViewProps {
  entries: DiaryEntry[];
  onDeleteEntry: (id: string) => void;
  loading?: boolean;
  onRefresh?: () => Promise<void>;
}

export function TimelineView({ entries, onDeleteEntry, loading = false }: TimelineViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Use mood names from constants for consistent filtering
  const allMoods = ['All', ...MOODS.map(m => m.name)];

  // Filter entries by mood and search query
  const filteredEntries = useMemo(() => {
    let filtered = entries;
    
    // Filter by mood
    if (selectedMood !== 'All') {
      filtered = filtered.filter(entry => entry.mood === selectedMood);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.caption.toLowerCase().includes(query) ||
        entry.mood.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [entries, selectedMood, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Skeleton className="h-8 w-48 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-6 w-24 bg-gray-200 dark:bg-gray-700" />
        </div>
        <Skeleton className="h-16 w-full rounded-2xl bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-12 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden h-full">
              <Skeleton className="aspect-[4/3] w-full bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>
                <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-700" />
                <Skeleton className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState 
        type="timeline" 
        onAction={() => navigate('/add')}
      />
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl text-gray-900 dark:text-gray-100 font-serif tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>{t('timeline.title')}</h2>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          {filteredEntries.length} {filteredEntries.length === 1 ? '条回忆' : '条回忆'}
        </div>
      </div>

      {/* Mood Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 transition-colors shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          <span className="text-sm text-gray-700 dark:text-gray-200">{t('timeline.filter')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allMoods.map(mood => (
            <button
              key={mood}
              onClick={() => {
                setSelectedMood(mood);
                haptics.light();
              }}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                selectedMood === mood
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {mood === 'All' ? t('timeline.all') : t(`moods.${mood.toLowerCase()}`, mood)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 shrink-0">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('timeline.search')}
        />
      </div>

      {/* Virtual Timeline Grid */}
      {filteredEntries.length > 0 ? (
        <div 
            className="flex-1 min-h-[500px] -mx-4 px-4"
        >
          <VirtuosoGrid
            useWindowScroll
            data={filteredEntries}
            listClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20"
            itemClassName="h-full"
            itemContent={(_index, entry) => (
              <div className="h-full pb-4">
                <EntryCard 
                  entry={entry} 
                  onDelete={onDeleteEntry}
                  onImageClick={(url) => {
                      setPreviewImage(url);
                      haptics.medium();
                  }} 
                />
              </div>
            )}
          />
        </div>
      ) : (
        <EmptyState 
            type="search" 
            message="未找到匹配项"
            description={selectedMood !== 'All' 
              ? `未找到心情为“${t(`moods.${selectedMood.toLowerCase()}`, selectedMood)}”的回忆` 
              : '尝试调整搜索关键词'}
        />
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal 
        isOpen={!!previewImage} 
        imageUrl={previewImage || ''} 
        onClose={() => setPreviewImage(null)} 
      />
    </div>
  );
}