import { useMemo, useState, useEffect, useRef } from 'react';
import { DiaryEntry } from '../components/diary-entry-form';
import { format, startOfToday, subDays } from 'date-fns';
import { 
  Map as MapIcon, Smile, 
  Play, X, Quote, Hash,
  Camera, RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { LazyImage } from '../components/ui/lazy-image';
import { MoodPixelGrid } from '../components/mood-pixel-grid';
import { haptics } from '../utils/haptics';
import { EmptyState } from '../components/ui/empty-state';
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

// --- Components ---

function BentoCard({ children, className = "", delay = 0, title, icon: Icon }: { children: React.ReactNode, className?: string, delay?: number, title?: string, icon?: React.ElementType }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, type: "spring", stiffness: 100, damping: 20 }}
      className={`bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-500 flex flex-col group ${className}`}
    >
      {title && (
        <div className="flex items-center gap-2.5 mb-6 text-zinc-600 dark:text-zinc-300">
          <div className="p-2 bg-white/50 dark:bg-black/20 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 group-hover:scale-110 transition-transform duration-300">
            {Icon && <Icon className="w-4 h-4" />}
          </div>
          <h3 className="text-[13px] font-bold tracking-widest text-zinc-800 dark:text-zinc-200">{title}</h3>
        </div>
      )}
      <div className="flex-1 min-h-0 relative">
        {children}
      </div>
    </motion.div>
  );
}

function StatItem({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string | number, color: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
        <div className="p-1.5 bg-white/50 dark:bg-black/20 rounded-lg shadow-sm">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className={`text-4xl font-bold ${color.replace('bg-', 'text-')} font-serif tracking-tight drop-shadow-sm`}>
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
          "{currentEntry.caption?.replace(/<[^>]*>?/gm, '') || t('entry.noCaption')}"
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
                {entry.caption?.replace(/<[^>]*>?/gm, '')}
              </p>
            </div>
            
          </div>
          
          <div className="pt-6 mt-6 border-t border-white/5 flex items-center gap-2 text-sm text-zinc-500">
            <MapIcon className="w-4 h-4" />
            <span>{typeof entry.location === 'object' ? (entry.location?.name || '未知位置') : (entry.location || '未知位置')}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TagCloud({ entries, onTagClick }: { entries: DiaryEntry[], onTagClick: (tag: string) => void }) {
  // Extract and count all tags
  const tags = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(entry => {
      // Combine manual tags and AI tags
      const allTags = [...(entry.tags || []), ...(entry.aiTags || [])];
      allTags.forEach(tag => {
        if (!tag) return;
        const lowerTag = tag.toLowerCase();
        counts[lowerTag] = (counts[lowerTag] || 0) + 1;
      });
    });

    // Sort by frequency and take top 20
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    // Calculate min/max for scaling
    const maxCount = sorted[0]?.[1] || 1;
    const minCount = sorted[sorted.length - 1]?.[1] || 1;

    // Map to objects with size and random position/delay properties
    return sorted.map(([text, count], index) => {
      // Calculate font size (e.g., between 0.8rem and 2.5rem)
      const scale = maxCount === minCount ? 1 : (count - minCount) / (maxCount - minCount);
      const fontSize = 0.8 + (scale * 1.7);
      
      // Randomize opacity a bit for depth
      const opacity = 0.6 + (scale * 0.4);

      // Randomize colors to be more vibrant
      const vibrantColors = [
        'text-blue-500 dark:text-blue-400',
        'text-emerald-500 dark:text-emerald-400',
        'text-amber-500 dark:text-amber-400',
        'text-rose-500 dark:text-rose-400',
        'text-fuchsia-500 dark:text-fuchsia-400',
        'text-cyan-500 dark:text-cyan-400',
        'text-violet-500 dark:text-violet-400'
      ];
      
      const isTopTier = scale > 0.7;
      // Top tier gets primary vibrant colors, others get random vibrant colors or neutral
      let colorClass = isTopTier 
        ? vibrantColors[index % vibrantColors.length] 
        : (Math.random() > 0.3 
            ? vibrantColors[Math.floor(Math.random() * vibrantColors.length)] 
            : 'text-zinc-500 dark:text-zinc-400');
            
      // Calculate random animation values for the floating effect
      const yOffset = (Math.random() * 8) - 4; // -4px to 4px
      const animationDuration = 3 + Math.random() * 2; // 3-5 seconds
      const animationDelay = Math.random() * 2; // 0-2 seconds delay

      return {
        text,
        count,
        fontSize,
        opacity,
        colorClass,
        delay: index * 0.05,
        yOffset,
        animationDuration,
        animationDelay
      };
    });
  }, [entries]);

  if (tags.length === 0) {
    return (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center text-zinc-400 text-sm font-serif">
        <Hash className="w-4 h-4 mr-2 opacity-50" />
        暂无记忆关键词
      </div>
    );
  }

  return (
    <div className="w-full min-h-[250px] flex flex-wrap items-center justify-center gap-x-6 gap-y-4 py-8 px-4 content-center">
      {tags.map((tag) => (
        <motion.div
          key={tag.text}
          animate={{
            y: [tag.yOffset, -tag.yOffset, tag.yOffset],
          }}
          transition={{
            duration: tag.animationDuration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: tag.animationDelay
          }}
          className="inline-block"
        >
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: tag.opacity, scale: 1 }}
            whileHover={{ 
              scale: 1.15, 
              opacity: 1, 
              textShadow: "0px 0px 12px currentColor",
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ delay: tag.delay, duration: 0.5, type: "spring" }}
            onClick={() => {
              haptics.light();
              onTagClick(tag.text);
            }}
            className={`font-serif tracking-wide transition-colors font-medium ${tag.colorClass}`}
            style={{ fontSize: `${tag.fontSize}rem` }}
          >
            {tag.text}
          </motion.button>
        </motion.div>
      ))}
    </div>
  );
}

