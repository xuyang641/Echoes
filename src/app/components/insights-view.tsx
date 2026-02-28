import { useMemo, useState, useEffect } from 'react';
import { DiaryEntry } from './diary-entry-form';
import { format, startOfToday, subDays, getDay } from 'date-fns';
import { 
  BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Calendar, Map as MapIcon, Smile, 
  TrendingUp, Activity, Disc, Play, X, Quote, 
  Camera, RefreshCw, Hash
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { LazyImage } from './ui/lazy-image';
import { MoodPixelGrid } from './mood-pixel-grid';
import { haptics } from '../utils/haptics';
import { EmptyState } from './ui/empty-state';
import { useNavigate } from 'react-router-dom';

interface InsightsViewProps {
  entries: DiaryEntry[];
}

const MOOD_COLORS: Record<string, string> = {
  'Happy': '#FACC15',    // yellow-400
  'Excited': '#A855F7',  // purple-500
  'Energetic': '#F97316',// orange-500
  'Grateful': '#EC4899', // pink-500
  'Inspired': '#6366F1', // indigo-500
  'Calm': '#22C55E',     // green-500
  'Stressed': '#9CA3AF', // gray-400
  'Sad': '#60A5FA',      // blue-400
  'Anxious': '#94A3B8',  // slate-400
  'Angry': '#EF4444',    // red-500
  'Tired': '#78716C',    // stone-500
  'Neutral': '#A1A1AA'   // zinc-400
};

// --- Helper Functions ---

function calculateStats(entries: DiaryEntry[]) {
  if (!entries.length) return { total: 0, streak: 0, topMood: '无数据', topLocation: '无数据' };

  // Total
  const total = entries.length;

  // Streak (Simplified)
  const sortedDates = [...new Set(entries.map(e => format(new Date(e.date), 'yyyy-MM-dd')))].sort().reverse();
  let streak = 0;
  let currentCheck = startOfToday();
  
  // Check if today or yesterday has entry to start streak
  const hasToday = sortedDates.includes(format(currentCheck, 'yyyy-MM-dd'));
  const hasYesterday = sortedDates.includes(format(subDays(currentCheck, 1), 'yyyy-MM-dd'));
  
  if (hasToday || hasYesterday) {
    streak = 1;
    let checkDate = hasToday ? subDays(currentCheck, 1) : subDays(currentCheck, 2);
    while (sortedDates.includes(format(checkDate, 'yyyy-MM-dd'))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }
  }

  // Top Mood
  const moodCounts: Record<string, number> = {};
  entries.forEach(e => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '无数据';

  // Top Location
  const locCounts: Record<string, number> = {};
  entries.forEach(e => {
    // If location is an object, prefer name. If string, use as is.
    // If the string is "Current Location", try to filter it out or count it (depending on requirement).
    // The user wants specific places. If the data is "Current Location", it's likely a default/fallback.
    // However, if that's all we have, we display it.
    // Ideally, we'd have a localized "Current Location" string if that's what it is.
    const locName = typeof e.location === 'object' ? e.location.name : e.location;
    if (locName) {
      locCounts[locName] = (locCounts[locName] || 0) + 1;
    }
  });
  const topLocation = Object.entries(locCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '无数据';

  return { total, streak, topMood, topLocation };
}

function getChartData(entries: DiaryEntry[]) {
  // Mood Distribution
  const moodCounts: Record<string, number> = {};
  entries.forEach(e => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });
  const moodData = Object.entries(moodCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Activity by Day of Week
  const dayCounts = Array(7).fill(0).map((_, i) => ({ name: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][i], value: 0 }));
  entries.forEach(e => {
    const day = getDay(new Date(e.date));
    dayCounts[day].value++;
  });

  return { moodData, dayData: dayCounts };
}

// --- Components ---

function BentoCard({ children, className = "", delay = 0, title, icon: Icon }: { children: React.ReactNode, className?: string, delay?: number, title?: string, icon?: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col ${className}`}
    >
      {title && (
        <div className="flex items-center gap-2 mb-4 text-zinc-500 dark:text-zinc-400">
          {Icon && <Icon className="w-4 h-4" />}
          <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
        </div>
      )}
      <div className="flex-1 min-h-0 relative">
        {children}
      </div>
    </motion.div>
  );
}

function StatItem({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-3xl font-bold ${color.replace('bg-', 'text-')} font-serif tracking-tight`}>
        {value}
      </div>
    </div>
  );
}

function FlashbackCard({ entries, onPlay }: { entries: DiaryEntry[], onPlay: (entry: DiaryEntry) => void }) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter entries with photos
  const photoEntries = useMemo(() => entries.filter(e => e.photo).slice(0, 5), [entries]);
  const currentEntry = photoEntries[currentIndex];

  useEffect(() => {
    if (photoEntries.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % photoEntries.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [photoEntries]);

  if (!currentEntry) return (
    <div className="h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
      <Camera className="w-8 h-8 mb-2 opacity-50" />
      <span className="text-sm">暂无照片回忆</span>
    </div>
  );

  return (
    <div 
      onClick={() => {
        onPlay(currentEntry);
        haptics.medium();
      }}
      className="relative h-full w-full overflow-hidden cursor-pointer group rounded-xl"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentEntry.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <LazyImage src={currentEntry.photo} alt={currentEntry.caption || "回忆照片"} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
        <div className="flex items-center gap-2 text-xs font-mono text-white/70 mb-2 uppercase tracking-widest">
          <RefreshCw className="w-3 h-3 animate-spin-slow" />
          <span>{t('insights.flashback')}</span>
        </div>
        <h3 className="text-xl font-serif font-bold truncate leading-tight mb-1 group-hover:text-yellow-300 transition-colors">
          "{currentEntry.caption || t('entry.noCaption')}"
        </h3>
        <p className="text-sm text-white/60 truncate">
          {format(new Date(currentEntry.date), 'yyyy年MM月dd日')}
        </p>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <div className="flex gap-1">
          {photoEntries.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-white' : 'w-1 bg-white/30'}`} 
            />
          ))}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:scale-110 transition-transform">
          <Play className="w-6 h-6 fill-white text-white ml-1" />
        </div>
      </div>
    </div>
  );
}

