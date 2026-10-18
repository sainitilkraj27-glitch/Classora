import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare,
  Users,
  User,
  Search,
  ArrowLeft,
  Phone,
  Video,
  Settings,
  Megaphone,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { UserProfile, Conversation, ChatMessage, Group } from '../../types';
import {
  subscribeUserConversations,
  subscribeMessages,
  sendMessage,
  subscribeGroup,
} from '../../lib/databaseService';
import { ChatMessageBubble } from '../chat/ChatMessageBubble';
import { ChatComposer, ChatAttachment } from '../chat/ChatComposer';
import { GroupInfoSettingsModal } from '../chat/GroupInfoSettingsModal';
import { useCall } from '../../context/CallContext';

interface TeacherMessagesViewProps {
  currentUser: UserProfile;
  initialConversationId?: string | null;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const TeacherMessagesView: React.FC<TeacherMessagesViewProps> = ({
  currentUser,
  initialConversationId,
}) => {
  const { startCall } = useCall();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeGroupData, setActiveGroupData] = useState<Group | null>(null);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to teacher's conversations
  useEffect(() => {
    const unsub = subscribeUserConversations(currentUser.uid, (data) => {
      setConversations(data);
      if (initialConversationId) {
        const found = data.find((c) => c.id === initialConversationId);
        if (found) setSelectedConversation(found);
      } else if (!selectedConversation && data.length > 0) {
        setSelectedConversation(data[0]);
      }
    });
    return () => unsub();
  }, [currentUser.uid, initialConversationId]);

  // Extract group id if class group
  const activeGroupId =
    selectedConversation?.type === 'class_group'
      ? selectedConversation.classId || selectedConversation.id.replace('class_group_', '')
      : null;

  // Live subscribe to active Group document for instant DP, theme, locks updates
  useEffect(() => {
    if (!activeGroupId) {
      setActiveGroupData(null);
      return;
    }
    const unsub = subscribeGroup(activeGroupId, (g) => {
      setActiveGroupData(g);
    });
    return () => unsub();
  }, [activeGroupId]);

