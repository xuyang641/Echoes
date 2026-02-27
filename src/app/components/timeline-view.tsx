import { useState, useMemo, useEffect, useRef } from 'react';
import { Filter, Calendar, Loader2 } from 'lucide-react';
import { EntryCard } from './entry-card';
import { SearchBar } from './search-bar';
import type { DiaryEntry } from './diary-entry-form';
import { Skeleton } from './ui/skeleton';
import { useTranslation } from 'react-i18next';
import { MOODS } from '../utils/mood-constants';

interface TimelineViewProps {
  entries: DiaryEntry[];
  onDeleteEntry: (id: string) => void;
  loading?: boolean;
}

const PAGE_SIZE = 12;

export function TimelineView({ entries, onDeleteEntry, loading = false }: TimelineViewProps) {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [selectedMood, searchQuery, entries]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((prev) => prev + PAGE_SIZE);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, []);

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

  const visibleEntries = useMemo(() => {
    return filteredEntries.slice(0, displayCount);
  }, [filteredEntries, displayCount]);

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
      <div className="text-center py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <span className="text-4xl">📸</span>
        </div>
        <h3 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-2">{t('timeline.empty')}</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          {t('timeline.start')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl text-gray-900 dark:text-gray-100">{t('timeline.title')}</h2>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredEntries.length} {filteredEntries.length === 1 ? '条回忆' : '条回忆'}
        </div>
      </div>

      {/* Mood Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          <span className="text-sm text-gray-700 dark:text-gray-200">{t('timeline.filter')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allMoods.map(mood => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
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
      <div className="mt-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('timeline.search')}
        />
      </div>

      {/* Timeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {visibleEntries.map((entry) => (
          <EntryCard 
            key={entry.id} 
            entry={entry} 
            onDelete={onDeleteEntry} 
          />
        ))}
      </div>
      
      {/* Loading Trigger / Sentinel */}
      {visibleEntries.length < filteredEntries.length && (
        <div ref={observerTarget} className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      
      {filteredEntries.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl mb-2 text-gray-700 dark:text-gray-200">未找到匹配项</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {selectedMood !== 'All' 
              ? `未找到心情为“${t(`moods.${selectedMood.toLowerCase()}`, selectedMood)}”的回忆` 
              : '尝试调整搜索关键词'}
          </p>
        </div>
      )}
    </div>
  );
}