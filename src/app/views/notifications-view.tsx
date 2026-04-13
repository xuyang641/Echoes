import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { Bell, Heart, UserPlus, Calendar, Loader2, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'like' | 'friend_request' | 'comment' | 'system';
  created_at: string;
  read: boolean;
  sender_id: string;
  data: any;
  sender?: {
    full_name: string;
    avatar_url: string;
    username: string;
  };
}

export function NotificationsView() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      // In a real app, you would join with profiles table
      // For now, let's mock some data or fetch real data if table exists
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:sender_id (
            full_name,
            avatar_url,
            username
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, show empty state or mock
        console.warn('Notifications table might not exist yet', error);
        setNotifications([]);
      } else {
        setNotifications(data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (!error) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  async function handleFriendRequest(id: string, accept: boolean) {
    // Implement friend request logic
    toast.success(accept ? '已接受好友请求' : '已拒绝好友请求');
    markAsRead(id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="w-6 h-6" />
          收件箱
        </h1>
        <button 
          onClick={fetchNotifications} 
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          全部已读
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">暂无新消息</h3>
          <p className="text-gray-500 mt-2">当有人与您互动时，消息会出现在这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`bg-white dark:bg-gray-800 p-4 rounded-xl border transition-all ${
                notification.read 
                  ? 'border-gray-100 dark:border-gray-700' 
                  : 'border-blue-100 dark:border-blue-900 shadow-sm bg-blue-50/30 dark:bg-blue-900/10'
              }`}
            >
              <div className="flex gap-4">
                <div className="shrink-0">
                  {notification.sender?.avatar_url ? (
                    <img 
                      src={notification.sender.avatar_url} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Bell className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.sender?.full_name || '系统通知'}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">
                      {format(new Date(notification.created_at), 'MM-dd HH:mm', { locale: zhCN })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {notification.type === 'like' && '赞了你的日记'}
                    {notification.type === 'comment' && '评论了你的日记'}
                    {notification.type === 'friend_request' && '请求添加你为好友'}
                    {notification.type === 'system' && notification.data?.message}
                  </p>

                  {notification.type === 'friend_request' && !notification.read && (
                    <div className="flex gap-3 mt-3">
                      <button 
                        onClick={() => handleFriendRequest(notification.id, true)}
                        className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" /> 接受
                      </button>
                      <button 
                        onClick={() => handleFriendRequest(notification.id, false)}
                        className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs py-1.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" /> 拒绝
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}