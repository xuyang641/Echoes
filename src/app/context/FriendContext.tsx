import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

import { isPermissionGranted, sendNotification } from '@tauri-apps/plugin-notification';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface FriendRequest {
  id: string;
  from: UserProfile;
  toId: string;
  status: 'pending' | 'accepted' | 'rejected';
  date: string;
}

interface FriendContextType {
  friends: UserProfile[];
  friendRequests: FriendRequest[];
  sendFriendRequest: (email: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<UserProfile[]>;
}

const FriendContext = createContext<FriendContextType | undefined>(undefined);

export function FriendProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  // Fetch Friends and Requests
  useEffect(() => {
    if (!user) return;

    if (user.id === 'mock-user-123') {
      // Mock data for local development to prevent network errors
      setFriends([]);
      setFriendRequests([]);
      return;
    }

    const fetchData = async () => {
      // 1. Fetch Requests (received)
      const { data: requests } = await supabase
        .from('friend_requests')
        .select(`
          id,
          status,
          created_at,
          sender:sender_id (id, full_name, email, avatar_url)
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (requests) {
        setFriendRequests(requests.map((r: any) => ({
          id: r.id,
          from: {
            id: r.sender.id,
            name: r.sender.full_name || 'Unknown',
            email: r.sender.email || '',
            avatar: r.sender.avatar_url
          },
          toId: user.id,
          status: r.status as any,
          date: r.created_at
        })));
      }

      // 2. Fetch Friends (accepted requests sent OR received)
      // Supabase query for OR is tricky in one go if we need joins on different columns
      // Simplest: Get all accepted requests involving me
      const { data: accepted } = await supabase
        .from('friend_requests')
        .select(`
          sender_id,
          receiver_id,
          sender:sender_id (id, full_name, email, avatar_url),
          receiver:receiver_id (id, full_name, email, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (accepted) {
        const friendList = accepted.map((r: any) => {
          const isSender = r.sender_id === user.id;
          const friendData = isSender ? r.receiver : r.sender;
          return {
            id: friendData.id,
            name: friendData.full_name || 'Unknown',
            email: friendData.email || '',
            avatar: friendData.avatar_url
          };
        });
        // Deduplicate just in case
        const uniqueFriends = Array.from(new Map(friendList.map(item => [item.id, item])).values());
        setFriends(uniqueFriends);
      }
    };

    fetchData();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('friend_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, async (payload) => {
        fetchData();
        
        // Notify on new friend request
        if (payload.eventType === 'INSERT' && payload.new.receiver_id === user.id) {
          const title = 'New Friend Request';
          const body = 'Someone wants to connect with you!';
          
          if (!Capacitor.isNativePlatform()) {
            try {
              const granted = await isPermissionGranted();
              if (granted) {
                sendNotification({ title, body });
              }
            } catch (err) {
               if ('Notification' in window && Notification.permission === 'granted') {
                 new Notification(title, { body, icon: '/icon.png' });
               }
            }
          } else {
            try {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title,
                    body,
                    id: new Date().getTime(),
                    schedule: { at: new Date(Date.now() + 1000) },
                    sound: 'rain.mp3',
                    smallIcon: 'ic_stat_icon_config_sample'
                  }
                ]
              });
            } catch (e) {
              console.error('Local notification failed', e);
            }
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const sendFriendRequest = async (email: string) => {
    if (!user) return false;

    // 1. Find User by Email
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .single();

    if (!users) {
      alert('User not found.');
      return false;
    }

    if (users.id === user.id) {
      alert('You cannot add yourself.');
      return false;
    }

    // 2. Check if request exists
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${users.id}),and(sender_id.eq.${users.id},receiver_id.eq.${user.id})`)
      .single();

    if (existing) {
      if (existing.status === 'accepted') alert('Already friends!');
      else if (existing.status === 'pending') alert('Request already pending.');
      else alert('Request was previously rejected.'); // Could allow resend
      return false;
    }

    // 3. Insert Request
    const { error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: user.id,
        receiver_id: users.id,
        status: 'pending'
      });

    if (error) {
      console.error(error);
      alert('Failed to send request.');
      return false;
    }

    alert('Friend request sent!');
    return true;
  };

  const acceptFriendRequest = async (requestId: string) => {
    await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);
  };

  const rejectFriendRequest = async (requestId: string) => {
    await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;
    // Delete the relationship row
    await supabase
      .from('friend_requests')
      .delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`);
    
    // Optimistic update
    setFriends(prev => prev.filter(f => f.id !== friendId));
  };

  const searchUsers = async (query: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(5);
      
    return (data || []).map(u => ({
      id: u.id,
      name: u.full_name || 'Unknown',
      email: u.email || '',
      avatar: u.avatar_url
    }));
  };

  return (
    <FriendContext.Provider value={{
      friends,
      friendRequests,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      removeFriend,
      searchUsers
    }}>
      {children}
    </FriendContext.Provider>
  );
}

export function useFriend() {
  const context = useContext(FriendContext);
  if (context === undefined) {
    throw new Error('useFriend must be used within a FriendProvider');
  }
  return context;
}
