import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { DiaryEntry } from './diary-entry-form';
import { EntryCard } from './entry-card';
import { ImagePreviewModal } from './image-preview-modal';
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
                className={`aspect-square p-2 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : hasEntries
                    ? 'border-purple-200 bg-purple-50 hover:bg-purple-100'
                    : isCurrentMonth
                    ? 'border-gray-200 hover:bg-gray-50'
                    : 'border-transparent text-gray-300'
                } ${isCurrentMonth ? '' : 'opacity-50'}`}
              >
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <span className="text-sm">{format(day, 'd')}</span>
                  {hasEntries && (
                    <div className="flex gap-1 mt-1">
                      {dayEntries.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-purple-600"
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