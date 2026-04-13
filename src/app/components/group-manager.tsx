import { useState } from 'react';
import { Users, Copy, Check, MoreVertical, LogOut, Trash2, UserPlus } from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import { useFriend } from '../context/FriendContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export function GroupManager() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { groups, createGroup, joinGroup, deleteGroup, leaveGroup, inviteFriend } = useGroup();
  const { friends } = useFriend();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [inputName, setInputName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [actionGroup, setActionGroup] = useState<{id: string, name: string, type: 'delete' | 'leave'} | null>(null);
  
  const [invitingGroupId, setInvitingGroupId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      createGroup(inputName);
      setInputName('');
      setIsCreating(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      joinGroup(inviteCode);
      setInviteCode('');
      setIsJoining(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirmAction = () => {
    if (actionGroup) {
      if (actionGroup.type === 'delete') {
        deleteGroup(actionGroup.id);
      } else {
        leaveGroup(actionGroup.id);
      }
      setActionGroup(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Users className="w-5 h-5 text-purple-500" />
          {t('groups.title')}
        </h2>
        <div className="flex gap-2 text-xs">
          <button 
            onClick={() => { setIsJoining(true); setIsCreating(false); }}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('groups.join')}
          </button>
          <span className="text-gray-300">|</span>
          <button 
            onClick={() => { setIsCreating(true); setIsJoining(false); }}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('groups.create')}
          </button>
        </div>
      </div>

      {/* Group List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        <button
          onClick={() => setCurrentGroupId(null)}
          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all border ${
            currentGroupId === null
              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 shadow-sm'
              : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
          }`}
        >
          <span className="font-medium">🔒 {t('groups.private')}</span>
          {currentGroupId === null && <Check className="w-4 h-4" />}
        </button>

        {groups.map(group => {
           const isOwner = group.members.find(m => m.id === user?.id)?.role === 'owner';

           return (
            <div
              key={group.id}
              className={`relative group/item w-full flex flex-col p-3 rounded-xl text-left transition-all border ${
                currentGroupId === group.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setCurrentGroupId(group.id)}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                  {group.name}
                </span>
                
                <div className="flex items-center gap-2">
                  {currentGroupId === group.id && <Check className="w-4 h-4" />}
                  
                  {/* Menu Trigger */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem 
                        className="text-xs cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInvitingGroupId(group.id);
                        }}
                      >
                        <UserPlus className="w-3 h-3 mr-2" />
                        {t('groups.invite', '邀请好友')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-xs text-red-600 focus:text-red-600 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionGroup({ id: group.id, name: group.name, type: isOwner ? 'delete' : 'leave' });
                        }}
                      >
                        {isOwner ? (
                          <>
                            <Trash2 className="w-3 h-3 mr-2" />
                            {t('groups.delete')}
                          </>
                        ) : (
                          <>
                            <LogOut className="w-3 h-3 mr-2" />
                            {t('groups.leave')}
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="flex items-center justify-between w-full">
                <div className="flex -space-x-2">
                  {group.members.slice(0, 3).map(member => (
                    <div key={member.id} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 overflow-hidden" title={member.name}>
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 font-bold">
                          {member.name[0]}
                        </div>
                      )}
                    </div>
                  ))}
                  {group.members.length > 3 && (
                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 flex items-center justify-center text-[10px] text-gray-500">
                      +{group.members.length - 3}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(group.inviteCode);
                  }}
                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md transition-colors"
                >
                  {copiedCode === group.inviteCode ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {group.inviteCode}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Join Forms */}
      {(isCreating || isJoining) && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2">
          {isCreating ? (
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder={t('groups.create') + " (e.g. Hiking Club)"}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!inputName.trim()}
                  className="flex-1 px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {t('groups.create')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder={t('groups.inviteCode')}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoining(false)}
                  className="flex-1 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!inviteCode.trim()}
                  className="flex-1 px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {t('groups.join')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <AlertDialog open={!!actionGroup} onOpenChange={() => setActionGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionGroup?.type === 'delete' ? t('groups.delete') : t('groups.leave')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionGroup?.type === 'delete' 
                ? t('groups.confirmDelete')
                : t('groups.confirmLeave')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionGroup?.type === 'delete' ? t('common.delete') : t('groups.leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Friend Modal */}
      <AlertDialog open={!!invitingGroupId} onOpenChange={() => setInvitingGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('groups.inviteFriendTitle', '邀请好友加入群组')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('groups.inviteFriendDesc', '选择你想邀请的好友：')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2 py-4">
            {friends.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">{t('groups.noFriends', '你还没有好友，先去添加好友吧。')}</p>
            ) : (
              friends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">{friend.name[0]}</div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{friend.name}</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (invitingGroupId) {
                        const success = await inviteFriend(invitingGroupId, friend.id);
                        if (success) {
                          setInvitingGroupId(null);
                        }
                      }
                    }}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 text-xs rounded-md transition-colors"
                  >
                    {t('groups.inviteBtn', '邀请')}
                  </button>
                </div>
              ))
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.close', '关闭')}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}