import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFriend } from '../context/FriendContext';
import { User, Mail, UserPlus, Check, X, Search, Trash2, LogOut, Settings, Trophy, Hash, Globe } from 'lucide-react';
import { AchievementList } from './achievement-list';
import { fetchEntries } from '../utils/api'; // Or pass from props
import { DiaryEntry } from './diary-entry-form';
import { supabase } from '../utils/supabaseClient';
import { EditProfileModal } from './edit-profile-modal';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

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

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendEmail.trim()) return;
    
    await sendFriendRequest(addFriendEmail);
    setAddFriendEmail('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('account.title')}</h1>
        <button 
          onClick={signOut}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('account.signOut')}
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          {t('account.myProfile')}
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'achievements'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          {t('account.achievements')}
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'friends'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          {t('account.friends')} ({friends.length})
          {friendRequests.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {friendRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'profile' ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center text-4xl shadow-inner overflow-hidden border-4 border-white dark:border-gray-700">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.email?.[0].toUpperCase() || <User />
                )}
              </div>
              
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile?.full_name || t('account.anonymous')}
                  </h2>
                  <p className="text-sm text-gray-500">@{profile?.username || t('account.noUsername')}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 max-w-md">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
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

                <div className="pt-2">
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-200 mx-auto md:mx-0"
                  >
                    <Settings className="w-4 h-4" />
                    {t('account.editProfile')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Language Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
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
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as any)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    language === lang.code
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Legal & Info Links */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">About</h3>
            <div className="space-y-2">
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
          </div>
        </div>
      ) : activeTab === 'achievements' ? (
        <AchievementList entries={entries} />
      ) : (
        <div className="space-y-6">
          {/* Add Friend */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              Add New Friend
            </h3>
            <form onSubmit={handleAddFriend} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={addFriendEmail}
                  onChange={(e) => setAddFriendEmail(e.target.value)}
                  placeholder="Enter friend's email address"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Send Request
              </button>
            </form>
          </div>

          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5" />
                Friend Requests
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
                        title="Accept"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => rejectFriendRequest(request.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friend List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-500" />
              Your Friends
            </h3>
            
            {friends.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No friends yet. Invite someone above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map(friend => (
                  <div key={friend.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all group">
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
                      title="Remove Friend"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdate={fetchProfile}
      />
    </div>
  );
}