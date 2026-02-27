import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DiaryEntry } from './diary-entry-form';
import L from 'leaflet';
import 'leaflet.heat'; // Import heatmap plugin
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Filter, User, Play, Pause, Flame, Heart, MessageCircle, Send } from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { GroupManager } from './group-manager';
import { useTranslation } from 'react-i18next';
import { MOODS } from '../utils/mood-constants';
import { LazyImage } from './ui/lazy-image';
import { wgs84ToGcj02 } from '../utils/coord-transform';
import { motion } from 'framer-motion';

// Fix for default Leaflet icon not finding images
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- Components for Heatmap and Route ---

// Heatmap Layer Component
function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // @ts-ignore - leaflet.heat adds 'heatLayer' to L
    if (!L.heatLayer) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    if (points.length > 0) {
      // @ts-ignore
      heatLayerRef.current = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        gradient: {
            0.4: 'blue',
            0.6: 'cyan',
            0.7: 'lime',
            0.8: 'yellow',
            1.0: 'red'
        }
      }).addTo(map);
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points]);

  return null;
}

// Route Playback Component
function RoutePlayback({ entries, isPlaying, onStop }: { entries: DiaryEntry[], isPlaying: boolean, onStop: () => void }) {
    const { t } = useTranslation();
    const map = useMap();
    const [currentIndex, setCurrentIndex] = useState(0);
    const markerRef = useRef<L.Marker | null>(null);
    const animationRef = useRef<number | null>(null);

    // Sort entries by date
    const sortedEntries = useMemo(() => {
        return [...entries]
            .filter(e => e.location)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [entries]);

    const pathPositions = useMemo(() => 
        sortedEntries.map(e => {
            const [lat, lng] = wgs84ToGcj02(e.location!.lat, e.location!.lng);
            return [lat, lng] as [number, number];
        }), 
    [sortedEntries]);

    useEffect(() => {
        if (!isPlaying) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        if (sortedEntries.length < 2) {
            onStop();
            return;
        }

        // Start animation
        let startTimestamp: number | null = null;
        const durationPerSegment = 1000; // ms per segment

        const animate = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = timestamp - startTimestamp;
            
            // Calculate total progress
            const totalSegments = sortedEntries.length - 1;
            const totalDuration = totalSegments * durationPerSegment;
            
            if (progress >= totalDuration) {
                setCurrentIndex(sortedEntries.length - 1);
                onStop();
                return;
            }

            const currentSegmentIndex = Math.floor(progress / durationPerSegment);
            const segmentProgress = (progress % durationPerSegment) / durationPerSegment;
            
            setCurrentIndex(currentSegmentIndex);

            const start = pathPositions[currentSegmentIndex];
            const end = pathPositions[currentSegmentIndex + 1];

            if (start && end) {
                const lat = start[0] + (end[0] - start[0]) * segmentProgress;
                const lng = start[1] + (end[1] - start[1]) * segmentProgress;
                
                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                    map.panTo([lat, lng]);
                }
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying, sortedEntries, pathPositions, map, onStop]);

    if (!isPlaying) return null;

    return (
        <>
            <Polyline positions={pathPositions} color="#3b82f6" weight={4} opacity={0.6} dashArray="10, 10" />
            <Marker 
                ref={markerRef}
                position={pathPositions[0]} 
                icon={L.divIcon({
                    className: 'playback-marker',
                    html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`,
                    iconSize: [16, 16]
                })}
                zIndexOffset={1000}
            />
            {/* Info Overlay */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 dark:bg-gray-800/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center">
                <span className="text-xs text-gray-500 font-medium">{t('map.traveling')}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {sortedEntries[currentIndex] ? format(new Date(sortedEntries[currentIndex].date), 'yyyy-MM-dd HH:mm') : ''}
                </span>
            </div>
        </>
    );
}


// Custom Icons for different users
const createCustomIcon = (color: string, avatar?: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      ">
        ${avatar ? `<img src="${avatar}" style="width: 100%; height: 100%; object-fit: cover;" />` : ''}
      </div>
      <div style="
        width: 0; 
        height: 0; 
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid ${color};
        margin: -2px auto 0;
      "></div>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
  });
};

// Viewport Manager Component to handle visible markers
function MapViewportManager({ entries, onBoundsChange }: { entries: DiaryEntry[], onBoundsChange: (visible: DiaryEntry[]) => void }) {
  const map = useMap();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateVisibleEntries = useCallback(() => {
    if (!map) return;
    const bounds = map.getBounds();
    const visible = entries.filter(entry => {
        if (!entry.location) return false;
        const [lat, lng] = wgs84ToGcj02(entry.location.lat, entry.location.lng);
        return bounds.contains([lat, lng]);
    });
    onBoundsChange(visible);
  }, [map, entries, onBoundsChange]);

  useMapEvents({
    moveend: () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(updateVisibleEntries, 300); // Debounce
    },
    zoomend: () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(updateVisibleEntries, 300);
    }
  });

  // Initial update
  useEffect(() => {
    updateVisibleEntries();
  }, [entries]); // Update when entries change (e.g. filter)

  return null;
}

interface MapViewProps {
  entries: DiaryEntry[];
  onUpdateEntry?: (entry: DiaryEntry, targetGroups: string[]) => void;
}

function MapEntryPopup({ entry, onUpdateEntry }: { entry: DiaryEntry, onUpdateEntry?: (entry: DiaryEntry, targetGroups: string[]) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const isLiked = entry.likes?.includes(user?.id || '');

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !onUpdateEntry) return;

    const currentLikes = entry.likes || [];
    const newLikes = isLiked 
      ? currentLikes.filter(id => id !== user.id)
      : [...currentLikes, user.id];

    const updatedEntry = { ...entry, likes: newLikes };
    onUpdateEntry(updatedEntry, entry.groupIds || ['private']);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !commentText.trim() || !onUpdateEntry) return;

    const newComment = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      userAvatar: user.user_metadata?.avatar_url,
      text: commentText.trim(),
      date: new Date().toISOString()
    };

    const updatedEntry = { 
      ...entry, 
      comments: [...(entry.comments || []), newComment] 
    };
    
    onUpdateEntry(updatedEntry, entry.groupIds || ['private']);
    setCommentText('');
  };

  return (
    <div className="w-64">
      {/* User Header */}
      {entry.userName && (
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
          {entry.userAvatar ? (
            <div className="w-6 h-6 rounded-full overflow-hidden">
                <LazyImage src={entry.userAvatar} alt={entry.userName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-3 h-3 text-gray-400" />
            </div>
          )}
          <span className="text-xs font-bold text-gray-700">{entry.userName}</span>
        </div>
      )}
      
      {/* Photo & Caption (Click to edit) */}
      <div className="cursor-pointer group" onClick={() => navigate(`/edit/${entry.id}`)}>
        <div className="w-full h-32 mb-2 rounded-lg overflow-hidden relative">
            <LazyImage 
            src={entry.photo} 
            alt={entry.caption} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
        <p className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">{entry.caption}</p>
      </div>

      {/* Tags & Meta */}
      <div className="flex flex-wrap gap-1 mb-2">
        {entry.tags?.slice(0, 3).map(tag => (
        <span key={tag} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]">
            #{tag}
        </span>
        ))}
      </div>
      
      {/* Social Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
        <div className="flex items-center gap-3">
            <button 
                onClick={handleLike}
                className={`flex items-center gap-1 text-xs transition-colors ${isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'}`}
            >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{entry.likes?.length || 0}</span>
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
                className={`flex items-center gap-1 text-xs transition-colors ${showComments ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
            >
                <MessageCircle className="w-4 h-4" />
                <span>{entry.comments?.length || 0}</span>
            </button>
        </div>
        <span className="text-[10px] text-gray-400">{format(new Date(entry.date), 'MM/dd')}</span>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-100 animate-in slide-in-from-top-2">
            <div className="max-h-32 overflow-y-auto space-y-2 mb-2 pr-1 custom-scrollbar">
                {entry.comments?.length ? (
                    entry.comments.map(comment => (
                        <div key={comment.id} className="flex gap-2 items-start text-xs">
                            <div className="w-5 h-5 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden mt-0.5">
                                {comment.userAvatar ? (
                                    <img src={comment.userAvatar} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-3 h-3 text-gray-400 m-1" />
                                )}
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-lg p-2">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <span className="font-bold text-gray-700">{comment.userName}</span>
                                    <span className="text-[9px] text-gray-400">{format(new Date(comment.date), 'MM/dd HH:mm')}</span>
                                </div>
                                <p className="text-gray-600 break-words">{comment.text}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-gray-400 text-center py-2">暂无评论</p>
                )}
            </div>
            
            {/* Add Comment Input */}
            <form onSubmit={handleComment} className="flex gap-2">
                <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="写下评论..."
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                    onClick={(e) => e.stopPropagation()}
                />
                <button 
                    type="submit"
                    disabled={!commentText.trim()}
                    className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Send className="w-3 h-3" />
                </button>
            </form>
        </div>
      )}
    </div>
  );
}

interface MapControlsContentProps {
  t: any;
  dateFilter: 'all' | 'today' | 'range';
  setDateFilter: (val: 'all' | 'today' | 'range') => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  selectedMood: string;
  setSelectedMood: (val: string) => void;
  tagInput: string;
  setTagInput: (val: string) => void;
  selectedTag: string;
  setSelectedTag: (val: string) => void;
  isTagDropdownOpen: boolean;
  setIsTagDropdownOpen: (val: boolean) => void;
  allTags: string[];
  filteredEntriesCount: number;
  showHeatmap: boolean;
  setShowHeatmap: (val: boolean) => void;
  isPlayingRoute: boolean;
  setIsPlayingRoute: (val: boolean) => void;
  canPlayRoute: boolean;
}

function MapControlsContent({
  t,
  dateFilter, setDateFilter,
  startDate, setStartDate,
  endDate, setEndDate,
  selectedMood, setSelectedMood,
  tagInput, setTagInput,
  selectedTag, setSelectedTag,
  isTagDropdownOpen, setIsTagDropdownOpen,
  allTags,
  filteredEntriesCount,
  showHeatmap, setShowHeatmap,
  isPlayingRoute, setIsPlayingRoute,
  canPlayRoute
}: MapControlsContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <GroupManager />
      
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Filter className="w-4 h-4 text-blue-500" />
        {t('filters.title')}
      </h3>
      
      {/* Date Filter */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 font-medium">{t('filters.dateRange')}</label>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-2 text-xs rounded-lg transition-all text-left ${
              dateFilter === 'all' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
            }`}
          >
            {t('filters.allTime')}
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-2 text-xs rounded-lg transition-all text-left ${
              dateFilter === 'today' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
            }`}
          >
            {t('filters.today')}
          </button>
          <button
            onClick={() => setDateFilter('range')}
            className={`px-3 py-2 text-xs rounded-lg transition-all text-left ${
              dateFilter === 'range' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
            }`}
          >
            {t('filters.custom')}
          </button>
        </div>

        {dateFilter === 'range' && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-8">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-8">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mood Filter */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 font-medium">{t('filters.mood')}</label>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
                onClick={() => setSelectedMood('All')}
                className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                    selectedMood === 'All'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
                {t('timeline.all')}
            </button>
            {MOODS.map(mood => (
                <button
                    key={mood.name}
                    onClick={() => setSelectedMood(mood.name)}
                    className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                        selectedMood === mood.name
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                    <mood.icon className="w-4 h-4" />
                    <span>{t(`moods.${mood.name.toLowerCase()}`, mood.name)}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Tag Filter */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 font-medium">{t('filters.tag')}</label>
        <div className="relative">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setSelectedTag(e.target.value);
              setIsTagDropdownOpen(true);
            }}
            onFocus={() => setIsTagDropdownOpen(true)}
            onBlur={() => setTimeout(() => setIsTagDropdownOpen(false), 200)}
            placeholder={t('filters.searchTags')}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
          {selectedTag && (
            <button 
              onClick={() => { setSelectedTag(''); setTagInput(''); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
          {isTagDropdownOpen && allTags.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
              {allTags.filter(tag => tag.toLowerCase().includes(tagInput.toLowerCase())).map(tag => (
                <div
                  key={tag}
                  className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => { setSelectedTag(tag); setTagInput(tag); setIsTagDropdownOpen(false); }}
                >
                  #{tag}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-center text-gray-500 dark:text-gray-400">
        {t('filters.found', { count: filteredEntriesCount })}
      </div>

      {/* New Map Features Control */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
        <h4 className="text-xs font-medium text-gray-500">{t('map.features')}</h4>
        <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                showHeatmap 
                ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
        >
            <Flame className={`w-4 h-4 ${showHeatmap ? 'fill-orange-500' : ''}`} />
            {showHeatmap ? t('map.hideHeatmap') : t('map.showHeatmap')}
        </button>
        <button
            onClick={() => setIsPlayingRoute(!isPlayingRoute)}
            disabled={!canPlayRoute}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isPlayingRoute 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
            } ${!canPlayRoute ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {isPlayingRoute ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isPlayingRoute ? t('map.stopPlayback') : t('map.playRoute')}
        </button>
      </div>
    </div>
  );
}

export function MapView({ entries, onUpdateEntry }: MapViewProps) {
  const { t } = useTranslation();
  const { currentGroupId, getGroupEntries } = useGroup();
  const [selectedMood, setSelectedMood] = useState('All');
  const [selectedTag, setSelectedTag] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'range'>('all');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // New Features State
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isPlayingRoute, setIsPlayingRoute] = useState(false);
  
  // Mobile UI State
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  // Visible entries in viewport
  const [visibleMarkers, setVisibleMarkers] = useState<DiaryEntry[]>([]);

  // Combine entries based on group selection
  const allEntries = useMemo(() => {
    // 1. If viewing a specific group, ONLY show that group's entries
    if (currentGroupId) {
      return getGroupEntries(currentGroupId);
    }
    
    // 2. If viewing "Private Space" (currentGroupId === null)
    // Show only personal entries (those WITHOUT a group_id or explicitly private)
    return entries;
  }, [entries, currentGroupId, getGroupEntries]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allEntries.forEach(entry => {
      entry.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [allEntries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      if (!entry.location) return false;
      
      const matchesMood = selectedMood === 'All' || entry.mood === selectedMood;
      
      const matchesTag = selectedTag === '' || (entry.tags && entry.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase()));
      
      // Date Filtering
      let matchesDate = true;
      const entryDate = new Date(entry.date);
      
      if (dateFilter === 'today') {
        matchesDate = isSameDay(entryDate, new Date());
      } else if (dateFilter === 'range') {
        matchesDate = isWithinInterval(entryDate, {
          start: startOfDay(new Date(startDate)),
          end: endOfDay(new Date(endDate))
        });
      }

      return matchesMood && matchesTag && matchesDate;
    });
  }, [allEntries, selectedMood, selectedTag, dateFilter, startDate, endDate]);

  // Default center
  const defaultCenter: [number, number] = filteredEntries.length > 0
    ? (() => {
        const gcj = wgs84ToGcj02(filteredEntries[0].location!.lat, filteredEntries[0].location!.lng);
        return [gcj[0], gcj[1]];
      })()
    : [20, 0];

  const controlsProps = {
    t,
    dateFilter, setDateFilter,
    startDate, setStartDate,
    endDate, setEndDate,
    selectedMood, setSelectedMood,
    tagInput, setTagInput,
    selectedTag, setSelectedTag,
    isTagDropdownOpen, setIsTagDropdownOpen,
    allTags,
    filteredEntriesCount: filteredEntries.length,
    showHeatmap, setShowHeatmap,
    isPlayingRoute, setIsPlayingRoute,
    canPlayRoute: filteredEntries.length >= 2
  };

  return (
    <div className="relative h-[calc(100vh-140px)] md:h-[calc(100vh-140px)] lg:grid lg:grid-cols-4 lg:gap-6 overflow-hidden">
      
      {/* Sidebar Controls - Desktop Only */}
      <div className="hidden lg:block lg:col-span-1 lg:h-full lg:overflow-y-auto lg:pr-2 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <MapControlsContent {...controlsProps} />
      </div>

      {/* Map Area - Mobile: Full Screen Absolute; Desktop: Col-span-3 */}
      <div className="absolute inset-0 lg:static lg:col-span-3 lg:h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 z-0">
        <MapContainer 
          key={`${defaultCenter[0]}-${defaultCenter[1]}`} 
          center={defaultCenter} 
          zoom={filteredEntries.length > 0 ? 5 : 4} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='Map data &copy; <a href="https://www.amap.com/">Gaode</a> contributors'
            url="https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
          />
          
          {/* Heatmap Layer */}
          {showHeatmap && (
              <HeatmapLayer 
                  points={filteredEntries
                      .filter(e => e.location)
                      .map(e => {
                          const [lat, lng] = wgs84ToGcj02(e.location!.lat, e.location!.lng);
                          return [lat, lng, 1];
                      })} 
              />
          )}

          {/* Viewport Manager */}
          {!showHeatmap && !isPlayingRoute && (
            <MapViewportManager 
                entries={filteredEntries} 
                onBoundsChange={setVisibleMarkers} 
            />
          )}

          {/* Route Playback */}
          <RoutePlayback 
              entries={filteredEntries} 
              isPlaying={isPlayingRoute} 
              onStop={() => setIsPlayingRoute(false)} 
          />

          {/* Normal Markers - Render ONLY visible ones */}
          {!showHeatmap && !isPlayingRoute && visibleMarkers.map(entry => {
            let markerColor = '#3b82f6'; // blue-500
            if (entry.userId === 'user-2') markerColor = '#ec4899'; // pink-500
            if (entry.userId === 'user-3') markerColor = '#f97316'; // orange-500
            if (entry.userId === 'user-4') markerColor = '#10b981'; // green-500

            const [gcjLat, gcjLng] = wgs84ToGcj02(entry.location!.lat, entry.location!.lng);

            return (
              <Marker 
                key={entry.id} 
                position={[gcjLat, gcjLng]}
                icon={createCustomIcon(markerColor, entry.userAvatar)}
              >
                <Popup>
                  <MapEntryPopup entry={entry} onUpdateEntry={onUpdateEntry} />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Mobile Bottom Sheet Controls */}
      <motion.div
        className="lg:hidden absolute bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-gray-800 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] flex flex-col h-[85%]"
        initial="collapsed"
        animate={isSheetExpanded ? "expanded" : "collapsed"}
        variants={{
            collapsed: { y: "calc(100% - 70px)" }, // Show 70px header
            expanded: { y: 0 }
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={(_, { offset, velocity }) => {
            if (offset.y > 100 || velocity.y > 500) {
                setIsSheetExpanded(false);
            } else if (offset.y < -100 || velocity.y < -500) {
                setIsSheetExpanded(true);
            }
        }}
      >
        {/* Drag Handle / Header */}
        <div 
            className="h-[70px] shrink-0 flex flex-col items-center justify-center border-b border-gray-100 dark:border-gray-700 relative cursor-grab active:cursor-grabbing bg-white dark:bg-gray-800 rounded-t-3xl"
            onClick={() => setIsSheetExpanded(!isSheetExpanded)}
        >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mb-3" />
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white">
                <Filter className="w-4 h-4 text-blue-500" />
                <span>{t('filters.title')} & 地图设置</span>
            </div>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 bg-gray-50/50 dark:bg-gray-900/50">
            <MapControlsContent {...controlsProps} />
        </div>
      </motion.div>
    </div>
  );
}