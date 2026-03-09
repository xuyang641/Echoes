import { DiaryEntry } from '../components/diary-entry-form';
import { ACHIEVEMENTS } from '../utils/achievements';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AchievementListProps {
  entries: DiaryEntry[];
}

export function AchievementList({ entries }: AchievementListProps) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('achievements.title')}</h3>
          <p className="text-sm text-gray-500">{t('achievements.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = achievement.condition(entries);
          const progress = achievement.progress(entries);
          const percent = Math.round((progress / achievement.maxProgress) * 100);
          const Icon = achievement.icon;

          return (
            <div 
              key={achievement.id}
              className={`relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden group ${
                isUnlocked 
                  ? 'border-blue-100 bg-gradient-to-br from-white to-blue-50/50 shadow-sm hover:shadow-xl hover:scale-[1.02] hover:border-blue-200' 
                  : 'border-gray-100 bg-gray-50/50 opacity-80'
              }`}
            >
              {/* Shine Effect for Unlocked */}
              {isUnlocked && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine z-0" />
              )}

              <div className="flex items-start gap-4 relative z-10">
                <div className={`p-3.5 rounded-2xl shadow-sm transition-transform group-hover:scale-110 duration-300 ${
                  isUnlocked 
                    ? `${achievement.color} shadow-blue-100 ring-2 ring-white` 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {isUnlocked ? <Icon className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold text-sm mb-0.5 truncate pr-2 ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                      {t(`achievements.${achievement.id}.title`, achievement.title)}
                    </h4>
                    {isUnlocked && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full shrink-0">
                        {t('achievements.unlocked')}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 line-clamp-2 h-8 leading-4">
                    {t(`achievements.${achievement.id}.description`, achievement.description)}
                  </p>
                  
                  {/* Progress Section */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-medium mb-1.5 text-gray-400">
                      <span>{t('achievements.progress')}</span>
                      <span className={isUnlocked ? 'text-blue-600' : ''}>
                        {Math.round(percent)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                          isUnlocked 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                            : 'bg-gray-300'
                        }`}
                        style={{ width: `${percent}%` }}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes shine {
          0% { transform: translateX(-150%) skewX(-20deg); }
          50% { transform: translateX(150%) skewX(-20deg); }
          100% { transform: translateX(150%) skewX(-20deg); }
        }
        .animate-shine {
          animation: shine 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}