function StoryOverlay({ entry, onClose }: { entry: DiaryEntry, onClose: () => void }) {
  if (!entry) return null;
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="max-w-4xl w-full bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl relative border border-white/10 flex flex-col md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        {/* Photo Side */}
        <div className="md:w-3/5 aspect-square md:aspect-auto relative bg-black">
          <LazyImage src={entry.photo} alt={entry.caption || "详情照片"} className="w-full h-full object-contain" />
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition-colors border border-white/10 md:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Side */}
        <div className="md:w-2/5 p-8 flex flex-col relative bg-zinc-900">
          <button onClick={onClose} className="hidden md:block absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2 mb-6 mt-2">
             <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 ${MOOD_COLORS[entry.mood] ? 'text-white' : ''}`} style={{ color: MOOD_COLORS[entry.mood] }}>
               {entry.mood}
             </span>
             <span className="text-xs text-zinc-500 font-mono">{format(new Date(entry.date), 'yyyy.MM.dd')}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="relative">
              <Quote className="w-8 h-8 text-zinc-700 absolute -top-4 -left-2 opacity-50" />
              <p className="text-xl font-serif leading-relaxed text-zinc-200 italic relative z-10 pl-6">
                {entry.caption}
              </p>
            </div>
            
          </div>
          
          <div className="pt-6 mt-6 border-t border-white/5 flex items-center gap-2 text-sm text-zinc-500">
            <MapIcon className="w-4 h-4" />
            <span>{typeof entry.location === 'object' ? entry.location.name : (entry.location || '未知位置')}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function InsightsView({ entries }: InsightsViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  const stats = useMemo(() => calculateStats(entries), [entries]);
  const { moodData, dayData } = useMemo(() => getChartData(entries), [entries]);
  
  // Memoize the MoodPixelGrid entries to prevent re-renders unless entries actually change
  const pixelGridEntries = useMemo(() => entries, [entries]);

  if (!entries.length) {
    return (
      <EmptyState 
        type="insights" 
        onAction={() => navigate('/add')}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8 w-full overflow-x-hidden">
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
            回忆盘点
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">
            你的生活足迹与情感分析
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-3xl font-bold text-zinc-900 dark:text-white font-mono">{stats.total}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">累计回忆</div>
          </div>
          <div className="w-px bg-zinc-200 dark:bg-zinc-800 h-12" />
          <div className="text-right">
            <div className="text-3xl font-bold text-green-500 font-mono">{stats.streak}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">连续记录</div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Flashback & Stats (8 cols) */}
        <div className="md:col-span-8 space-y-6">
          {/* Flashback Card */}
          <BentoCard className="h-[300px] md:h-[400px] !p-0 overflow-hidden relative border-none ring-1 ring-black/5" delay={0.1}>
            <FlashbackCard entries={entries} onPlay={setSelectedEntry} />
          </BentoCard>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BentoCard className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800" delay={0.2}>
              <StatItem icon={Calendar} label="活跃天数" value={stats.total} color="text-blue-600" />
            </BentoCard>
            <BentoCard className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800" delay={0.25}>
              <StatItem icon={TrendingUp} label="最长连续" value={stats.streak} color="text-green-600" />
            </BentoCard>
            <BentoCard className="bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-800" delay={0.3}>
              <StatItem icon={Smile} label="年度心情" value={stats.topMood === '无数据' ? stats.topMood : t(`moods.${stats.topMood.toLowerCase()}`)} color="text-yellow-600" />
            </BentoCard>
            <BentoCard className="bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800" delay={0.35}>
              <StatItem icon={MapIcon} label="常驻地点" value={stats.topLocation} color="text-purple-600" />
            </BentoCard>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mood Distribution */}
            <BentoCard title="心情光谱" icon={Disc} delay={0.4}>
              <div className="h-[200px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {moodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.name] || '#9CA3AF'} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: 'none', color: 'white', fontSize: '12px', padding: '8px 12px' }}
                      itemStyle={{ color: 'white' }}
                      formatter={(value, name) => [value, t(`moods.${String(name).toLowerCase()}`)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Stats */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ transform: 'translateY(5px)' }}>
                  <span className="text-3xl font-bold text-zinc-800 dark:text-zinc-200">{stats.total}</span>
                  <span className="text-xs text-zinc-400 uppercase tracking-widest">条回忆</span>
                </div>
              </div>
            </BentoCard>

            {/* Weekly Activity */}
            <BentoCard title="写作节奏" icon={Activity} delay={0.45}>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayData}>
                    <Bar 
                      dataKey="value" 
                      fill="#3B82F6" 
                      radius={[6, 6, 6, 6]} 
                      barSize={12}
                      fillOpacity={0.8}
                    />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 11 }} 
                      dy={10}
                      interval={0}
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: 'none', color: 'white', fontSize: '12px' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </BentoCard>
          </div>
        </div>

        {/* Right Column: Pixel Grid (4 cols) */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Pixel Grid */}
          <BentoCard title="心情格子" icon={Hash} delay={0.6}>
            <div className="overflow-hidden">
               {/* Use memoized entries */}
               <MoodPixelGrid entries={pixelGridEntries} />
            </div>
          </BentoCard>

        </div>

      </div>

      <AnimatePresence>
        {selectedEntry && (
          <StoryOverlay entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
        )}
      </AnimatePresence>

    </div>
  );
}
