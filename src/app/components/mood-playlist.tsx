import { useState, useEffect } from 'react';
import { Music, Play, ExternalLink, Loader2, RefreshCw, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { aiService } from '../utils/ai-service';
import { motion, AnimatePresence } from 'framer-motion';

interface MoodPlaylistProps {
  mood: string;
  caption: string;
  tags?: string[];
}

interface SongRecommendation {
  title: string;
  artist: string;
  reason: string;
  coverUrl?: string; // Placeholder for now
  searchUrl: string;
}

export function MoodPlaylist({ mood, caption, tags }: MoodPlaylistProps) {
  const { t } = useTranslation();
  const [song, setSong] = useState<SongRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generatePlaylist = async () => {
    setLoading(true);
    try {
      // Prompt for Qwen to recommend a song
      const prompt = `
        Based on this diary entry, recommend ONE song that perfectly matches the mood.
        
        [Diary Info]
        Mood: ${mood}
        Content: "${caption}"
        Tags: ${tags?.join(', ')}

        Return a JSON object with these fields:
        {
          "title": "Song Title",
          "artist": "Artist Name",
          "reason": "A short, poetic sentence explaining why this song fits (in the language of the diary)."
        }
        Only return the JSON. No markdown.
      `;

      const response = await aiService.generateResponse(prompt, [], mood);
      
      // Parse JSON (handle potential markdown blocks)
      let jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(jsonStr);

      setSong({
        title: result.title,
        artist: result.artist,
        reason: result.reason,
        searchUrl: `https://open.spotify.com/search/${encodeURIComponent(result.title + ' ' + result.artist)}`
      });
      setHasGenerated(true);
    } catch (error) {
      console.error('Failed to generate playlist:', error);
      // Fallback
      setSong({
        title: "Weightless",
        artist: "Marconi Union",
        reason: "Sometimes silence is the best music.",
        searchUrl: "https://open.spotify.com/search/Weightless%20Marconi%20Union"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
      {!hasGenerated ? (
        <button
          onClick={generatePlaylist}
          disabled={loading}
          className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors w-full"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Music className="w-3 h-3" />}
          {loading ? t('ai.thinking', 'AI Listening...') : t('ai.playlist_generate', 'Generate Mood BGM')}
        </button>
      ) : (
        <AnimatePresence>
          {song && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 flex items-center gap-3 group relative overflow-hidden"
            >
              {/* Vinyl Animation */}
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0 shadow-sm animate-[spin_8s_linear_infinite]">
                 <div className="w-4 h-4 rounded-full bg-indigo-500/50" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {song.title}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">- {song.artist}</span>
                </div>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-300 italic truncate">
                  "{song.reason}"
                </p>
              </div>

              <a
                href={song.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white dark:bg-indigo-800 rounded-full shadow-sm hover:scale-110 transition-transform text-indigo-600 dark:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <Play className="w-3 h-3 fill-current" />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
