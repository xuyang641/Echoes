import { Smile, Frown, Sparkles, Wind, Heart, Zap, Brain, Sun } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { haptics } from "@/app/utils/haptics";

export type MoodType = 
  | "happy" 
  | "sad" 
  | "excited" 
  | "calm" 
  | "anxious" 
  | "peaceful" 
  | "energetic" 
  | "thoughtful";

interface MoodOption {
  value: MoodType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const moodOptions: MoodOption[] = [
  { value: "happy", label: "Happy", icon: Smile, color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "sad", label: "Sad", icon: Frown, color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "excited", label: "Excited", icon: Sparkles, color: "bg-pink-100 text-pink-700 border-pink-300" },
  { value: "calm", label: "Calm", icon: Wind, color: "bg-teal-100 text-teal-700 border-teal-300" },
  { value: "anxious", label: "Anxious", icon: Zap, color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "peaceful", label: "Peaceful", icon: Heart, color: "bg-green-100 text-green-700 border-green-300" },
  { value: "energetic", label: "Energetic", icon: Sun, color: "bg-red-100 text-red-700 border-red-300" },
  { value: "thoughtful", label: "Thoughtful", icon: Brain, color: "bg-purple-100 text-purple-700 border-purple-300" },
];

interface MoodSelectorProps {
  selectedMood: MoodType | null;
  onSelectMood: (mood: MoodType) => void;
}

export function MoodSelector({ selectedMood, onSelectMood }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {moodOptions.map((mood) => {
        const Icon = mood.icon;
        const isSelected = selectedMood === mood.value;
        
        return (
          <button
            key={mood.value}
            type="button"
            onClick={() => {
                haptics.light(); // Light impact on selection
                onSelectMood(mood.value);
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
              mood.color,
              isSelected 
                ? "ring-2 ring-offset-2 ring-black scale-105" 
                : "opacity-60 hover:opacity-100"
            )}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs">{mood.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function getMoodConfig(mood: MoodType): MoodOption {
  return moodOptions.find(m => m.value === mood) || moodOptions[0];
}