import React, { createContext, useContext, useState, useEffect } from 'react';
import { DiaryEntry } from '../components/diary-entry-form';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

import { isPermissionGranted, sendNotification } from '@tauri-apps/plugin-notification';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  members: GroupMember[];
  entries: DiaryEntry[]; 
  color: string; 
}

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'member';
}

export interface GroupRequest {
  id: string;
  group: { id: string; name: string; color: string };
  from: { id: string; name: string; email: string; avatar?: string };
  status: 'pending' | 'accepted' | 'rejected';
  date: string;
}

interface GroupContextType {
  groups: Group[];
  currentGroupId: string | null;
  groupRequests: GroupRequest[];
  createGroup: (name: string) => Promise<Group | null>;
  joinGroup: (code: string) => Promise<boolean>;
  inviteFriend: (groupId: string, friendId: string) => Promise<boolean>;
  acceptGroupRequest: (requestId: string) => Promise<void>;
  rejectGroupRequest: (requestId: string) => Promise<void>;
  setCurrentGroupId: (id: string | null) => void;
  getGroupEntries: (groupId: string) => DiaryEntry[];
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [groupRequests, setGroupRequests] = useState<GroupRequest[]>([]);

  // Fetch Groups on load
  useEffect(() => {
    if (!user) {
      setGroups([]);
      setGroupRequests([]);
      return;
    }

    if (user.id === 'mock-user-123') {
      // Mock data for local development to prevent network errors
      setGroups([]);
      setGroupRequests([]);
      return;
    }

    const fetchGroups = async () => {
      // 1. Get groups I belong to
      const { data: memberships, error } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          group:group_id (
            id, name, invite_code, color, created_by
          )
        `)
        .eq('user_id', user.id);

      if (error || !memberships) {
        console.error('Error fetching groups:', error);
        return;
      }

      // 2. For each group, fetch members and entries
      const loadedGroups: Group[] = await Promise.all(memberships.map(async (m: any) => {
        const groupData = m.group;
        
        // Fetch Members
        const { data: members } = await supabase
          .from('group_members')
          .select(`
            role,
            user:user_id (id, full_name, avatar_url)
          `)
          .eq('group_id', groupData.id);

        const formattedMembers: GroupMember[] = (members || []).map((mem: any) => ({
          id: mem.user.id,
          name: mem.user.full_name || 'Unknown',
          avatar: mem.user.avatar_url,
          role: mem.role
        }));

        // Fetch Entries (Basic fetch for now)
        const { data: entries } = await supabase
          .from('diary_entries')
          .select(`
            id, date, photo_url, caption, mood, location, user_id
          `)
          .eq('group_id', groupData.id)
          .order('date', { ascending: false });

        const formattedEntries: DiaryEntry[] = (entries || []).map((e: any) => ({
          id: e.id,
          date: e.date,
          photo: e.photo_url,
          caption: e.caption,
          mood: e.mood,
          location: e.location,
          userId: e.user_id, 
          userName: formattedMembers.find(fm => fm.id === e.user_id)?.name || 'Unknown',
          userAvatar: formattedMembers.find(fm => fm.id === e.user_id)?.avatar
        }));

        console.log(`Fetched ${formattedEntries.length} entries for group ${groupData.name}`);

        return {
          id: groupData.id,
          name: groupData.name,
          inviteCode: groupData.invite_code,
          color: groupData.color || '#blue',
          members: formattedMembers,
          entries: formattedEntries
        };
      }));

      setGroups(loadedGroups);

      // Fetch pending group requests
      const { data: requests } = await supabase
        .from('group_invitations')
        .select(`
          id,
          status,
          created_at,
          group:group_id (id, name, color),
          sender:sender_id (id, full_name, email, avatar_url)
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (requests) {
        setGroupRequests(requests.map((r: any) => ({
          id: r.id,
          status: r.status,
          date: r.created_at,
          group: {
            id: r.group.id,
            name: r.group.name,
            color: r.group.color
          },
          from: {
            id: r.sender.id,
            name: r.sender.full_name || 'Unknown',
            email: r.sender.email || '',
            avatar: r.sender.avatar_url
          }
        })));
      }
    };

    fetchGroups();
    
    // Realtime subscription could be added here
    const subscription = supabase
      .channel('group_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => fetchGroups())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_invitations' }, async (payload) => {
        fetchGroups();
        
        if (payload.eventType === 'INSERT' && payload.new.receiver_id === user.id) {
          const title = 'New Group Invitation';
          const body = 'You have been invited to join a group!';
          
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

  const createGroup = async (name: string) => {
    if (!user) return null;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const color = '#' + Math.floor(Math.random()*16777215).toString(16);

    // 1. Insert Group
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name,
        invite_code: code,
        color,
        created_by: user.id
      })
      .select()
      .single();

    if (error || !group) {
      console.error('Error creating group:', error);
      return null;
    }

    // 2. Insert Member (Owner)
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'owner'
      });

    if (memberError) {
      console.error('CRITICAL ERROR adding owner to group:', memberError);
      alert(`Error creating group membership: ${memberError.message}`);
      return null;
    }

    console.log('Successfully created group and added owner:', group);

    // Optimistically update UI immediately
    const newGroup: Group = {
      id: group.id,
      name: group.name,
      inviteCode: group.invite_code,
      color: group.color,
      members: [{
        id: user.id,
        name: user.email || 'Me', // Fallback name
        role: 'owner'
      }],
      entries: []
    };

    setGroups(prev => [...prev, newGroup]);
    
    return newGroup;
  };

