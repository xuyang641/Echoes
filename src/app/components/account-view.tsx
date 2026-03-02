import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFriend } from '../context/FriendContext';
import { User, Mail, UserPlus, Check, X, Trash2, LogOut, Settings, Hash, Globe, Bell, MapPin, Camera, BookOpen, Calendar } from 'lucide-react';
import { AchievementList } from './achievement-list';
import { fetchEntries } from '../utils/api'; // Or pass from props
import { DiaryEntry } from './diary-entry-form';
import { supabase } from '../utils/supabaseClient';
import { EditProfileModal } from './edit-profile-modal';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { NotificationManager } from './managers/notification-manager';
import { BackupManager } from './managers/backup-manager';
import { SecurityManager } from './managers/security-manager';
import { StorageManager } from './managers/storage-manager';
import { ThemeManager } from './managers/theme-manager';
import { differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';

interface UserProfile {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  short_id?: string;
}

export function AccountView() {
  const { user, signOut } = useAuth();
  const { friends, friendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } = useFriend();
  const { language, setLanguage } = useTheme();
  const { t } = useTranslation();
  
  const [addFriendEmail, setAddFriendEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'friends' | 'achievements'>('profile');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // We need entries for achievements. 
  // Ideally this should be passed down or fetched from a global store.
  // For now, let's fetch them here if we are on the achievements tab.
  // Or better, fetch once on mount since it's "Account" view.
  useEffect(() => {
    fetchEntries().then(setEntries).catch(console.error);
    fetchProfile();
  }, [user]);

  async function fetchProfile() {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) setProfile(data);
  }

  // Calculate Statistics
  const stats = useMemo(() => {
    if (entries.length === 0) return null;

    const totalEntries = entries.length;
    const totalPhotos = entries.filter(e => e.photo).length;
    const totalLocations = new Set(entries.filter(e => e.location?.name).map(e => e.location!.name)).size;
    
    // Calculate days streak or total days active (simple version: first entry to now)
    // Or just distinct days with entries
    const distinctDays = new Set(entries.map(e => e.date.split('T')[0])).size;
    
    // Total words (approx)
    const totalWords = entries.reduce((acc, curr) => acc + (curr.caption?.length || 0), 0);

    return {
        totalEntries,
        totalPhotos,
        totalLocations,
        distinctDays,
        totalWords
    };
  }, [entries]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendEmail.trim()) return;
    
    await sendFriendRequest(addFriendEmail);
    setAddFriendEmail('');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-6 pb-20"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('account.title')}</h1>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={signOut}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('account.signOut')}
        </motion.button>
      </motion.div>

      <motion.div variants={itemVariants} className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'profile'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          {t('account.myProfile')}
          {activeTab === 'profile' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'achievements'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          {t('account.achievements')}
          {activeTab === 'achievements' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'friends'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          {t('account.friends')} ({friends.length})
          {friendRequests.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {friendRequests.length}
            </span>
          )}
          {activeTab === 'friends' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            />
          )}
        </button>
      </motion.div>

      {activeTab === 'profile' ? (
        <motion.div variants={containerVariants} className="space-y-6">
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center text-4xl shadow-inner overflow-hidden border-4 border-white dark:border-gray-700 shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.email?.[0].toUpperCase() || <User />
                )}
              </div>
              
              <div className="flex-1 space-y-4 text-center md:text-left w-full">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {profile?.full_name || t('account.anonymous')}
                        </h2>
                        <p className="text-sm text-gray-500">@{profile?.username || t('account.noUsername')}</p>
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        {t('account.editProfile')}
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="text-xs text-gray-500 uppercase font-bold">{t('account.email')}</p>
                      <p className="text-sm font-medium truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs text-gray-500 uppercase font-bold">{t('account.friendId')}</p>
                      <p className="text-sm font-mono font-medium tracking-wider">{profile?.short_id || t('account.generating')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Dashboard */}
            {stats && (
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Your Journey</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <motion.div whileHover={{ y: -2 }} className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-800">
                            <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-bold">DAYS</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.distinctDays}</div>
                            <div className="text-xs text-gray-500">Active Days</div>
                        </motion.div>
                        <motion.div whileHover={{ y: -2 }} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                                <BookOpen className="w-4 h-4" />
                                <span className="text-xs font-bold">WORDS</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.totalWords / 1000).toFixed(1)}k</div>
                            <div className="text-xs text-gray-500">Total Words</div>
                        </motion.div>
                        <motion.div whileHover={{ y: -2 }} className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-2xl border border-pink-100 dark:border-pink-800">
                            <div className="flex items-center gap-2 mb-2 text-pink-600 dark:text-pink-400">
                                <Camera className="w-4 h-4" />
                                <span className="text-xs font-bold">PHOTOS</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPhotos}</div>
                            <div className="text-xs text-gray-500">Moments Captured</div>
                        </motion.div>
                        <motion.div whileHover={{ y: -2 }} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
                                <MapPin className="w-4 h-4" />
                                <span className="text-xs font-bold">PLACES</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLocations}</div>
                            <div className="text-xs text-gray-500">Locations Visited</div>
                        </motion.div>
                    </div>
                </div>
            )}
          </motion.div>

          {/* Security Manager */}
          <motion.div variants={itemVariants}>
            <SecurityManager />
          </motion.div>

          {/* Theme & Appearance */}
          <motion.div variants={itemVariants}>
            <ThemeManager />
          </motion.div>

          {/* Storage & Data */}
          <motion.div variants={itemVariants}>
            <StorageManager />
          </motion.div>

          {/* Notification Settings */}
          <motion.div variants={itemVariants}>
            <NotificationManager>
                {({ settings, updateSettings }) => (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-500" />
                    {t('notifications.title', 'Daily Reminder')}
                    </h3>
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                        <input 
                            type="checkbox" 
                            id="toggle-notification"
                            className="peer sr-only"
                            checked={settings.enabled}
                            onChange={(e) => updateSettings({ ...settings, enabled: e.target.checked })}
                        />
                        <label 
                            htmlFor="toggle-notification"
                            className="block w-12 h-6 overflow-hidden bg-gray-200 rounded-full cursor-pointer peer-checked:bg-blue-500 transition-colors"
                        ></label>
                        <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-6"></span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                        {settings.enabled ? t('notifications.on', 'On') : t('notifications.off', 'Off')}
                        </span>
                    </div>
                    
                    {settings.enabled && (
                        <input 
                        type="time" 
                        value={settings.time}
                        onChange={(e) => updateSettings({ ...settings, time: e.target.value })}
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                    )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {t('notifications.desc', 'Receive a gentle reminder to record your memories.')}
                    </p>
                </div>
                )}
            </NotificationManager>
          </motion.div>

          {/* Backup Manager */}
          <motion.div variants={itemVariants}>
            <BackupManager />
          </motion.div>

          {/* Language Selector */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              {t('account.language')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { code: 'en', label: 'English', flag: '🇺🇸' },
                { code: 'zh', label: '简体中文', flag: '🇨🇳' },
                { code: 'ja', label: '日本語', flag: '🇯🇵' },
                { code: 'ko', label: '한국어', flag: '🇰🇷' },
              ].map((lang) => (
                <motion.button
                  key={lang.code}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLanguage(lang.code as any)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    language === lang.code
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Legal & Info Links */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">About</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Version</span>
                <span className="text-sm font-mono text-gray-500">v2.1.0 (Build 2024.05)</span>
              </div>
              <Link to="/about" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('footer.about')}</span>
                <div className="w-5 h-5 text-gray-400">→</div>
              </Link>
              <Link to="/privacy" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('footer.privacy')}</span>
                <div className="w-5 h-5 text-gray-400">→</div>
              </Link>
              <Link to="/terms" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('footer.terms')}</span>
                <div className="w-5 h-5 text-gray-400">→</div>
              </Link>
            </div>
            
            <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                    Made with ❤️ by Echoes Team
                </p>
            </div>
          </motion.div>
        </motion.div>
      ) : activeTab === 'achievements' ? (
        <AchievementList entries={entries} />
      ) : (
        <motion.div variants={containerVariants} className="space-y-6">
          {/* Add Friend */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              添加新好友
            </h3>
            <form onSubmit={handleAddFriend} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={addFriendEmail}
                  onChange={(e) => setAddFriendEmail(e.target.value)}
                  placeholder="输入好友的邮箱地址"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                发送请求
              </motion.button>
            </form>
          </motion.div>

          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <motion.div variants={itemVariants} className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5" />
                好友请求
              </h3>
              <div className="space-y-3">
                {friendRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {request.from.avatar ? (
                          <img src={request.from.avatar} alt={request.from.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">{request.from.name[0]}</div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{request.from.name}</div>
                        <div className="text-xs text-gray-500">{request.from.email}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => acceptFriendRequest(request.id)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        title="接受"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => rejectFriendRequest(request.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="拒绝"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Friend List */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-500" />
              你的好友
            </h3>
            
            {friends.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>还没有好友。在上方邀请一位吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map(friend => (
                  <motion.div 
                    key={friend.id} 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">{friend.name[0]}</div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{friend.name}</div>
                        <div className="text-xs text-gray-500">{friend.email}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if(confirm(`Remove ${friend.name} from friends?`)) removeFriend(friend.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="删除好友"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdate={fetchProfile}
      />
    </motion.div>
  );
}