import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Camera, Dumbbell, Book, Star, X, Plus, Target } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { DiaryEntry } from '../components/diary-entry-form';
import { LazyImage } from '../components/ui/lazy-image';
import { format } from 'date-fns';
import { useBucketListStore } from '../store/bucket-list-store';
import { AddWishDialog } from '../components/add-wish-dialog';
import { Button } from '../components/ui/button';

interface MilestonesViewProps {
  entries: DiaryEntry[];
}

interface Milestone {
  id: string;
  titleKey: string;
  descKey: string;
  description?: string;
  icon: any;
  target: number;
  tags: string[]; // Entries with ANY of these tags count towards progress
  category: 'skill' | 'life' | 'health';
  color: string;
  state?: 'someday' | 'in_progress' | 'achieved';
  current?: number;
  progress?: number;
  completed?: boolean;
}

// Milestone Card Component
const MilestoneCard = ({ milestone, onClick, t }: { milestone: Milestone, onClick: () => void, t: any }) => (
  <div 
    onClick={onClick}
    className={`group relative bg-white dark:bg-gray-800 rounded-3xl p-6 border-2 transition-all duration-300 cursor-pointer ${
      milestone.completed 
        ? 'border-amber-400/50 shadow-lg shadow-amber-100 dark:shadow-none' 
        : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm'
    }`}
  >
    {milestone.completed && (
      <div className="absolute -top-3 -right-3 bg-amber-500 text-white p-2 rounded-full shadow-md animate-bounce">
        <Trophy className="w-5 h-5" />
      </div>
    )}

    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${milestone.completed ? 'bg-amber-100 text-amber-500 dark:bg-amber-900/30' : milestone.color}`}>
          <milestone.icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
            {milestone.id.startsWith('photo_') || milestone.id.startsWith('fitness_') || milestone.id.startsWith('reading_') 
              ? t(milestone.titleKey) 
              : milestone.titleKey}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              {milestone.category}
            </span>
            {milestone.state !== 'someday' && (
              <span className="text-xs text-gray-400">
                {t('milestones.target')}: {milestone.target}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        {milestone.state !== 'someday' ? (
          <>
            <span className={`text-2xl font-bold ${milestone.completed ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
              {milestone.current}
            </span>
            <span className="text-gray-400 text-sm"> / {milestone.target}</span>
          </>
        ) : (
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {milestone.current}
          </span>
        )}
      </div>
    </div>

    {milestone.state !== 'someday' && (
      <div className="mb-4">
        <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              milestone.completed ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${milestone.progress}%` }}
          />
        </div>
      </div>
    )}

    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
      {milestone.id.startsWith('photo_') || milestone.id.startsWith('fitness_') || milestone.id.startsWith('reading_')
        ? t(milestone.descKey)
        : (milestone.description || t('bucketList.customDesc', '自定义人生愿望清单'))}
    </p>

    {(!milestone.id.startsWith('photo_') && !milestone.id.startsWith('fitness_') && !milestone.id.startsWith('reading_')) && milestone.tags && milestone.tags.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mb-4">
        {milestone.tags.map((tag, idx) => (
          <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
            #{tag}
          </span>
        ))}
      </div>
    )}

    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        <span>{t('milestones.viewGallery', 'View Gallery')}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </div>
  </div>
);

export function MilestonesView({ entries }: MilestonesViewProps) {
  const { t } = useTranslation();
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isAddWishOpen, setIsAddWishOpen] = useState(false);
  
  const bucketList = useBucketListStore(state => state.bucketList);

  // Define System Milestones
  const systemMilestones: Milestone[] = [
    {
      id: 'photo_beginner',
      titleKey: 'milestones.photo.beginner',
      descKey: 'milestones.photo.beginnerDesc',
      icon: Camera,
      target: 5,
      tags: ['photography', 'photo', 'camera', 'shoot', 'snapshot', 'picture', 'image', 'moment', 'selfie', 'portrait', 'landscape',
        '摄影', '拍照', '照片', '相册', '镜头', '人像', '风景', '自拍', '相机', '拍摄', '写真', '摄影师',
        '写真', '撮影', 'カメラ', 'ポートレート', '風景', '自撮り',
        '사진', '촬영', '카메라', '포트레이트', '풍경', '셀카'],
      category: 'skill',
      color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
    },
    {
      id: 'photo_master',
      titleKey: 'milestones.photo.master',
      descKey: 'milestones.photo.masterDesc',
      icon: Star,
      target: 50,
      tags: ['photography', 'photo', 'camera', 'shoot', 'snapshot', 'picture', 'image', 'moment', 'selfie', 'portrait', 'landscape', 'art', 'gallery', 'studio',
        '摄影', '拍照', '照片', '相册', '镜头', '人像', '风景', '自拍', '相机', '拍摄', '写真', '摄影师', '艺术', '画廊', '工作室',
        '写真', '撮影', 'カメラ', 'ポートレート', '風景', '自撮り', 'アート', 'ギャラリー',
        '사진', '촬영', '카메라', '포트레이트', '풍경', '셀카', '예술', '갤러리'],
      category: 'skill',
      color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30'
    },
    {
      id: 'fitness_start',
      titleKey: 'milestones.fitness.start',
      descKey: 'milestones.fitness.startDesc',
      icon: Dumbbell,
      target: 10,
      tags: ['fitness', 'gym', 'workout', 'run', 'sport', 'yoga', 'swim', 'hike', 'exercise', 'training', 'cardio', 'muscle', 'health', 'walk', 'jogging', 'pilates', 'cycling', 'dance',
        '健身', '运动', '跑步', '游泳', '瑜伽', '徒步', '训练', '有氧', '撸铁', '锻炼', '舞蹈', '骑行', '健康', '肌肉', '普拉提', '慢跑', '体育', '球',
        'フィットネス', 'ジム', '運動', 'ランニング', '水泳', 'ヨガ', 'ハイキング', 'トレーニング', '筋トレ',
        '피트니스', '헬스', '운동', '러닝', '수영', '요가', '등산', '트레이닝', '근력', '건강'],
      category: 'health',
      color: 'text-green-500 bg-green-100 dark:bg-green-900/30'
    },
    {
      id: 'reading_worm',
      titleKey: 'milestones.reading.worm',
      descKey: 'milestones.reading.wormDesc',
      icon: Book,
      target: 12,
      tags: ['book', 'reading', 'study', 'novel', 'literature', 'library', 'learning', 'knowledge', 'education', 'school', 'class', 'lesson', 'paper', 'article',
        '阅读', '读书', '看书', '学习', '小说', '文学', '图书馆', '知识', '课本', '论文', '文章', '自习', '上课', '笔记', '书店',
        '読書', '本', '勉強', '小説', '文学', '図書館', '学習', '知識',
        '독서', '책', '공부', '소설', '문학', '도서관', '학습', '지식'],
      category: 'skill',
      color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30'
    }
  ];

  const milestones: Milestone[] = useMemo(() => {
    const customMilestones = bucketList.map(item => ({
      id: item.id,
      titleKey: item.title, // use title directly for custom
      descKey: 'bucketList.customDesc', // fallback or static desc
      description: item.description,
      icon: (LucideIcons as any)[item.iconName || 'Star'] || Star,
      target: item.target,
      tags: item.tags,
      category: 'life' as const,
      color: item.color || 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
    }));
    return [...customMilestones, ...systemMilestones];
  }, [bucketList]);

  // Helper to check if an entry matches a milestone
  const isEntryMatch = (entry: DiaryEntry, milestone: Milestone) => {
    const entryTags = entry.tags?.map(t => t.toLowerCase()) || [];
    // Check tags
    if (entryTags.some(tag => milestone.tags.includes(tag))) {
      return true;
    }
    // Simple keyword matching in caption (optional, but requested "smart recognition")
    const captionLower = entry.caption?.toLowerCase() || '';
    if (milestone.tags.some(tag => captionLower.includes(tag))) {
      return true;
    }
    return false;
  };

  // Calculate progress
  const progressData = useMemo(() => {
    return milestones.map(m => {
      const matchingEntries = entries.filter(e => isEntryMatch(e, m));
      const count = matchingEntries.length;
      
      // Determine state
      let state: 'someday' | 'in_progress' | 'achieved' = 'in_progress';
      if (m.target === 0) {
        state = 'someday';
      } else if (count >= m.target) {
        state = 'achieved';
      }

      return {
        ...m,
        current: count,
        progress: m.target > 0 ? Math.min(100, (count / m.target) * 100) : 0,
        completed: count >= m.target && m.target > 0,
        state,
        entries: matchingEntries
      };
    });
  }, [entries, milestones]);

  // Group by state
  const somedayList = progressData.filter(m => m.state === 'someday');
  const inProgressList = progressData.filter(m => m.state === 'in_progress');
  const achievedList = progressData.filter(m => m.state === 'achieved');

  const totalCompleted = achievedList.length;
  // Calculate progress only for non-someday items
  const trackableItems = progressData.filter(m => m.target > 0);
  const totalProgress = trackableItems.length > 0 
    ? trackableItems.reduce((acc, curr) => acc + curr.progress, 0) / trackableItems.length 
    : 0;

  const selectedMilestoneData = selectedMilestone ? progressData.find(p => p.id === selectedMilestone.id) : null;

  // Group entries by date for the selected milestone
  const groupedEntries = useMemo(() => {
    if (!selectedMilestoneData) return [];
    
    const sorted = [...selectedMilestoneData.entries].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const groups: { date: string; entries: DiaryEntry[] }[] = [];
    
    sorted.forEach(entry => {
        const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.date === dateKey) {
            lastGroup.entries.push(entry);
        } else {
            groups.push({ date: dateKey, entries: [entry] });
        }
    });
    return groups;
  }, [selectedMilestoneData]);

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-2xl shadow-sm">
            <Trophy className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('milestones.title')}</h1>
              <Button 
                onClick={() => setIsAddWishOpen(true)}
                variant="outline" 
                size="sm"
                className="rounded-full flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {t('bucketList.addWish', '添加愿望')}
              </Button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('milestones.subtitle')}</p>
          </div>
        </div>

        {/* Overall Progress Card */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-6 min-w-[280px]">
           <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-100 dark:text-gray-700"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={175}
                  strokeDashoffset={175 - (175 * totalProgress) / 100}
                  className="text-amber-500 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-bold text-gray-900 dark:text-white">
                {Math.round(totalProgress)}%
              </span>
           </div>
           <div>
             <div className="text-sm text-gray-500 dark:text-gray-400">{t('milestones.totalCompleted')}</div>
             <div className="text-2xl font-bold text-gray-900 dark:text-white">
               {totalCompleted} <span className="text-sm text-gray-400 font-normal">/ {milestones.length}</span>
             </div>
           </div>
        </div>
      </div>

      {/* In Progress Section */}
      {inProgressList.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-500" />
            {t('bucketList.inProgress', '进行中')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inProgressList.map(milestone => (
              <MilestoneCard 
                key={milestone.id} 
                milestone={milestone} 
                onClick={() => setSelectedMilestone(milestone)} 
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {/* Someday Section */}
      {somedayList.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 opacity-80">
            <Star className="w-6 h-6 text-purple-500" />
            {t('bucketList.someday', '随便想想')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80 hover:opacity-100 transition-opacity">
            {somedayList.map(milestone => (
              <MilestoneCard 
                key={milestone.id} 
                milestone={milestone} 
                onClick={() => setSelectedMilestone(milestone)} 
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {/* Achieved Section */}
      {achievedList.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            {t('bucketList.achieved', '已达成')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievedList.map(milestone => (
              <MilestoneCard 
                key={milestone.id} 
                milestone={milestone} 
                onClick={() => setSelectedMilestone(milestone)} 
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      <AddWishDialog 
        open={isAddWishOpen} 
        onOpenChange={setIsAddWishOpen} 
      />

      {/* Gallery Modal */}
      {selectedMilestoneData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMilestone(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 z-10">
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${selectedMilestoneData.color}`}>
                    <selectedMilestoneData.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedMilestoneData.id.startsWith('photo_') || selectedMilestoneData.id.startsWith('fitness_') || selectedMilestoneData.id.startsWith('reading_')
                        ? t(selectedMilestoneData.titleKey)
                        : selectedMilestoneData.titleKey}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-500">
                          {selectedMilestoneData.current} / {selectedMilestoneData.target} {t('milestones.memories')}
                      </p>
                      {(!selectedMilestoneData.id.startsWith('photo_') && !selectedMilestoneData.id.startsWith('fitness_') && !selectedMilestoneData.id.startsWith('reading_')) && selectedMilestoneData.tags && selectedMilestoneData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 border-l border-gray-200 dark:border-gray-700 pl-2">
                          {selectedMilestoneData.tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
               </div>
               <button 
                 onClick={() => setSelectedMilestone(null)}
                 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
               >
                 <X className="w-6 h-6 text-gray-500" />
               </button>
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
                {groupedEntries.length > 0 ? (
                    <div className="space-y-8">
                        {groupedEntries.map((group) => (
                            <div key={group.date} className="relative">
                                {/* Timeline Node */}
                                <div className="flex items-center gap-4 mb-4 sticky top-0 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-sm py-2 z-10 -mx-2 px-2">
                                    <div className={`w-3 h-3 rounded-full ${selectedMilestoneData?.color.split(' ')[0].replace('text-', 'bg-') || 'bg-gray-400'} ring-4 ring-white dark:ring-gray-900`}></div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {format(new Date(group.date), 'MMMM d, yyyy')}
                                        <span className="text-[10px] font-normal text-gray-500 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                            {group.entries.length}
                                        </span>
                                    </h4>
                                </div>

                                {/* Photos Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pl-5 border-l-2 border-gray-200 dark:border-gray-800 ml-1.5 pb-4">
                                    {group.entries.map(entry => {
                                        const displayMediaUrl = entry.media && entry.media.length > 0 ? entry.media[0].url : entry.photo;
                                        const isVideo = entry.media && entry.media.length > 0 ? entry.media[0].type === 'video' : displayMediaUrl?.startsWith('data:video/') || displayMediaUrl?.endsWith('.mp4');
                                        
                                        return (
                                        <div key={entry.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-sm hover:shadow-md transition-all">
                                            {isVideo ? (
                                                <video 
                                                    src={displayMediaUrl}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 bg-black"
                                                />
                                            ) : (
                                                <LazyImage 
                                                    src={displayMediaUrl} 
                                                    alt={entry.caption}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            )}
                                            {entry.media && entry.media.length > 1 && (
                                                <div className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-medium flex items-center gap-1 backdrop-blur-sm">
                                                    <Camera className="w-3 h-3" />
                                                    {entry.media.length}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                <p className="text-white text-xs font-medium line-clamp-1">{entry.caption}</p>
                                                <p className="text-white/70 text-[10px]">{format(new Date(entry.date), 'HH:mm')}</p>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {t('milestones.noEntries')}
                        </h3>
                        <p className="text-gray-500 text-sm max-w-xs">
                            {t('milestones.noEntriesDesc')}
                        </p>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
