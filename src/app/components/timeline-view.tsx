import { useState, useMemo, useEffect } from 'react';
import { Edit2, Trash2, Share2, MoreHorizontal, Image as ImageIcon, Calendar, Filter, Search } from 'lucide-react';
import { haptics } from '../utils/haptics';
import { ImagePreviewModal } from './image-preview-modal';
import { EmptyState } from './ui/empty-state';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Skeleton } from './ui/skeleton';
import type { DiaryEntry } from './diary-entry-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

import { MOODS } from '../utils/mood-constants';
import { motion, AnimatePresence } from 'framer-motion';

interface TimelineViewProps {
  entries: DiaryEntry[];
  onDeleteEntry: (id: string) => void;
  loading?: boolean;
  onRefresh?: () => Promise<void>;
}

export function TimelineView({ entries, onDeleteEntry, loading = false }: TimelineViewProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const isZh = i18n.language.startsWith('zh');
  const locale = isZh ? zhCN : enUS;
  
  const allMoods = ['All', ...MOODS.map(m => m.name)];
  const [showFilters, setShowFilters] = useState(false);

  const filteredEntries = useMemo(() => {
    let filtered = entries;
    if (selectedMood !== 'All') {
      filtered = filtered.filter(entry => entry.mood === selectedMood);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.caption.toLowerCase().includes(query) ||
        entry.mood.toLowerCase().includes(query)
      );
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, selectedMood, searchQuery]);

  // Set default selected entry
  useEffect(() => {
    if (filteredEntries.length > 0 && !selectedEntryId) {
      setSelectedEntryId(filteredEntries[0].id);
    } else if (filteredEntries.length === 0) {
      setSelectedEntryId(null);
    }
  }, [filteredEntries, selectedEntryId]);

  const groupedEntries = useMemo(() => {
    const groups: { month: string; entries: DiaryEntry[] }[] = [];
    let currentMonth = '';
    let currentGroup: DiaryEntry[] = [];

    filteredEntries.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = format(date, isZh ? 'yyyy年 M月' : 'MMMM yyyy', { locale });
      
      if (monthKey !== currentMonth) {
        if (currentGroup.length > 0) {
          groups.push({ month: currentMonth, entries: currentGroup });
        }
        currentMonth = monthKey;
        currentGroup = [entry];
      } else {
        currentGroup.push(entry);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ month: currentMonth, entries: currentGroup });
    }

    return groups;
  }, [filteredEntries, isZh, locale]);

  const selectedEntry = useMemo(() => {
    return filteredEntries.find(e => e.id === selectedEntryId) || null;
  }, [filteredEntries, selectedEntryId]);

  if (loading) {
    return (
      <div className="flex h-full w-full bg-white dark:bg-[#111111] overflow-hidden">
        <div className="w-[350px] border-r border-gray-100 dark:border-gray-800 p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <div className="flex-1 p-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return <EmptyState type="timeline" onAction={() => navigate('/add')} />;
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#111111] overflow-hidden rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50">
      
      {/* LEFT PANE: LIST */}
      <div className="w-full md:w-[360px] lg:w-[420px] flex-shrink-0 flex flex-col bg-gray-50/50 dark:bg-gray-900/30">
        
        {/* Header / Filters */}
        <div className="p-4 shrink-0 space-y-3 bg-transparent z-20 mt-2">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowFilters(true)}
              onBlur={() => {
                // Short delay to allow clicking buttons
                setTimeout(() => setShowFilters(false), 200);
              }}
              placeholder={t('timeline.search')}
              className="block w-full pl-10 pr-10 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute inset-y-0 right-0 pr-3 flex items-center ${showFilters || selectedMood !== 'All' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pt-2">
                  {allMoods.map(mood => (
                    <button
                      key={mood}
                      onMouseDown={(e) => {
                        // Use onMouseDown to trigger before input blur
                        e.preventDefault();
                        setSelectedMood(mood);
                        haptics.light();
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                        selectedMood === mood
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
                      }`}
                    >
                      {mood === 'All' ? t('timeline.all') : t(`moods.${mood.toLowerCase()}`, mood)}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {groupedEntries.length > 0 ? (
            <div className="pb-8">
              {groupedEntries.map((group) => (
                <div key={group.month}>
                  {/* Month Sticky Header */}
                  <div className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md px-5 py-4 text-sm font-bold text-gray-900 dark:text-white tracking-wider">
                    {group.month}
                  </div>
                  
                  <div className="flex flex-col gap-1 px-3">
                    {group.entries.map((entry) => {
                      const date = new Date(entry.date);
                      const isSelected = selectedEntryId === entry.id;
                      
                      // Extract plain text for preview
                      const plainText = entry.caption.replace(/<[^>]*>?/gm, '').trim() || t('timeline.no_content', '分享了一段回忆');

                      return (
                        <div
                          key={entry.id}
                          onClick={() => {
                            setSelectedEntryId(entry.id);
                            haptics.light();
                          }}
                          className={`flex items-stretch p-3 rounded-2xl cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                            isSelected 
                              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                              : 'bg-transparent hover:bg-white/50 dark:hover:bg-gray-800/50 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {/* Date Block */}
                          <div className={`flex flex-col items-center justify-center w-14 shrink-0 ${isSelected ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                            <span className="text-[11px] font-bold uppercase tracking-widest mb-1">
                              {format(date, 'EEE', { locale })}
                            </span>
                            <span className={`text-2xl font-black leading-none ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                              {format(date, 'dd')}
                            </span>
                          </div>

                          {/* Content Snippet */}
                          <div className="flex-1 min-w-0 pl-4 pr-2 flex flex-col justify-center py-1">
                            <p className={`text-[15px] font-medium line-clamp-2 leading-relaxed tracking-wide ${isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              {plainText}
                            </p>
                            <div className={`text-[11px] font-medium mt-2 flex items-center gap-2 ${isSelected ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-blue-400/30' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
                                {entry.mood}
                              </span>
                              <span>•</span>
                              <span>{format(date, 'HH:mm')}</span>
                            </div>
                          </div>

                          {/* Thumbnail */}
                          {entry.photo && (
                            <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 ml-1 self-center">
                              {entry.photo.startsWith('data:video/') || entry.photo.endsWith('.mp4') ? (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                                  <ImageIcon className="w-6 h-6 opacity-50" />
                                </div>
                              ) : (
                                <img 
                                  src={entry.photo} 
                                  alt="" 
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (!target.src.includes('/images/backgrounds/forest-morning.jpg')) {
                                      target.src = '/images/backgrounds/forest-morning.jpg';
                                    }
                                  }}
                                  className="w-full h-full object-cover" 
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState 
                type="search" 
                message={t('timeline.no_matches', '未找到匹配项')}
              />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: DETAIL */}
      <div className="hidden md:flex flex-1 flex-col bg-white dark:bg-[#111111] overflow-hidden relative border-l border-gray-100 dark:border-gray-800/60">
        {selectedEntry ? (
          <>
            {/* Top Bar */}
            <div className="h-16 flex items-center justify-between px-8 shrink-0 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md z-10 sticky top-0 border-b border-gray-100 dark:border-gray-800/60">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {format(new Date(selectedEntry.date), isZh ? 'yyyy年 MMMM d日 EEEE' : 'EEEE, MMMM d, yyyy', { locale })}
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => navigate(`/edit/${selectedEntry.id}`)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Share2 className="w-4 h-4" />
                      <span>{t('common.share', '分享')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                      onClick={() => setEntryToDelete(selectedEntry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t('common.delete', '删除')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar relative">
              <div className="max-w-4xl mx-auto px-8 py-10 space-y-8">
                
                {/* Visual Media */}
                {selectedEntry.photo && (
                  <div 
                    className="w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm cursor-zoom-in group relative"
                    onClick={() => {
                      if (!selectedEntry.photo.startsWith('data:video/') && !selectedEntry.photo.endsWith('.mp4')) {
                        setPreviewImage(selectedEntry.photo);
                      }
                    }}
                  >
                    {selectedEntry.photo.startsWith('data:video/') || selectedEntry.photo.endsWith('.mp4') ? (
                      <video src={selectedEntry.photo} controls className="w-full max-h-[60vh] object-contain bg-black" />
                    ) : (
                      <img 
                        src={selectedEntry.photo} 
                        alt="Diary visual" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('/images/backgrounds/forest-morning.jpg')) {
                            target.src = '/images/backgrounds/forest-morning.jpg';
                          }
                        }}
                        className="w-full h-auto object-cover max-h-[70vh] group-hover:scale-[1.02] transition-transform duration-700" 
                      />
                    )}
                  </div>
                )}

                {/* Text Content */}
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 font-serif leading-loose tracking-wide"
                  style={{ fontFamily: '"Noto Serif", "Noto Serif SC", serif' }}
                  dangerouslySetInnerHTML={{ __html: selectedEntry.caption }}
                />

                {/* Metadata Tags */}
                <div className="pt-8 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {selectedEntry.mood}
                  </span>
                  {selectedEntry.tags?.map(tag => (
                    <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                      #{tag}
                    </span>
                  ))}
                  {selectedEntry.aiTags?.map(tag => (
                    <span key={`ai-${tag}`} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                      ✨ {tag}
                    </span>
                  ))}
                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 space-y-6">
            <div className="w-48 h-48 rounded-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center mb-4">
              <Calendar className="w-20 h-20 text-gray-300 dark:text-gray-700" strokeWidth={1} />
            </div>
            <p className="text-lg font-medium text-gray-500">{t('timeline.select_entry', '选择左侧的回忆开始阅读')}</p>
          </div>
        )}
      </div>

      <ImagePreviewModal 
        isOpen={!!previewImage} 
        imageUrl={previewImage || ''} 
        onClose={() => setPreviewImage(null)} 
      />

      <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">{t('common.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              {t('common.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 border-none">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => {
                  if (entryToDelete) {
                    onDeleteEntry(entryToDelete);
                    if (selectedEntryId === entryToDelete) {
                      setSelectedEntryId(null);
                    }
                  }
                }} 
                className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}