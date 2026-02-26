import { useMemo, useState } from 'react';
import { DiaryEntry } from './diary-entry-form';
import { format, startOfToday, subDays, getDay } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Music, Calendar, Map as MapIcon, Smile, Hash, 
  TrendingUp, Activity, Award, Disc, Play, X, Quote, ArrowRight, Star
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { LazyImage } from './ui/lazy-image';
import { MoodPixelGrid } from './mood-pixel-grid';

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
  if (!entries.length) return { total: 0, streak: 0, topMood: 'N/A', topLocation: 'N/A' };

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
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Top Location
  const locCounts: Record<string, number> = {};
  entries.forEach(e => {
    const locName = typeof e.location === 'object' ? e.location.name : e.location;
    if (locName) {
      locCounts[locName] = (locCounts[locName] || 0) + 1;
    }
  });
  const topLocation = Object.entries(locCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

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
  const dayCounts = Array(7).fill(0).map((_, i) => ({ name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], value: 0 }));
  entries.forEach(e => {
    const day = getDay(new Date(e.date));
    dayCounts[day].value++;
  });

  return { moodData, dayData: dayCounts };
}

// --- Components ---

function BentoCard({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function StatItem({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex items-center gap-4 group">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white font-serif tracking-tight">{value}</div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function MiniPlayer({ entry, onClick }: { entry: DiaryEntry, onClick: () => void }) {
  if (!entry) return null;
  return (
    <div 
      onClick={onClick}
      className="relative h-full w-full overflow-hidden cursor-pointer group"
    >
      <div className="absolute inset-0">
        <LazyImage src={entry.photo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex items-center gap-2 text-xs font-mono text-white/70 mb-3 uppercase tracking-widest">
          <Disc className="w-3 h-3 animate-spin-slow" />
          <span>On Repeat</span>
        </div>
        <h3 className="text-2xl font-serif font-bold truncate leading-tight mb-1 group-hover:text-yellow-300 transition-colors">"{entry.caption}"</h3>
        <p className="text-sm text-white/60 truncate">{format(new Date(entry.date), 'MMMM do, yyyy')}</p>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100 border border-white/30">
        <Play className="w-6 h-6 fill-white text-white ml-1" />
      </div>
    </div>
  );
}

function StoryOverlay({ entry, onClose }: { entry: DiaryEntry, onClose: () => void }) {
  if (!entry) return null;
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="max-w-md w-full bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl relative border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="aspect-square relative group">
          <LazyImage src={entry.photo} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <button onClick={onClose} className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition-colors border border-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 relative">
          <div className="absolute -top-6 right-8 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg transform rotate-12">
            <Quote className="w-5 h-5 text-black fill-current" />
          </div>
          
          <div className="flex items-center gap-2 mb-6">
             <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 ${MOOD_COLORS[entry.mood] ? 'text-white' : ''}`} style={{ color: MOOD_COLORS[entry.mood] }}>
               {entry.mood}
             </span>
             <span className="text-xs text-gray-500 font-mono">{format(new Date(entry.date), 'yyyy.MM.dd')}</span>
          </div>
          
          <p className="text-2xl font-serif leading-relaxed text-gray-200 italic mb-6">
            "{entry.caption}"
          </p>
          
          <div className="pt-6 border-t border-white/5 flex items-center gap-2 text-sm text-gray-500">
            <MapIcon className="w-4 h-4" />
            <span>{typeof entry.location === 'object' ? entry.location.name : (entry.location || 'Unknown Location')}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function InsightsView({ entries }: InsightsViewProps) {
  const { t } = useTranslation();
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  const stats = useMemo(() => calculateStats(entries), [entries]);
  const { moodData, dayData } = useMemo(() => getChartData(entries), [entries]);
  
  const highlightEntry = useMemo(() => {
    return entries.find(e => e.mood === 'Happy' || e.mood === 'Excited') || entries[0];
  }, [entries]);

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Activity className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('insights.noData')}</h2>
        <p className="text-gray-500 max-w-md">{t('insights.startWriting')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6">
      
      {/* Title Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">
          {t('insights.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          {t('insights.subtitle')}
        </p>
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
        
        {/* 1. Highlight Card (Large, 2x2) */}
        <BentoCard className="md:col-span-2 md:row-span-2 !p-0 overflow-hidden relative" delay={0.1}>
          <MiniPlayer entry={highlightEntry} onClick={() => setSelectedEntry(highlightEntry)} />
        </BentoCard>

        {/* 2. Stats Grid (2x1) */}
        <BentoCard className="md:col-span-2 flex flex-col justify-center" delay={0.2}>
          <div className="grid grid-cols-2 gap-y-8 gap-x-4">
            <StatItem 
              icon={Calendar} 
              label={t('insights.totalMemories')} 
              value={stats.total} 
              color="bg-blue-500" 
            />
            <StatItem 
              icon={TrendingUp} 
              label={t('insights.currentStreak')} 
              value={stats.streak} 
              color="bg-green-500" 
            />
            <StatItem 
              icon={Smile} 
              label={t('insights.topMood')} 
              value={t(`moods.${stats.topMood.toLowerCase()}`, stats.topMood)} 
              color="bg-yellow-500" 
            />
            <StatItem 
              icon={MapIcon} 
              label={t('insights.topLocation')} 
              value={stats.topLocation} 
              color="bg-purple-500" 
            />
          </div>
        </BentoCard>

        {/* 3. Mood Distribution (1x1) */}
        <BentoCard className="md:col-span-1" delay={0.3}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
              <Smile className="w-4 h-4 text-gray-400" />
              {t('insights.moodDistribution')}
            </h3>
          </div>
          <div className="h-[120px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={moodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {moodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.name] || '#9CA3AF'} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', borderRadius: '8px', border: 'none', color: 'white', fontSize: '12px' }}
                  itemStyle={{ color: 'white' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-300 opacity-20">{stats.total}</span>
            </div>
          </div>
        </BentoCard>

        {/* 4. Activity Chart (1x1) */}
        <BentoCard className="md:col-span-1" delay={0.4}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-gray-400" />
              {t('insights.activity')}
            </h3>
          </div>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData}>
                <Bar 
                  dataKey="value" 
                  fill="#3B82F6" 
                  radius={[4, 4, 4, 4]} 
                  barSize={6}
                  fillOpacity={0.8}
                />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 10 }} 
                  dy={5}
                  interval={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* 5. Mood Pixel Grid (Full Width) */}
        <BentoCard className="md:col-span-4" delay={0.5}>
          <MoodPixelGrid entries={entries} />
        </BentoCard>

      </div>

      <AnimatePresence>
        {selectedEntry && (
          <StoryOverlay entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
        )}
      </AnimatePresence>

    </div>
  );
}
