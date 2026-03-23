import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Sun, Sparkles, Image as ImageIcon, ChevronLeft, ChevronRight, CheckCircle2, Flame } from 'lucide-react';
import type { DiaryEntry } from '../diary-entry-form';
import { format, isSameDay, startOfWeek, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DailyPromptWidget } from '../widgets/daily-prompt-widget';
import { AmbientPlayerWidget } from '../widgets/ambient-player-widget';

interface DesktopRightPanelProps {
  entries: DiaryEntry[];
}

export function DesktopRightPanel({ entries }: DesktopRightPanelProps) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // --- Streak Logic (Consecutive days) ---
  const currentStreak = useMemo(() => {
    if (!entries || entries.length === 0) return 0;
    
    // Sort entries by date descending
    const sortedDates = [...entries]
      .map(e => new Date(e.date).setHours(0,0,0,0))
      .sort((a, b) => b - a);
      
    // Remove duplicates
    const uniqueDates = Array.from(new Set(sortedDates)).map(d => new Date(d));
    
    if (uniqueDates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Check if there's an entry today or yesterday to start the streak
    const firstDate = uniqueDates[0];
    const diffToFirst = differenceInDays(today, firstDate);
    
    if (diffToFirst > 1) return 0; // Streak broken

    streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const diff = differenceInDays(uniqueDates[i], uniqueDates[i+1]);
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }, [entries]);

  // --- Habit Tracker Logic (Weekly) ---
  const weeklyProgress = useMemo(() => {
    const today = new Date();
    // In JS Date, 0 is Sunday. For a Monday start, we handle it via date-fns
    const start = startOfWeek(today, { weekStartsOn: 1 }); 
    
    let daysRecorded = 0;
    const daysStatus = Array.from({ length: 7 }, (_, i) => {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      const hasEntry = entries.some(entry => isSameDay(new Date(entry.date), currentDate));
      if (hasEntry) daysRecorded++;
      
      return {
        // Just take the single character like "一", "二", "日"
        dayName: format(currentDate, 'E', { locale: zhCN }).replace('周', '').replace('星期', ''),
        hasEntry,
        isToday: isSameDay(currentDate, today)
      };
    });

    return { daysRecorded, daysStatus };
  }, [entries]);

  // --- Mood Distribution Logic (Recent 30 days) ---
  const moodStats = useMemo(() => {
    const stats: Record<string, { count: number, emoji: string }> = {};
    const recentEntries = entries.slice(0, 30); // simplistic way to get recent
    
    recentEntries.forEach(entry => {
      if (entry.mood) {
        if (!stats[entry.mood]) {
           // Provide fallback emojis based on mood string, since we don't have direct access to mood constants here easily
           const emojiMap: Record<string, string> = { 'Happy': '😊', 'Sad': '😔', 'Calm': '😌', 'Angry': '😠', 'Excited': '🤩', 'Anxious': '😰' };
           stats[entry.mood] = { count: 0, emoji: emojiMap[entry.mood] || '😐' };
        }
        stats[entry.mood].count++;
      }
    });

    // Sort by count and get top 3
    return Object.entries(stats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);
  }, [entries]);

  // "On this day" logic
  const onThisDayEntries = useMemo(() => {
    const today = new Date();
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getDate() === today.getDate() && 
             entryDate.getMonth() === today.getMonth() &&
             entryDate.getFullYear() !== today.getFullYear();
    });
  }, [entries]);

  // Recent Photos logic
  const recentPhotos = useMemo(() => {
    const photos: { url: string; entryId: string }[] = [];
    for (const entry of entries) {
      if (entry.photo) {
        photos.push({ url: entry.photo, entryId: entry.id });
        if (photos.length >= 6) return photos;
      }
    }
    return photos;
  }, [entries]);

  if (isCollapsed) {
    return (
      <aside className="hidden lg:flex flex-col w-16 h-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-800/50 shrink-0 z-30 transition-all duration-300 relative items-center py-6">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="absolute top-1/2 -left-3.5 w-7 h-14 bg-white dark:bg-gray-800 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-l-xl flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 z-40 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-lg font-black text-gray-900 dark:text-white leading-none">{format(new Date(), 'dd')}</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase">{format(new Date(), 'MMM')}</span>
          </div>

          <div className="w-8 h-px bg-gray-200 dark:bg-gray-800" />

          <button onClick={() => setIsCollapsed(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors" title="今日天气">
            <Sun className="w-5 h-5" />
          </button>
          
          {onThisDayEntries.length > 0 && (
            <button onClick={() => setIsCollapsed(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-amber-500 transition-colors" title="那年今日">
              <Calendar className="w-5 h-5" />
            </button>
          )}
          
          <button onClick={() => setIsCollapsed(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-purple-500 transition-colors" title="记忆洞察">
            <Sparkles className="w-5 h-5" />
          </button>
          
          {recentPhotos.length > 0 && (
            <button onClick={() => setIsCollapsed(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-green-500 transition-colors" title="最近影像">
              <ImageIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-[300px] h-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-800/50 shrink-0 z-30 transition-all duration-300 overflow-y-auto no-scrollbar p-6 relative">
      <button 
        onClick={() => setIsCollapsed(true)}
        className="absolute top-1/2 -left-3.5 w-7 h-14 bg-white dark:bg-gray-800 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-l-xl flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 z-40 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      
      {/* Header: Date & Weather */}
      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">
            {format(new Date(), 'dd')}
          </h2>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
            {format(new Date(), 'yyyy MMM', { locale: zhCN })}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {format(new Date(), 'EEEE', { locale: zhCN })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100/50 dark:border-blue-800/30">
            <Sun className="w-6 h-6" />
          </div>
          {currentStreak > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-full border border-orange-100 dark:border-orange-500/20">
              <Flame className="w-3 h-3" />
              {currentStreak}天连记
            </div>
          )}
        </div>
      </div>

      {/* Daily Prompt Widget */}
      <div className="mb-8">
        <DailyPromptWidget />
      </div>

      {/* Ambient Player Widget */}
      <div className="mb-8">
        <AmbientPlayerWidget />
      </div>

      {/* Weekly Writing Habit Tracker */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">本周记录</h4>
          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">{weeklyProgress.daysRecorded}/7</span>
        </div>
        <div className="flex justify-between gap-1">
          {weeklyProgress.daysStatus.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                day.hasEntry 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20 scale-110' 
                  : day.isToday
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-500/30'
                    : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700'
              }`}>
                {day.hasEntry ? <CheckCircle2 className="w-4 h-4" /> : day.dayName}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* On This Day */}
      {onThisDayEntries.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">那年今日</h4>
          </div>
          <div className="space-y-3">
            {onThisDayEntries.slice(0, 2).map(entry => (
              <div 
                key={entry.id}
                onClick={() => navigate(`/?date=${entry.date}`)}
                className="group relative cursor-pointer bg-white dark:bg-gray-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700/80 p-2"
              >
                {entry.photo && (
                  <div className="w-full h-28 rounded-xl overflow-hidden mb-2 relative">
                    <img src={entry.photo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                )}
                <div className="px-1.5 pb-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-500/20">
                      {format(new Date(entry.date), 'yyyy')}年
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {(entry.content || entry.caption || '').replace(/<[^>]*>?/gm, '') || '分享了一段回忆'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights Snippet */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">记忆洞察</h4>
        </div>
        <div className="relative bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-4 border border-purple-100/50 dark:border-purple-800/30 overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/40 dark:bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed relative z-10">
            最近你记录了很多关于<span className="font-semibold text-purple-600 dark:text-purple-400 mx-0.5">旅行</span>和<span className="font-semibold text-blue-600 dark:text-blue-400 mx-0.5">美食</span>的瞬间，生活充满了色彩。
          </p>
          
          {moodStats.length > 0 && (
            <div className="mt-4 pt-3 border-t border-purple-200/50 dark:border-purple-800/30 relative z-10">
              <div className="flex flex-wrap gap-2">
                {moodStats.map(([mood, { count, emoji }]) => (
                  <div key={mood} className="flex items-center gap-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 text-xs">
                    <span className="text-sm">{emoji}</span>
                    <span className="font-bold text-gray-500 dark:text-gray-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Photos Grid */}
      {recentPhotos.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-4 h-4 text-green-500" />
            <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">最近影像</h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {recentPhotos.slice(0, 6).map((photo, i) => (
              <div 
                key={i} 
                className="aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all group border border-gray-100 dark:border-gray-800"
                onClick={() => navigate(`/?date=${entries.find(e => e.id === photo.entryId)?.date}`)}
              >
                <img src={photo.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>
      )}

    </aside>
  );
}
