import { useMemo, useState } from 'react';
import { DiaryEntry } from '../components/diary-entry-form';
import { Palette, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { rgbToHex } from '../utils/color-extractor';
import { LazyImage } from '../components/ui/lazy-image';

interface ColorDNAViewProps {
  entries: DiaryEntry[];
  onEntryClick: (id: string) => void;
}

export function ColorDNAView({ entries, onEntryClick }: ColorDNAViewProps) {
  const { t } = useTranslation();
  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const [isHoveringCore, setIsHoveringCore] = useState(false);
  const [stars, setStars] = useState<{x: number, y: number, size: number, delay: number, duration: number}[]>([]);

  // Generate stars on mount
  useMemo(() => {
    const newStars = [];
    for (let i = 0; i < 50; i++) {
      newStars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2
      });
    }
    setStars(newStars);
  }, []);

  // Extract all unique colors from all entries
  const allColors = useMemo(() => {
    const colors = new Set<string>();
    
    // Add colors from entries
    entries.forEach(e => {
      e.palette?.all.forEach(c => colors.add(c));
    });

    // Default colors if empty
    if (colors.size === 0) {
      const demoColors = [
        'rgb(255, 99, 71)', 'rgb(255, 165, 0)', 'rgb(255, 215, 0)', 
        'rgb(144, 238, 144)', 'rgb(32, 178, 170)', 'rgb(100, 149, 237)', 
        'rgb(147, 112, 219)', 'rgb(255, 105, 180)', 'rgb(139, 69, 19)', 
        'rgb(112, 128, 144)', 'rgb(255, 20, 147)', 'rgb(0, 191, 255)',
        'rgb(250, 128, 114)', 'rgb(64, 224, 208)', 'rgb(123, 104, 238)',
        'rgb(255, 0, 255)', 'rgb(0, 255, 127)', 'rgb(255, 250, 205)'
      ];
      demoColors.forEach(c => colors.add(c));
    }

    const sorted = Array.from(colors).sort((a, b) => a.localeCompare(b));
    return sorted;
  }, [entries]);

  // Split colors into three orbits for better spacing
  const { orbit1, orbit2, orbit3 } = useMemo(() => {
    const total = allColors.length;
    // Distribute logic: 
    // Orbit 1 (Inner): 6-8 items max
    // Orbit 2 (Mid): 10-12 items max
    // Orbit 3 (Outer): Remainder
    
    let o1: string[] = [], o2: string[] = [], o3: string[] = [];
    
    // Simple round-robin distribution weighted to outer rings
    allColors.forEach((c, i) => {
      if (i % 3 === 0 && o1.length < 8) o1.push(c);
      else if (i % 2 === 0 && o2.length < 12) o2.push(c);
      else o3.push(c);
    });

    return {
      orbit1: o1,
      orbit2: o2,
      orbit3: o3
    };
  }, [allColors]);

  // Filter entries based on selected color similarity
  const filteredEntries = useMemo(() => {
    if (!selectedHex) return [];
    
    return entries.filter(e => {
      if (!e.palette) return false;
      // Check if any color in the entry's palette is close to the selected color
      // Simple string match for now, could be improved with delta-E
      return e.palette.all.includes(selectedHex) || e.palette.dominant === selectedHex;
    });
  }, [selectedHex, entries]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-6 h-6 text-pink-500" />
          <h2 className="text-xl font-bold text-gray-800">Color DNA Search</h2>
        </div>
        {selectedHex && (
          <button 
            onClick={() => setSelectedHex(null)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 px-3 py-1 rounded-full transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Custom Styles for Orbital Animation */}
      <style>{`
        @keyframes orbit-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-ccw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes float-planet {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(5deg); }
        }
        @keyframes shooting-star {
          0% { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 1; }
          100% { transform: translateX(200px) translateY(200px) rotate(-45deg); opacity: 0; }
        }
        .star {
          position: absolute;
          background: white;
          border-radius: 50%;
        }
        .shooting-star {
          position: absolute;
          top: 0;
          left: 0;
          width: 2px;
          height: 2px;
          background: white;
          box-shadow: 0 0 10px white, 0 0 20px white;
          animation: shooting-star 2s linear infinite;
        }
        .orbit-ring-track {
          border: 1px dashed rgba(255, 255, 255, 0.05);
          border-radius: 50%;
        }
        .planet-glow {
          box-shadow: inset -2px -2px 6px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(255,255,255,0.3);
        }
        .orbit-container:hover .orbit-ring {
          animation-play-state: paused;
        }
      `}</style>

      <div className="bg-gray-950 p-8 rounded-[3rem] shadow-2xl border border-gray-800 relative overflow-hidden min-h-[600px] flex flex-col items-center group/space">
        {/* Deep Space Background with Dynamic Stars */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a1b2e] via-[#0f1020] to-black" />
        
        {stars.map((star, i) => (
          <div 
            key={i}
            className="star animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}

        {/* Shooting Stars (Occasional) */}
        <div className="shooting-star" style={{ top: '20%', left: '10%', animationDelay: '5s' }} />
        <div className="shooting-star" style={{ top: '40%', left: '80%', animationDelay: '12s' }} />
        
        {/* Dynamic Ambient Glow based on selection */}
        <div 
          className="absolute inset-0 transition-colors duration-1000 ease-in-out opacity-30 blur-3xl mix-blend-screen"
          style={{ 
            background: selectedHex 
              ? `radial-gradient(circle at center, ${selectedHex}, transparent 60%)` 
              : 'radial-gradient(circle at center, #6366f1, transparent 60%)' 
          }}
        />
        
        <div className="relative z-10 w-full flex flex-col items-center py-10 flex-1 justify-center">
           {/* Nebula Gravity Field */}
           <div className="relative w-[500px] h-[500px] flex items-center justify-center orbit-container perspective-1000">
             
             {/* Core Nucleus - The Sun */}
             <div 
               className={`
                 relative w-28 h-28 rounded-full flex flex-col items-center justify-center 
                 backdrop-blur-md bg-white/5 border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)] z-40
                 transition-all duration-700 cursor-pointer
                 ${isHoveringCore ? 'scale-110 shadow-[0_0_80px_rgba(255,255,255,0.2)]' : 'scale-100'}
               `}
               onMouseEnter={() => setIsHoveringCore(true)}
               onMouseLeave={() => setIsHoveringCore(false)}
               onClick={() => setSelectedHex(null)}
             >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-50 pointer-events-none" />
                
                {selectedHex ? (
                  <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full mb-2 shadow-lg planet-glow" style={{ backgroundColor: selectedHex }} />
                    <span className="text-white font-mono text-xs opacity-90 tracking-wider">{rgbToHex(selectedHex)}</span>
                    <span className="text-[9px] text-white/50 uppercase tracking-[0.2em] mt-1">RESET GRAVITY</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center animate-pulse">
                    <Palette className="w-10 h-10 text-white/90 mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    <span className="text-[10px] text-white/70 font-mono tracking-[0.4em]">CORE</span>
                  </div>
                )}
             </div>

             {/* Orbital Tracks - Visual guides */}
             <div className="absolute w-[200px] h-[200px] orbit-ring-track opacity-30 pointer-events-none" />
             <div className="absolute w-[320px] h-[320px] orbit-ring-track opacity-20 pointer-events-none" />
             <div className="absolute w-[440px] h-[440px] orbit-ring-track opacity-10 pointer-events-none" />

             {/* Inner Orbit Ring (Clockwise) - Fast, Small Planets */}
             <div 
               className="orbit-ring absolute w-[200px] h-[200px] rounded-full pointer-events-none"
               style={{ animation: 'orbit-cw 30s linear infinite' }}
             >
               {orbit1.map((color, idx) => {
                 const total = orbit1.length;
                 const angle = (idx / total) * 2 * Math.PI; // Radians for JS Math
                 // Calculate absolute position on the circle edge
                 // Center is at 100, 100 (radius 100)
                 const radius = 100;
                 const left = radius + Math.cos(angle) * radius;
                 const top = radius + Math.sin(angle) * radius;
                 
                 return (
                   <button
                     key={`o1-${idx}`}
                     onClick={(e) => { e.stopPropagation(); setSelectedHex(color); }}
                     className="absolute w-6 h-6 rounded-full pointer-events-auto transition-all duration-500 hover:scale-[2.5] hover:z-50 cursor-pointer group/planet"
                     style={{
                       backgroundColor: color,
                       left: `${left}px`,
                       top: `${top}px`,
                       transform: 'translate(-50%, -50%)', // Center anchor
                       background: `radial-gradient(circle at 30% 30%, ${color}, #000)`,
                       boxShadow: `0 0 10px ${color}60, inset 2px 2px 5px rgba(255,255,255,0.4)`,
                       animation: `float-planet ${3 + (idx % 3)}s ease-in-out infinite alternate`
                     }}
                   >
                      <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover/planet:opacity-100 transition-opacity duration-300 blur-[1px]" />
                   </button>
                 );
               })}
             </div>

             {/* Orbit 2 (Mid) - Medium Planets */}
             <div 
               className="orbit-ring absolute w-[320px] h-[320px] rounded-full pointer-events-none"
               style={{ animation: 'orbit-ccw 50s linear infinite' }}
             >
               {orbit2.map((color, idx) => {
                 const total = orbit2.length;
                 const angle = (idx / total) * 2 * Math.PI;
                 const radius = 160;
                 const left = radius + Math.cos(angle) * radius;
                 const top = radius + Math.sin(angle) * radius;
                 
                 return (
                   <button
                     key={`o2-${idx}`}
                     onClick={(e) => { e.stopPropagation(); setSelectedHex(color); }}
                     className="absolute w-8 h-8 rounded-full pointer-events-auto transition-all duration-500 hover:scale-[2] hover:z-50 cursor-pointer group/planet"
                     style={{
                       backgroundColor: color,
                       left: `${left}px`,
                       top: `${top}px`,
                       transform: 'translate(-50%, -50%)',
                       background: `radial-gradient(circle at 30% 30%, ${color}, #000)`,
                       boxShadow: `0 0 12px ${color}60, inset 2px 2px 6px rgba(255,255,255,0.4)`,
                       animation: `float-planet ${4 + (idx % 3)}s ease-in-out infinite alternate-reverse`
                     }}
                   >
                      <div className="absolute -inset-1 rounded-full border border-white/5 opacity-0 group-hover/planet:opacity-100 transition-opacity duration-300" />
                   </button>
                 );
               })}
             </div>

             {/* Orbit 3 (Outer) - Slow, Large Gas Giants */}
             <div 
               className="orbit-ring absolute w-[440px] h-[440px] rounded-full pointer-events-none"
               style={{ animation: 'orbit-cw 80s linear infinite' }}
             >
               {orbit3.map((color, idx) => {
                 const total = orbit3.length;
                 const angle = (idx / total) * 2 * Math.PI;
                 const radius = 220;
                 const left = radius + Math.cos(angle) * radius;
                 const top = radius + Math.sin(angle) * radius;
                 
                 return (
                   <button
                     key={`o3-${idx}`}
                     onClick={(e) => { e.stopPropagation(); setSelectedHex(color); }}
                     className="absolute w-10 h-10 rounded-full pointer-events-auto transition-all duration-500 hover:scale-[1.8] hover:z-50 cursor-pointer group/planet"
                     style={{
                       backgroundColor: color,
                       left: `${left}px`,
                       top: `${top}px`,
                       transform: 'translate(-50%, -50%)',
                       background: `radial-gradient(circle at 30% 30%, ${color}, #000)`,
                       boxShadow: `0 0 15px ${color}60, inset 3px 3px 8px rgba(255,255,255,0.4)`,
                       animation: `float-planet ${6 + (idx % 4)}s ease-in-out infinite alternate`
                     }}
                   >
                     <div className="absolute -inset-2 rounded-full border border-white/10 opacity-0 group-hover/planet:opacity-100 transition-opacity duration-500 scale-110" />
                   </button>
                 );
               })}
             </div>

          </div>
          
          <div className="mt-12 flex flex-col items-center">
            <p className="text-white/40 text-[10px] tracking-[0.3em] font-light uppercase animate-pulse">
              Navigating Memory Sector
            </p>
            <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent mt-4" />
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {selectedHex && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
            Memories matching <span className="inline-block w-3 h-3 rounded-full ml-1 align-middle border border-gray-200" style={{backgroundColor: selectedHex}}></span>
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredEntries.map(entry => (
              <div 
                key={entry.id}
                onClick={() => onEntryClick(entry.id)}
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all"
              >
                <LazyImage 
                  src={entry.photo} 
                  alt="" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <span className="text-white text-xs font-medium truncate">{entry.caption}</span>
                  <span className="text-white/70 text-[10px]">{new Date(entry.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
             {filteredEntries.length === 0 && (
              <div className="col-span-full py-12 text-center">
                 <div className="w-16 h-16 rounded-full bg-gray-50 mx-auto mb-3 flex items-center justify-center">
                    <Search className="w-6 h-6 text-gray-300" />
                 </div>
                <p className="text-gray-500 font-medium">No matches found yet</p>
                <p className="text-xs text-gray-400 mt-1">Try uploading more colorful photos!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}