export function InsightsView({ entries }: InsightsViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  const stats = useMemo(() => calculateStats(entries), [entries]);

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
        className="flex flex-col gap-6 px-4"
      >
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-zinc-900 dark:text-white mb-4 tracking-tight leading-tight">
            在这里，你已经留下了 <span className="text-blue-600 dark:text-blue-400">{stats.total}</span> 个闪光的瞬间，最长坚持了 <span className="text-emerald-500">{stats.streak}</span> 天。
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed font-serif italic">
            "记忆不是用来被统计的，而是用来被重新感受的。这是你的生活长卷。"
          </p>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Flashback & Highlights (8 cols) */}
        <div className="md:col-span-8 space-y-8">
          {/* Flashback Card */}
          <BentoCard className="h-[400px] md:h-[500px] !p-0 overflow-hidden relative border-none ring-1 ring-black/5 shadow-2xl shadow-black/10" delay={0.1}>
            <FlashbackCard entries={entries} onPlay={setSelectedEntry} />
          </BentoCard>

          {/* Tag Cloud Row */}
          <div className="grid grid-cols-1 gap-8">
             <BentoCard title="记忆关键词" icon={Hash} delay={0.4} className="bg-white/40 dark:bg-zinc-900/40 border-white/20 dark:border-white/5">
               <TagCloud 
                 entries={entries} 
                 onTagClick={(tag) => {
                   // For now, just navigate to home with the tag as a search query
                   navigate(`/?q=${encodeURIComponent(tag)}`);
                 }} 
               />
             </BentoCard>
          </div>
        </div>

        {/* Right Column: Narrative & Mood (4 cols) */}
        <div className="md:col-span-4 space-y-8">
          
          {/* Narrative Card */}
          <BentoCard delay={0.2} className="bg-white/60 dark:bg-zinc-900/60 shadow-lg">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="text-sm text-zinc-500 font-medium tracking-widest uppercase">最常记录的心情</div>
                <div className="text-3xl font-serif text-zinc-900 dark:text-white flex items-center gap-3">
                  <span className="text-4xl">{t(`moods.${stats.topMood.toLowerCase()}`)}</span>
                </div>
              </div>
              
              <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800" />
              
              <div className="space-y-2">
                <div className="text-sm text-zinc-500 font-medium tracking-widest uppercase">灵魂常驻地</div>
                <div className="text-2xl font-serif text-zinc-900 dark:text-white flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-fuchsia-500" />
                  {stats.topLocation}
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Emotional Resonance (Replacing Pixel Grid) */}
          <BentoCard title="情绪共振" icon={Smile} delay={0.6} className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-100/50 dark:border-indigo-800/30">
            <div className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                过去的一段时间里，你的情绪像是一首跌宕起伏的歌。有 <span className="font-bold text-yellow-500">阳光明媚</span> 的时刻，也有 <span className="font-bold text-blue-500">偶尔的低谷</span>。但最重要的是，你把它们都真实地记录了下来。
              </p>
              
              {/* Abstract visual representation instead of a rigid grid */}
              <div className="w-full h-32 relative rounded-2xl overflow-hidden bg-white/40 dark:bg-black/20 flex items-center justify-center border border-white/20">
                <div className="absolute inset-0 opacity-50 mix-blend-multiply dark:mix-blend-screen" style={{
                  background: 'radial-gradient(circle at 30% 50%, rgba(250, 204, 21, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(99, 102, 241, 0.4) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(236, 72, 153, 0.4) 0%, transparent 50%)',
                  filter: 'blur(20px)'
                }} />
                <div className="relative z-10 text-center">
                  <div className="text-2xl mb-1">✨</div>
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">保持真实</div>
                </div>
              </div>
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
