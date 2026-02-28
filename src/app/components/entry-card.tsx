import { format } from 'date-fns';
import { Smile, Frown, Heart, Zap, Coffee, Sparkles, CloudRain, Sun, Trash2, Edit2, Share2, Heart as HeartIcon, CloudOff } from 'lucide-react';
import type { DiaryEntry } from './diary-entry-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LazyImage } from './ui/lazy-image';
import { ShareModal } from './share-modal';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

interface EntryCardProps {
  entry: DiaryEntry;
  onDelete: (id: string) => void;
  onImageClick?: (url: string) => void;
  onLike?: (id: string) => void;
  isPendingSync?: boolean;
}

const moodIcons: Record<string, any> = {
  Happy: Smile,
  Sad: Frown,
  Grateful: Heart,
  Excited: Zap,
  Calm: Coffee,
  Inspired: Sparkles,
  Stressed: CloudRain,
  Energetic: Sun,
};

const moodColors: Record<string, string> = {
  Happy: 'bg-yellow-100 text-yellow-700',
  Sad: 'bg-blue-100 text-blue-700',
  Grateful: 'bg-pink-100 text-pink-700',
  Excited: 'bg-purple-100 text-purple-700',
  Calm: 'bg-green-100 text-green-700',
  Inspired: 'bg-indigo-100 text-indigo-700',
  Stressed: 'bg-gray-100 text-gray-700',
  Energetic: 'bg-orange-100 text-orange-700',
};

export function EntryCard({ entry, onDelete, onImageClick, onLike, isPendingSync = false }: EntryCardProps) {
  const MoodIcon = moodIcons[entry.mood] || Smile;
  const date = new Date(entry.date);
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(entry.id);
  };

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 ease-out border border-gray-100 dark:border-gray-700 ${isPendingSync ? 'opacity-90' : ''}`}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 cursor-zoom-in" onClick={() => onImageClick?.(entry.photo)}>
        {isPendingSync && (
          <div className="absolute top-3 left-3 z-20 bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm">
            <CloudOff className="w-4 h-4" />
          </div>
        )}
        <LazyImage 
          src={entry.photo} 
          alt={entry.caption}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Like Button (Micro-interaction) */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.8 }}
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          className={`absolute bottom-3 right-3 p-2 rounded-full backdrop-blur-md shadow-lg transition-colors z-10 ${
            isLiked 
              ? 'bg-pink-500 text-white' 
              : 'bg-white/30 text-white hover:bg-white/50'
          }`}
        >
          <HeartIcon className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        </motion.button>

        {/* Action buttons - appear on hover */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowShare(true);
            }}
            className="bg-white/90 dark:bg-gray-800/90 hover:bg-purple-500 hover:text-white text-gray-700 dark:text-gray-300 rounded-full p-2 shadow-lg transition-colors"
            aria-label="Share entry"
          >
            <Share2 className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/edit/${entry.id}`);
            }}
            className="bg-white/90 dark:bg-gray-800/90 hover:bg-blue-500 hover:text-white text-gray-700 dark:text-gray-300 rounded-full p-2 shadow-lg transition-colors"
            aria-label="Edit entry"
          >
            <Edit2 className="w-4 h-4" />
          </motion.button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/90 dark:bg-gray-800/90 hover:bg-red-500 hover:text-white text-gray-700 dark:text-gray-300 rounded-full p-2 shadow-lg transition-colors"
                aria-label="Delete entry"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900 dark:text-white">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                  This action cannot be undone. This will permanently delete this memory from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 border-none active:scale-95 transition-transform">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(entry.id)} className="bg-red-600 hover:bg-red-700 active:scale-95 transition-transform">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Date and Mood */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {format(date, 'h:mm a')}
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${moodColors[entry.mood]}`}>
            <MoodIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{entry.mood}</span>
          </div>
        </div>

        {/* Caption */}
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-serif tracking-wide line-clamp-3" style={{ fontFamily: '"Noto Serif", "Noto Serif SC", serif' }}>
          {entry.caption}
        </p>

        {/* Tags */}
        {((entry.tags && entry.tags.length > 0) || (entry.aiTags && entry.aiTags.length > 0)) && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {entry.tags?.map(tag => (
              <span 
                key={tag} 
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                style={entry.palette ? { 
                  backgroundColor: `${entry.palette.dominant}20`, 
                  color: entry.palette.darkVibrant || entry.palette.dominant 
                } : undefined}
              >
                #{tag}
              </span>
            ))}
            {entry.aiTags?.map(tag => (
              <span 
                key={`ai-${tag}`} 
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
                style={entry.palette ? { 
                  backgroundColor: `${entry.palette.vibrant}20`, 
                  color: entry.palette.darkVibrant || entry.palette.vibrant 
                } : undefined}
              >
                <Sparkles className="w-2 h-2 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
    
    {showShare && (
      <ShareModal 
        entry={entry} 
        onClose={() => setShowShare(false)} 
      />
    )}
    </>
  );
}