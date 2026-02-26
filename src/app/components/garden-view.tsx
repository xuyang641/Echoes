import { useState, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { DiaryEntry } from './diary-entry-form';
import { Sparkles, Sprout, Loader2 } from 'lucide-react';
import { GardenScene } from './garden-scene';

interface GardenViewProps {
  entries: DiaryEntry[];
}

// Map moods to Plant Types (matching GardenScene logic)
const MOOD_PLANT_TYPES: Record<string, string> = {
  'Happy': 'Sunflower',
  'Excited': 'Sunflower',
  'Energetic': 'Sunflower',
  'Grateful': 'Rose',
  'Inspired': 'Rose',
  'Sad': 'Rain Lily',
  'Anxious': 'Rain Lily',
  'Calm': 'Bamboo',
  'Neutral': 'Bamboo',
  'Stressed': 'Cactus',
  'Angry': 'Cactus',
  'Tired': 'Cactus',
};

export function GardenView({ entries }: GardenViewProps) {
  const { t } = useTranslation();
  
  // Determine weather
  const currentWeather = useMemo(() => {
    if (entries.length === 0) return 'sunny';
    const recent = entries.slice(0, 5);
    const negativeCount = recent.filter(e => ['Sad', 'Stressed', 'Angry', 'Anxious', 'Tired'].includes(e.mood)).length;
    if (negativeCount > 2) return 'rainy';
    // const calmCount = recent.filter(e => ['Calm', 'Neutral'].includes(e.mood)).length;
    // if (calmCount > 2) return 'cloudy';
    return 'sunny';
  }, [entries]);

  // Transform entries into 3D Plant objects
  const plants = useMemo(() => {
    // Sort by date to arrange them
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sorted.map((entry, index) => {
      // Calculate position in a grid or spiral
      // Simple grid for now: 5 per row
      const row = Math.floor(index / 5);
      const col = index % 5;
      // Center the grid
      const x = (col - 2) * 3 + (Math.random() * 0.5); // Add jitter
      const z = (row * -2) + (Math.random() * 0.5); // Start from front (z=0) and go back
      
      return {
        id: entry.id,
        type: MOOD_PLANT_TYPES[entry.mood] || 'Sunflower',
        position: [x, 0, z] as [number, number, number],
        label: (
          <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md p-3 rounded-xl shadow-xl border border-white/20 text-center min-w-[120px]">
             <p className="text-xs font-bold text-gray-500 mb-1">{new Date(entry.date).toLocaleDateString()}</p>
             <p className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2">{entry.caption}</p>
             <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full mt-1 inline-block">
               {t(`moods.${entry.mood.toLowerCase()}`)}
             </span>
          </div>
        )
      };
    });
  }, [entries, t]);

  // Prompt Logic
  const todayPrompt = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000) % 10 + 1; // 1-10
    return t(`garden.prompts.${dayIndex}`, "Capture a shadow that looks interesting.");
  }, [t]);

  return (
    <div className="w-full h-[calc(100vh-100px)] flex flex-col relative animate-in fade-in duration-1000">
      
      {/* Overlay UI */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 pointer-events-none">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-4">
          <div className="pointer-events-auto">
             <h1 className="text-4xl font-bold text-white drop-shadow-md font-serif">
              {t('garden.title')}
            </h1>
            <p className="text-white/90 drop-shadow-sm max-w-lg mt-2 text-lg">
              {t('garden.subtitle')}
            </p>
          </div>

          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pointer-events-auto inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl px-6 py-3 rounded-full border border-white/30 text-white font-medium shadow-lg hover:bg-white/30 transition-colors cursor-default"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>{todayPrompt}</span>
          </motion.div>
        </div>
      </div>

      {/* 3D Scene Container */}
      <div className="flex-1 w-full h-full bg-gradient-to-b from-sky-300 to-emerald-200 dark:from-slate-900 dark:to-emerald-900">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Planting garden...</span>
          </div>
        }>
          <GardenScene weather={currentWeather} plants={plants} />
        </Suspense>
      </div>

      {/* Empty State Overlay */}
      {entries.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
          <div className="text-center text-white/80 p-8 bg-black/10 backdrop-blur-sm rounded-3xl">
            <Sprout className="w-20 h-20 mx-auto mb-4 animate-bounce" />
            <p className="text-2xl font-medium">{t('garden.empty')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
