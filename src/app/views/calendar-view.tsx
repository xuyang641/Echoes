import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { DiaryEntry } from '../types/diary';
import { EntryCard } from '../components/entry-card';
import { ImagePreviewModal } from '../components/image-preview-modal';
import { haptics } from '../utils/haptics';

interface CalendarViewProps {
  entries: DiaryEntry[];
  onDeleteEntry: (id: string) => void;
}

export function CalendarView({ entries, onDeleteEntry }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>();
    entries.forEach(entry => {
      const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(entry);
    });
    return map;
  }, [entries]);

  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return entriesByDate.get(dateKey) || [];
  }, [selectedDate, entriesByDate]);

  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                {format(currentMonth, 'yyyy年 MMMM', { locale: zhCN })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-400 dark:text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {daysInMonth.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEntries = entriesByDate.get(dateKey) || [];
            const hasEntries = dayEntries.length > 0;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`relative aspect-square rounded-xl border transition-all overflow-hidden group ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-600/20 z-10'
                    : hasEntries
                    ? 'border-transparent hover:ring-2 hover:ring-blue-500/30'
                    : isCurrentMonth
                    ? 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    : 'border-transparent opacity-30'
                }`}
              >
                {/* Background Image for the day */}
                {hasEntries && dayEntries.some(e => e.photo && !e.photo.startsWith('data:video/') && !e.photo.endsWith('.mp4')) && (
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={dayEntries.find(e => e.photo && !e.photo.startsWith('data:video/') && !e.photo.endsWith('.mp4'))?.photo} 
                      alt="" 
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />
                  </div>
                )}
                
                {/* Solid color for entries without photo or if it's a video */}
                {hasEntries && !dayEntries.some(e => e.photo && !e.photo.startsWith('data:video/') && !e.photo.endsWith('.mp4')) && (
                   <div className="absolute inset-0 z-0 bg-blue-50 dark:bg-blue-900/30" />
                )}

                <div className={`relative z-10 w-full h-full flex flex-col items-center justify-between p-1 sm:p-2 ${
                  hasEntries && dayEntries.some(e => e.photo && !e.photo.startsWith('data:video/') && !e.photo.endsWith('.mp4'))
                    ? 'text-white' 
                    : isCurrentMonth
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-600'
                }`}>
                  <span className={`text-sm font-semibold ${isSelected && !hasEntries ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Indicators for multiple entries */}
                  {hasEntries && (
                    <div className="flex gap-0.5 sm:gap-1 mb-0.5">
                      {dayEntries.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                            dayEntries[0].photo ? 'bg-white' : 'bg-blue-500'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Entries */}
      {selectedDate && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear selection
            </button>
          </div>

          {selectedDateEntries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDateEntries.map(entry => (
                <EntryCard 
                    key={entry.id} 
                    entry={entry} 
                    onDelete={onDeleteEntry}
                    onImageClick={(url) => {
                        setPreviewImage(url);
                        haptics.medium();
                    }} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-white rounded-2xl">
              No memories for this day
            </div>
          )}
        </div>
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