  const joinGroup = async (code: string) => {
    if (!user || !code.trim()) return false;

    // 1. Find Group
    const { data: group, error } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', code)
      .single();

    if (error || !group) {
      alert('Invalid invite code');
      return false;
    }

    // 2. Join
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member'
      });

    if (joinError) {
      if (joinError.code === '23505') alert('You are already in this group'); // Unique violation
      else alert('Failed to join group');
      return false;
    }

    alert('Successfully joined group!');
    return true;
  };

  const inviteFriend = async (groupId: string, friendId: string) => {
    if (!user) return false;
    
    // Check if user is already in the group
    const { data: member } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', friendId)
      .single();
      
    if (member) {
      alert('User is already in this group.');
      return false;
    }
    
    // Check if invitation already exists
    const { data: existing } = await supabase
      .from('group_invitations')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('receiver_id', friendId)
      .single();
      
    if (existing) {
      if (existing.status === 'pending') alert('Invitation already sent.');
      else if (existing.status === 'accepted') alert('User already accepted.');
      else alert('Invitation was previously rejected.');
      return false;
    }
    
    // Send invitation
    const { error } = await supabase
      .from('group_invitations')
      .insert({
        group_id: groupId,
        sender_id: user.id,
        receiver_id: friendId,
        status: 'pending'
      });
      
    if (error) {
      console.error(error);
      alert('Failed to send invitation.');
      return false;
    }
    
    alert('Invitation sent successfully!');
    return true;
  };

  const acceptGroupRequest = async (requestId: string) => {
    if (!user) return;
    
    // Get the request details
    const { data: request } = await supabase
      .from('group_invitations')
      .select('group_id')
      .eq('id', requestId)
      .single();
      
    if (!request) return;
    
    // Update status
    await supabase
      .from('group_invitations')
      .update({ status: 'accepted' })
      .eq('id', requestId);
      
    // Join group
    await supabase
      .from('group_members')
      .insert({
        group_id: request.group_id,
        user_id: user.id,
        role: 'member'
      });
  };

  const rejectGroupRequest = async (requestId: string) => {
    await supabase
      .from('group_invitations')
      .update({ status: 'rejected' })
      .eq('id', requestId);
  };

  const getGroupEntries = (groupId: string) => {
    return groups.find(g => g.id === groupId)?.entries || [];
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);
      
    setGroups(prev => prev.filter(g => g.id !== groupId));
    if (currentGroupId === groupId) setCurrentGroupId(null);
  };

  const deleteGroup = async (groupId: string) => {
    await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);
      
    setGroups(prev => prev.filter(g => g.id !== groupId));
    if (currentGroupId === groupId) setCurrentGroupId(null);
  };

  return (
    <GroupContext.Provider value={{ 
      groups, 
      currentGroupId, 
      groupRequests,
      createGroup, 
      joinGroup, 
      inviteFriend,
      acceptGroupRequest,
      rejectGroupRequest,
      setCurrentGroupId,
      getGroupEntries,
      leaveGroup,
      deleteGroup
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}