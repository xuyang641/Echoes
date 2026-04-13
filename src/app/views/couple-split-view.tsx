import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { DiaryEntry } from '../components/diary-entry-form';
import { Heart, MapPin, Calendar, MessageCircle, HeartHandshake } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { MOODS } from '../utils/mood-constants';
import { LazyImage } from '../components/ui/lazy-image';

export function CoupleSplitView() {
  const { user } = useAuth();
  const { groups } = useGroup();
  const { t } = useTranslation();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // Filter groups that are likely couple groups (e.g., 2 members)
  // But allow user to pick any group just in case
  const availableGroups = groups;

  const activeGroup = groups.find(g => g.id === selectedGroupId);

  const processedEntries = useMemo(() => {
    if (!activeGroup) return [];

    // Sort entries by date desc
    const sorted = [...activeGroup.entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Group by Date
    const grouped: { date: string; entries: DiaryEntry[] }[] = [];
    
    sorted.forEach(entry => {
      const dateKey = format(parseISO(entry.date), 'yyyy-MM-dd');
      const lastGroup = grouped[grouped.length - 1];
      
      if (lastGroup && lastGroup.date === dateKey) {
        lastGroup.entries.push(entry);
      } else {
        grouped.push({ date: dateKey, entries: [entry] });
      }
    });

    return grouped;
  }, [activeGroup]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto min-h-[80vh] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header & Selection */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-pink-100 text-pink-600 rounded-full mb-2">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('couple.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('couple.subtitle')}
        </p>

        {/* Group Selector */}
        <div className="flex justify-center mt-4">
            {availableGroups.length === 0 ? (
                <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                    {t('couple.noGroup')}
                </div>
            ) : (
                <div className="flex gap-2 overflow-x-auto p-1 max-w-full justify-center">
                    {availableGroups.map(group => (
                        <button
                            key={group.id}
                            onClick={() => setSelectedGroupId(group.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                selectedGroupId === group.id
                                    ? 'bg-pink-500 text-white shadow-md transform scale-105'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-white/50" />
                            {group.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Split View Content */}
      {!selectedGroupId ? (
        <div className="text-center py-20 bg-white/50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('couple.selectGroup')}</p>
        </div>
      ) : (
        <div className="relative">
          {/* Central Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-200 via-purple-200 to-transparent -translate-x-1/2 hidden md:block" />

          <div className="space-y-12">
            {processedEntries.map((dayGroup) => (
              <div key={dayGroup.date} className="relative">
                {/* Date Header */}
                <div className="flex justify-center mb-8 sticky top-20 z-10">
                  <span className="bg-white/90 dark:bg-gray-800/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold text-gray-500 shadow-sm border border-gray-100 dark:border-gray-700">
                    {format(parseISO(dayGroup.date), 'MMMM do, yyyy')}
                  </span>
                </div>

                <div className="space-y-8">
                  {dayGroup.entries.map((entry) => {
                    const isMe = entry.userId === user.id;
                    
                    return (
                      <div 
                        key={entry.id} 
                        className={`flex flex-col md:flex-row items-center gap-4 md:gap-8 ${
                          isMe ? 'md:flex-row' : 'md:flex-row-reverse'
                        }`}
                      >
                        {/* My Content (Left Side for Me, Right Side for Them) */}
                        <div className={`flex-1 w-full max-w-sm ${isMe ? 'md:text-right' : 'md:text-left'}`}>
                           <div className={`relative group bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-transform hover:scale-[1.02] ${
                               isMe ? 'md:ml-auto' : 'md:mr-auto'
                           }`}>
                                {/* Photo */}
                                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-gray-100 relative">
                                    <LazyImage 
                                        src={entry.photo} 
                                        alt={entry.caption} 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/30 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full">
                                        {format(parseISO(entry.date), 'HH:mm')}
                                    </div>
                                </div>

                                {/* Caption & Details */}
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium line-clamp-3">
                                        {entry.caption}
                                    </p>
                                    
                                    <div className={`flex items-center gap-2 text-xs text-gray-400 ${
                                        isMe ? 'md:justify-end' : 'md:justify-start'
                                    }`}>
                                        {entry.location && (
                                            <span className="flex items-center gap-0.5">
                                                <MapPin className="w-3 h-3" />
                                                {entry.location.name || 'Unknown'}
                                            </span>
                                        )}
                                        <span className={`px-1.5 py-0.5 rounded-md ${
                                            isMe ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                                        }`}>
                                            {t(`moods.${entry.mood.toLowerCase()}`, entry.mood)}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Avatar Bubble */}
                                <div className={`absolute -top-3 ${isMe ? '-right-3' : '-left-3'} w-8 h-8 rounded-full border-2 border-white shadow-md overflow-hidden bg-gray-200 z-10`}>
                                     {entry.userAvatar ? (
                                         <LazyImage src={entry.userAvatar} alt="avatar" className="w-full h-full object-cover" />
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-bold">
                                             {entry.userName?.[0] || '?'}
                                         </div>
                                     )}
                                </div>
                           </div>
                        </div>

                        {/* Center Dot (Desktop only) */}
                        <div className="hidden md:flex flex-col items-center justify-center w-8 shrink-0 relative">
                            <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${
                                isMe ? 'bg-blue-400' : 'bg-pink-400'
                            }`} />
                        </div>

                        {/* Empty Space for the other side */}
                        <div className="flex-1 w-full hidden md:block" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {processedEntries.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p>{t('couple.noMemories')}</p>
                    <p className="text-sm mt-2">{t('couple.startSharing')}</p>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}