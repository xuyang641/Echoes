import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Disc, CloudRain, Trees, Waves } from 'lucide-react';

export type SoundscapeType = 'rain' | 'forest' | 'ocean' | null;

interface VinylPlayerProps {
  onSelect: (type: SoundscapeType) => void;
  selectedSound: SoundscapeType;
}

const SOUNDSCAPES = [
  { id: 'rain', name: 'Rainy Day', icon: CloudRain, color: 'bg-blue-500', file: '/sounds/rain.mp3' },
  { id: 'forest', name: 'Forest Walk', icon: Trees, color: 'bg-green-600', file: '/sounds/forest.mp3' },
  { id: 'ocean', name: 'Ocean Waves', icon: Waves, color: 'bg-cyan-500', file: '/sounds/ocean.mp3' },
] as const;

export function VinylPlayer({ onSelect, selectedSound }: VinylPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Stop audio when component unmounts or sound changes to null
    if (!selectedSound) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    const sound = SOUNDSCAPES.find(s => s.id === selectedSound);
    if (sound) {
      if (!audioRef.current) {
        audioRef.current = new Audio(sound.file);
        audioRef.current.loop = true;
      } else {
        audioRef.current.src = sound.file;
      }
      
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
      }
    }
  }, [selectedSound]);

  const togglePlay = () => {
    if (!selectedSound) {
      // If nothing selected, select first one
      onSelect('rain');
      setIsPlaying(true);
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(e => console.error("Audio play failed", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSelect = (id: SoundscapeType) => {
    if (selectedSound === id) {
      // Toggle play if clicking same
      togglePlay();
    } else {
      onSelect(id);
      setIsPlaying(true);
    }
  };

  const currentSound = SOUNDSCAPES.find(s => s.id === selectedSound);

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Disc className={`w-4 h-4 ${isPlaying ? 'animate-spin-slow' : ''}`} />
          Soundscapes
        </h4>
        {selectedSound && (
          <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600">
            {currentSound?.name}
          </span>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {SOUNDSCAPES.map((sound) => {
          const Icon = sound.icon;
          const isSelected = selectedSound === sound.id;
          
          return (
            <button
              key={sound.id}
              onClick={() => handleSelect(sound.id as SoundscapeType)}
              className={`flex flex-col items-center gap-2 min-w-[64px] transition-all duration-300 ${
                isSelected ? 'scale-105' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden transition-all ${
                isSelected ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900' : ''
              } ${sound.color}`}>
                {/* Vinyl Texture */}
                <div className="absolute inset-0 opacity-20 bg-[repeating-radial-gradient(black,black_1px,transparent_2px,transparent_4px)]" />
                
                {/* Center Icon */}
                <div className={`relative z-10 text-white ${isSelected && isPlaying ? 'animate-pulse' : ''}`}>
                  {isSelected && isPlaying ? <Pause className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                
                {/* Rotating effect when playing */}
                {isSelected && isPlaying && (
                  <div className="absolute inset-0 border-2 border-white/30 rounded-full animate-spin-slow" style={{ animationDuration: '3s' }} />
                )}
              </div>
              <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                {sound.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}