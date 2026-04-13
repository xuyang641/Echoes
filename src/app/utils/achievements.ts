import { DiaryEntry } from '../components/diary-entry-form';
import { Trophy, Flame, Map, Palette, Camera, Calendar } from 'lucide-react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  condition: (entries: DiaryEntry[]) => boolean;
  progress: (entries: DiaryEntry[]) => number;
  maxProgress: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-step',
    title: 'First Memory',
    description: 'Create your first diary entry',
    icon: Camera,
    color: 'text-blue-500 bg-blue-100',
    condition: (entries) => entries.length >= 1,
    progress: (entries) => Math.min(entries.length, 1),
    maxProgress: 1
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Post consecutively for 7 days',
    icon: Flame,
    color: 'text-orange-500 bg-orange-100',
    condition: (entries) => calculateStreak(entries) >= 7,
    progress: (entries) => Math.min(calculateStreak(entries), 7),
    maxProgress: 7
  },
  {
    id: 'mood-explorer',
    title: 'Emotional Spectrum',
    description: 'Log 5 different moods',
    icon: Palette,
    color: 'text-purple-500 bg-purple-100',
    condition: (entries) => new Set(entries.map(e => e.mood)).size >= 5,
    progress: (entries) => Math.min(new Set(entries.map(e => e.mood)).size, 5),
    maxProgress: 5
  },
  {
    id: 'globetrotter',
    title: 'Globetrotter',
    description: 'Post from 3 different locations',
    icon: Map,
    color: 'text-green-500 bg-green-100',
    condition: (entries) => new Set(entries.filter(e => e.location).map(e => e.location?.name || '')).size >= 3,
    progress: (entries) => Math.min(new Set(entries.filter(e => e.location).map(e => e.location?.name || '')).size, 3),
    maxProgress: 3
  },
  {
    id: 'month-master',
    title: 'Dedicated Diarist',
    description: 'Reach 30 total entries',
    icon: Trophy,
    color: 'text-yellow-500 bg-yellow-100',
    condition: (entries) => entries.length >= 30,
    progress: (entries) => Math.min(entries.length, 30),
    maxProgress: 30
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Post an entry before 8 AM',
    icon: Calendar,
    color: 'text-sky-500 bg-sky-100',
    condition: (entries) => entries.some(e => {
      const date = new Date(e.date);
      return date.getHours() >= 4 && date.getHours() < 8;
    }),
    progress: (entries) => entries.some(e => {
      const date = new Date(e.date);
      return date.getHours() >= 4 && date.getHours() < 8;
    }) ? 1 : 0,
    maxProgress: 1
  }
];

function calculateStreak(entries: DiaryEntry[]): number {
  if (!entries || entries.length === 0) return 0;
  
  // Extract unique dates as YYYY-MM-DD strings to ignore time and handle multiple entries per day
  const uniqueDates = [...new Set(entries.map(e => {
    const d = new Date(e.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }))];

  // Sort descending
  uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // If latest entry is not today and not yesterday, streak is 0
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i]);
    const next = new Date(uniqueDates[i+1]);
    
    // Calculate difference in days
    const diffTime = current.getTime() - next.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}