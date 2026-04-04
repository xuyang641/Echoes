import { Smile, Frown, Heart, Coffee, Sun, Wind, Flame, Star } from 'lucide-react';

export interface Mood {
  name: string;
  icon: any;
  color: string;
  hex: string;
  isCustom?: boolean;
}

export const MOODS: Mood[] = [
  { name: 'Happy', icon: Smile, color: 'bg-yellow-100 text-yellow-700', hex: '#fcd34d' },
  { name: 'Sad', icon: Frown, color: 'bg-blue-100 text-blue-700', hex: '#60a5fa' },
  { name: 'Grateful', icon: Heart, color: 'bg-pink-100 text-pink-700', hex: '#f472b6' },
  { name: 'Calm', icon: Coffee, color: 'bg-green-100 text-green-700', hex: '#4ade80' },
  { name: 'Energetic', icon: Sun, color: 'bg-orange-100 text-orange-700', hex: '#fb923c' },
  { name: 'Peaceful', icon: Wind, color: 'bg-teal-100 text-teal-700', hex: '#5eead4' },
  { name: 'Angry', icon: Flame, color: 'bg-red-100 text-red-700', hex: '#f87171' },
  { name: 'Hopeful', icon: Star, color: 'bg-indigo-100 text-indigo-700', hex: '#818cf8' },
];

export const getMoodColor = (moodName: string, customMoods: Mood[] = []) => {
  const allMoods = [...MOODS, ...customMoods];
  const mood = allMoods.find(m => m.name === moodName);
  return mood?.hex || '#e5e7eb'; // Default gray
};