  // Subscribe to selected conversation messages
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    const unsub = subscribeMessages(selectedConversation.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });
    return () => unsub();
  }, [selectedConversation?.id]);

  const handleInitiateCall = (callType: 'audio' | 'video') => {
    if (!selectedConversation) return;
    if (selectedConversation.type === 'class_group') {
      startCall({
        targetUser: {
          uid: 'group_' + selectedConversation.id,
          name: activeGroupData?.name || selectedConversation.className || 'Group Room',
          photoURL: activeGroupData?.photoURL,
          role: 'student',
        },
        callType,
        groupId: activeGroupId || selectedConversation.id,
        groupName: activeGroupData?.name || selectedConversation.className,
        conversationId: selectedConversation.id,
      });
      return;
    }

    const otherUid = selectedConversation.participants.find((u) => u !== currentUser.uid);
    if (!otherUid) return;
    const profile = selectedConversation.participantProfiles?.[otherUid];
    startCall({
      targetUser: {
        uid: otherUid,
        name: profile?.name || 'Student',
        photoURL: profile?.photoURL,
        role: profile?.role || 'student',
        studentId: profile?.displayId,
      },
      callType,
      conversationId: selectedConversation.id,
    });
  };

  const handleSendMessage = async (text: string, attachment?: ChatAttachment) => {
    if (!selectedConversation || (!text.trim() && !attachment) || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(selectedConversation.id, currentUser, text, attachment);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const getConvTitle = (conv: Conversation) => {
    if (conv.type === 'class_group') {
      if (activeGroupData && conv.id === selectedConversation?.id && activeGroupData.name) {
        return activeGroupData.name;
      }
      return conv.className || 'Class Group';
    }
    const otherUid = conv.participants.find((u) => u !== currentUser.uid);
    if (otherUid && conv.participantProfiles?.[otherUid]) {
      return conv.participantProfiles[otherUid].name || 'Direct Student Chat';
    }
    return 'Direct Student Chat';
  };

  const getConvSubtitle = (conv: Conversation) => {
    if (conv.type === 'class_group') {
      return 'Class Group • Tap for Settings';
    }
    const otherUid = conv.participants.find((u) => u !== currentUser.uid);
    if (otherUid && conv.participantProfiles?.[otherUid]) {
      const p = conv.participantProfiles[otherUid];
      return `Student • ID: ${p.displayId || 'Student'}`;
    }
    return 'Direct Chat';
  };

  const safeConversations = conversations || [];
  const filteredConversations = safeConversations.filter((c) =>
    (getConvTitle(c) || '').toLowerCase().includes((searchFilter || '').toLowerCase())
  );

  const groupTheme = activeGroupData?.theme || activeGroupData?.settings?.theme || 'whatsapp';

  const themeBgClasses: Record<string, string> = {
    whatsapp: 'bg-[#0b141a]',
    dark: 'bg-slate-950',
    indigo: 'bg-[#0c081d]',
    sunset: 'bg-[#150a04]',
    cyberpunk: 'bg-[#12031a]',
  };

  const currentThemeBg = themeBgClasses[groupTheme] || 'bg-slate-950';

  return (
    <div className="h-[calc(100vh-140px)] min-h-[500px] flex flex-col md:flex-row rounded-3xl bg-slate-900/90 border border-slate-800/80 overflow-hidden shadow-2xl pb-16 md:pb-0">
      {/* 1. Conversations List Column */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-800/80 bg-[#070913]/60 ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Messages</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
              {conversations.length}
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* List of Conversations */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              const isGroup = conv.type === 'class_group';
              const title = getConvTitle(conv);
              const subtitle = getConvSubtitle(conv);

              // Other profile photo for direct chat
              const otherUid = conv.participants.find((u) => u !== currentUser.uid);
              const directPhoto = otherUid ? conv.participantProfiles?.[otherUid]?.photoURL : null;

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3 rounded-2xl cursor-pointer transition flex items-center gap-3 ${
                    isSelected
                      ? 'bg-purple-950/40 border border-purple-500/30'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${
                      isGroup
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow'
                        : 'bg-slate-800 text-purple-300 border border-slate-700'
                    }`}
                  >
                    {isGroup ? (
                      activeGroupData && conv.id === selectedConversation?.id && activeGroupData.photoURL ? (
                        <img
                          src={activeGroupData.photoURL}
                          alt={title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Users className="w-5 h-5" />
                      )
                    ) : directPhoto ? (
                      <img
                        src={directPhoto}
                        alt={title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-xs text-white truncate">{title}</p>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {formatTimeAgo(conv.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {conv.lastMessage?.text || subtitle}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No conversations found.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Active Chat Area (WhatsApp-Style) */}
      <div
        className={`flex-1 flex flex-col ${currentThemeBg} ${
          !selectedConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedConversation ? (
          <>
            {/* WhatsApp-Style Top Header Banner */}
            <div className="p-3 sm:p-3.5 border-b border-slate-800/80 bg-slate-950/90 flex items-center justify-between shadow-md">
              {/* Left: DP + Title (Tappable for Group Settings) */}
              <div
                onClick={() => selectedConversation.type === 'class_group' && setIsGroupSettingsOpen(true)}
                className={`flex items-center gap-3 cursor-pointer group rounded-2xl p-1.5 transition ${
                  selectedConversation.type === 'class_group' ? 'hover:bg-slate-800/40' : ''
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConversation(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Group / User Avatar (DP) */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0 overflow-hidden shadow">
                    {selectedConversation.type === 'class_group' ? (
                      activeGroupData?.photoURL ? (
                        <img
                          src={activeGroupData.photoURL}
                          alt="Group DP"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-emerald-400" />
                      )
                    ) : (
                      <User className="w-5 h-5 text-purple-300" />
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-emerald-400 transition">
                      {getConvTitle(selectedConversation)}
                    </h3>
                    {selectedConversation.type === 'class_group' && (
                      <span className="text-[10px] text-slate-400 group-hover:text-emerald-300">
                        <ChevronRight className="w-3.5 h-3.5 inline" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-400 truncate">
                    {selectedConversation.type === 'class_group'
                      ? 'Tap here for group info & settings'
                      : getConvSubtitle(selectedConversation)}
                  </p>
                </div>
              </div>

              {/* Right: Calling & Settings Icons */}
              <div className="flex items-center gap-1.5">
                <button
                  id="teacher-audio-call-btn"
                  onClick={() => handleInitiateCall('audio')}
                  className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold"
                  title="Voice Call"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Voice Call</span>
                </button>

                <button
                  id="teacher-video-call-btn"
                  onClick={() => handleInitiateCall('video')}
                  className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold"
                  title="Video Call"
                >
                  <Video className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline">Video Call</span>
                </button>

                {selectedConversation.type === 'class_group' && (
                  <button
                    onClick={() => setIsGroupSettingsOpen(true)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title="Group Settings & DP"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Pinned Group Announcement Banner (if any) */}
            {selectedConversation.type === 'class_group' && activeGroupData?.announcement && (
              <div className="bg-purple-950/60 border-b border-purple-500/30 px-4 py-2 flex items-center gap-2 text-xs text-purple-200">
                <Megaphone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate flex-1 font-medium">
                  <strong>Announcement:</strong> {activeGroupData.announcement}
                </span>
              </div>
            )}

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-slate-500 text-xs">
                  <MessageSquare className="w-8 h-8 opacity-40" />
                  <p>No messages yet. Send a message, photo, video, or file to begin.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id}
                    msg={msg}
                    isMine={msg.senderUid === currentUser.uid}
                    themeColor={groupTheme === 'whatsapp' ? 'emerald' : 'purple'}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Input Bar */}
            <ChatComposer
              onSendMessage={handleSendMessage}
              isSending={isSending}
              placeholder="Type message, choose emoji, or attach photo/video/file..."
              themeColor={groupTheme === 'whatsapp' ? 'emerald' : 'purple'}
            />

            {/* WhatsApp Group Info & Settings Modal */}
            {activeGroupId && (
              <GroupInfoSettingsModal
                groupId={activeGroupId}
                currentUser={currentUser}
                isOpen={isGroupSettingsOpen}
                onClose={() => setIsGroupSettingsOpen(false)}
              />
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-400">
              <MessageSquare className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Select a conversation</p>
              <p className="text-xs text-slate-400 mt-1">
                Choose a student or class group to chat.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
