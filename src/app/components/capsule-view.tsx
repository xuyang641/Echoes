import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Unlock, Clock, Calendar, Plus, Hourglass, Send, Eye } from 'lucide-react';
import { DiaryEntry } from './diary-entry-form';
import { format, isAfter, parseISO, differenceInDays } from 'date-fns';
import { LazyImage } from './ui/lazy-image';
import { DiaryEntryForm } from './diary-entry-form';

interface CapsuleViewProps {
  entries: DiaryEntry[];
  onAddEntry: (entry: DiaryEntry, targetGroups: string[]) => void;
  saving?: boolean;
}

export function CapsuleView({ entries, onAddEntry, saving }: CapsuleViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'locked' | 'unlocked' | 'create'>('locked');

  // Filter entries that are capsules
  // We identify capsules by having a 'capsule' tag or an unlockDate property
  // Since we just added unlockDate to the interface, we'll check that.
  // Also check for 'capsule' tag for backward compatibility or robust filtering.
  const capsules = useMemo(() => {
    return entries.filter(entry => 
      entry.unlockDate || (entry.tags && entry.tags.includes('capsule'))
    );
  }, [entries]);

  const lockedCapsules = useMemo(() => {
    return capsules.filter(c => {
        if (!c.unlockDate) return false;
        return isAfter(parseISO(c.unlockDate), new Date());
    });
  }, [capsules]);

  const unlockedCapsules = useMemo(() => {
    return capsules.filter(c => {
        if (!c.unlockDate) return true; // Default to unlocked if no date? Or maybe invalid.
        return !isAfter(parseISO(c.unlockDate), new Date());
    });
  }, [capsules]);

  const handleCreateCapsule = (entry: DiaryEntry, targetGroups: string[]) => {
    // Add capsule tag and ensure unlockDate is set
    // This logic is actually handled by the form wrapper below
    onAddEntry(entry, targetGroups);
    setActiveTab('locked');
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
            <Hourglass className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('capsule.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('capsule.subtitle')}</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('locked')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'locked'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            {t('capsule.locked')}
            <span className="ml-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-xs">
              {lockedCapsules.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('unlocked')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'unlocked'
                ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Unlock className="w-4 h-4" />
            {t('capsule.unlocked')}
            <span className="ml-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full text-xs">
              {unlockedCapsules.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            {t('capsule.create')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'create' ? (
          <div className="max-w-2xl mx-auto">
            <CreateCapsuleForm onSave={handleCreateCapsule} saving={saving} />
          </div>
        ) : activeTab === 'locked' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedCapsules.length > 0 ? (
              lockedCapsules.map(capsule => (
                <LockedCapsuleCard key={capsule.id} capsule={capsule} />
              ))
            ) : (
              <EmptyState type="locked" onCreate={() => setActiveTab('create')} />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {unlockedCapsules.length > 0 ? (
              unlockedCapsules.map(capsule => (
                <UnlockedCapsuleCard key={capsule.id} capsule={capsule} />
              ))
            ) : (
              <EmptyState type="unlocked" onCreate={() => setActiveTab('create')} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateCapsuleForm({ onSave, saving }: { onSave: (entry: DiaryEntry, groups: string[]) => void, saving?: boolean }) {
    const { t } = useTranslation();
    const [unlockDate, setUnlockDate] = useState('');

    const handleWrapperSave = (entry: DiaryEntry, groups: string[]) => {
        if (!unlockDate) {
            alert(t('capsule.selectDateError'));
            return;
        }
        
        // Enhance entry with capsule data
        const capsuleEntry: DiaryEntry = {
            ...entry,
            tags: [...(entry.tags || []), 'capsule'],
            unlockDate: unlockDate
        };
        
        onSave(capsuleEntry, groups);
    };

    return (
        <div className="space-y-6">
             <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {t('capsule.setUnlockDate')}
                </h3>
                <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-4">
                    {t('capsule.unlockDateDesc')}
                </p>
                <input 
                    type="date" 
                    min={format(new Date(), 'yyyy-MM-dd')}
                    value={unlockDate}
                    onChange={(e) => setUnlockDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            <DiaryEntryForm onSave={handleWrapperSave} saving={saving} />
        </div>
    );
}

function LockedCapsuleCard({ capsule }: { capsule: DiaryEntry }) {
    const { t } = useTranslation();
    const daysLeft = differenceInDays(parseISO(capsule.unlockDate!), new Date());

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Lock className="w-24 h-24 rotate-12" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full items-center justify-center text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Lock className="w-8 h-8 text-gray-400" />
                </div>
                
                <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {t('capsule.lockedTitle')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('capsule.opensIn', { days: daysLeft })}
                    </p>
                </div>

                <div className="text-xs font-mono bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-full text-gray-400">
                    {format(parseISO(capsule.unlockDate!), 'yyyy-MM-dd')}
                </div>
            </div>
        </div>
    );
}

function UnlockedCapsuleCard({ capsule }: { capsule: DiaryEntry }) {
    const { t } = useTranslation();
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group">
            <div className="relative aspect-[4/3] overflow-hidden">
                <LazyImage 
                    src={capsule.photo} 
                    alt={capsule.caption}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                     <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm">
                        {format(new Date(capsule.date), 'MMM d, yyyy')}
                     </span>
                </div>
            </div>
            
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-md font-medium flex items-center gap-1">
                        <Unlock className="w-3 h-3" />
                        {t('capsule.unlockedBadge')}
                    </span>
                </div>
                <p className="text-gray-900 dark:text-white font-medium line-clamp-2">
                    {capsule.caption}
                </p>
            </div>
        </div>
    );
}

function EmptyState({ type, onCreate }: { type: 'locked' | 'unlocked', onCreate: () => void }) {
    const { t } = useTranslation();
    const isLocked = type === 'locked';

    return (
        <div className="col-span-full py-16 text-center bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                {isLocked ? (
                    <Hourglass className="w-8 h-8 text-indigo-400" />
                ) : (
                    <Eye className="w-8 h-8 text-green-400" />
                )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isLocked ? t('capsule.noLocked') : t('capsule.noUnlocked')}
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6 text-sm">
                {isLocked ? t('capsule.noLockedDesc') : t('capsule.noUnlockedDesc')}
            </p>
            <button
                onClick={onCreate}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
                <Send className="w-4 h-4" />
                {t('capsule.createFirst')}
            </button>
        </div>
    );
}
