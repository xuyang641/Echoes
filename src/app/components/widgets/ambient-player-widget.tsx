import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Disc, CloudRain, Trees, Waves, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type SoundscapeType = 'rain' | 'forest' | 'ocean' | null;

const SOUNDSCAPES = [
  { id: 'rain', name: '窗外落雨', icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20', file: '/sounds/rain.mp3' },
  { id: 'forest', name: '林间漫步', icon: Trees, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', file: '/sounds/forest.mp3' },
  { id: 'ocean', name: '海浪拍岸', icon: Waves, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-100 dark:border-cyan-500/20', file: '/sounds/ocean.mp3' },
] as const;

export function AmbientPlayerWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundscapeType>('rain');
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle sound change
  useEffect(() => {
    const sound = SOUNDSCAPES.find(s => s.id === selectedSound);
    if (sound && audioRef.current) {
      const wasPlaying = !audioRef.current.paused;
      audioRef.current.src = sound.file;
      if (isPlaying || wasPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
        setIsPlaying(true);
      }
    }
  }, [selectedSound]);

  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(e => console.error("Audio play failed", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const currentIndex = SOUNDSCAPES.findIndex(s => s.id === selectedSound);
    const nextIndex = (currentIndex + 1) % SOUNDSCAPES.length;
    setSelectedSound(SOUNDSCAPES[nextIndex].id as SoundscapeType);
    if (!isPlaying) togglePlay();
  };

  const currentSound = SOUNDSCAPES.find(s => s.id === selectedSound) || SOUNDSCAPES[0];
  const CurrentIcon = currentSound.icon;

  return (
    <div className="group relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Disc className={`w-4 h-4 text-gray-400 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
          <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">白噪音</h4>
        </div>
        
        {/* Compact Volume Control (Hover Reveal) */}
        <div 
          className="flex items-center gap-2"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
        >
          <AnimatePresence>
            {showVolume && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 60 }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden flex items-center"
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-14 h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-gray-500"
                />
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className={`relative overflow-hidden ${currentSound.bg} rounded-2xl p-1 border ${currentSound.border} transition-colors duration-500`}>
        <div className="flex items-center justify-between p-2">
          {/* Info Section */}
          <div className="flex items-center gap-3">
            <div 
              onClick={handleNext}
              className={`w-10 h-10 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 transition-transform ${currentSound.color}`}
            >
              <CurrentIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                {currentSound.name}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                {/* Simple Equalizer Animation */}
                <div className="flex items-end gap-[2px] h-2">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={isPlaying ? {
                        height: ['4px', '8px', '4px'],
                      } : { height: '2px' }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                      className={`w-[2px] rounded-full ${currentSound.color.replace('text-', 'bg-')}`}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400 uppercase ml-1">
                  {isPlaying ? 'Playing' : 'Paused'}
                </span>
              </div>
            </div>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-md hover:shadow-lg hover:scale-105 transition-all ${currentSound.color}`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
