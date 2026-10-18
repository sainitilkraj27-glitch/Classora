import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Users,
  UserPlus,
  Check,
  X,
  Send,
  ArrowLeft,
  Sparkles,
  User,
  Shield,
  Phone,
  Video,
  Lock,
  Megaphone,
  ChevronRight,
} from 'lucide-react';
import {
  UserProfile,
  Conversation,
  ChatMessage,
  ConnectionRequest,
  Connection,
  Group,
} from '../../types';
import {
  subscribeUserConversations,
  subscribeMessages,
  sendMessage,
  subscribeConnectionRequests,
  subscribeStudentConnections,
  searchStudentById,
  sendConnectionRequest,
  respondToConnectionRequest,
  subscribeGroup,
} from '../../lib/databaseService';
import { ChatMessageBubble } from '../chat/ChatMessageBubble';
import { ChatComposer, ChatAttachment } from '../chat/ChatComposer';
import { GroupInfoSettingsModal } from '../chat/GroupInfoSettingsModal';
import { useCall } from '../../context/CallContext';
import confetti from 'canvas-confetti';

interface StudentMessagesViewProps {
  currentUser: UserProfile;
  initialConversationId?: string | null;
}

export const StudentMessagesView: React.FC<StudentMessagesViewProps> = ({
  currentUser,
  initialConversationId,
}) => {
  const { startCall } = useCall();
  const [activeTab, setActiveTab] = useState<'CHATS' | 'CONNECTIONS'>('CHATS');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleInitiateCall = (callType: 'audio' | 'video') => {
    if (!selectedConversation) return;
    if (selectedConversation.type === 'class_group') {
      startCall({
        targetUser: {
          uid: 'group_' + selectedConversation.id,
          name: selectedConversation.className || 'Group Room',
          role: 'student',
        },
        callType,
        groupId: selectedConversation.id,
        groupName: selectedConversation.className,
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
        name: profile?.name || 'Classmate',
        photoURL: profile?.photoURL,
        role: profile?.role || 'student',
        studentId: profile?.displayId,
      },
      callType,
      conversationId: selectedConversation.id,
    });
  };

  // Attachment state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<{
    url: string;
    type: 'image' | 'file';
    name: string;
    size: number;
  } | null>(null);

  // Connections & Search state
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [searchIdQuery, setSearchIdQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{
    uid: string;
    studentId: string;
    name: string;
    photoURL?: string;
  } | null>(null);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  // 1. Subscribe to User's Conversations
  useEffect(() => {
    const unsub = subscribeUserConversations(currentUser.uid, (data) => {
      setConversations(data);
      if (initialConversationId && !selectedConversation) {
        const target = data.find((c) => c.id === initialConversationId);
        if (target) setSelectedConversation(target);
      }
    });
    return () => unsub();
  }, [currentUser.uid, initialConversationId]);

  // 2. Subscribe to Active Conversation Messages
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    const unsub = subscribeMessages(selectedConversation.id, (data) => {
      setMessages(data);
    });
    return () => unsub();
  }, [selectedConversation?.id]);

  // 3. Subscribe to Connections and Requests
  useEffect(() => {
    const unsubReq = subscribeConnectionRequests(currentUser.uid, (data) => {
      setPendingRequests(data);
    });
    const unsubConn = subscribeStudentConnections(currentUser.uid, (data) => {
      setConnections(data);
    });
    return () => {
      unsubReq();
      unsubConn();
    };
  }, [currentUser.uid]);

  // Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const isImage = file.type.startsWith('image/');
      setAttachmentPreview({
        url: reader.result as string,
        type: isImage ? 'image' : 'file',
        name: file.name,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Search Student by 8-Digit ID
  const handleSearchStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = searchIdQuery.trim();
    if (cleanId.length !== 8) {
      setSearchFeedback({ text: 'Please enter a valid 8-digit Student ID.', error: true });
      return;
    }

    if (cleanId === currentUser.studentId) {
      setSearchFeedback({ text: 'This is your own Student ID.', error: true });
      return;
    }

    setIsSearching(true);
    setSearchFeedback(null);
    setSearchResult(null);
    setSearchNotFound(false);

    try {
      const res = await searchStudentById(cleanId);
      if (res) {
        setSearchResult(res);
      } else {
        setSearchNotFound(true);
      }
    } catch (err) {
      console.error('Error searching student:', err);
      setSearchNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendConnectionRequest = async () => {
    if (!searchResult) return;
    try {
      const res = await sendConnectionRequest(currentUser, searchResult);
      if (res.success) {
        confetti({ particleCount: 60, spread: 60 });
        setSearchFeedback({ text: 'Connection request sent successfully.' });
        setSearchResult(null);
        setSearchIdQuery('');
      } else {
        setSearchFeedback({ text: res.message, error: true });
      }
    } catch (err: any) {
      setSearchFeedback({ text: err.message || 'Failed to send request.', error: true });
    }
  };

  const handleRespondRequest = async (request: ConnectionRequest, accept: boolean) => {
    try {
      await respondToConnectionRequest(request, accept);
      if (accept) {
        confetti({ particleCount: 70, spread: 70 });
      }
    } catch (err) {
      console.error('Error responding to request:', err);
    }
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

  // Helper to get conversation display name
  const activeGroupId =
    selectedConversation?.type === 'class_group'
      ? selectedConversation.classId || selectedConversation.id.replace('class_group_', '')
      : null;

  const [activeGroupData, setActiveGroupData] = useState<Group | null>(null);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

  // Live subscribe to Group document
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

  const getConversationTitle = (c: Conversation) => {
    if (c.type === 'class_group') {
      if (activeGroupData && c.id === selectedConversation?.id && activeGroupData.name) {
        return activeGroupData.name;
      }
      return c.className || 'Class Group';
    }
    const otherUid = c.participants.find((p) => p !== currentUser.uid);
    if (otherUid && c.participantProfiles?.[otherUid]) {
      return c.participantProfiles[otherUid].name || 'Direct Chat';
    }
    return 'Chat';
  };

  const getConversationSubtitle = (c: Conversation) => {
    if (c.type === 'class_group') return 'Tap for group info & members';
    const otherUid = c.participants.find((p) => p !== currentUser.uid);
    if (otherUid && c.participantProfiles?.[otherUid]) {
      return c.participantProfiles[otherUid].role === 'teacher' ? 'Faculty Teacher' : 'Student Classmate';
    }
    return 'Direct Message';
  };

  // Group permission checks for student
  const onlyTeachersCanSend = Boolean(
    activeGroupData?.settings?.onlyTeachersCanSend ||
      activeGroupData?.settings?.onlyAdminCanPost ||
      activeGroupData?.settings?.allowStudentChat === false
  );
  const isStudentMutedByTeacher = Boolean(
    activeGroupData?.settings?.mutedStudentUids?.includes(currentUser.uid)
  );

  const groupTheme = activeGroupData?.theme || activeGroupData?.settings?.theme || 'whatsapp';
  const themeBgClasses: Record<string, string> = {
    whatsapp: 'bg-[#0b141a]',
    dark: 'bg-slate-950',
    indigo: 'bg-[#0c081d]',
    sunset: 'bg-[#150a04]',
    cyberpunk: 'bg-[#12031a]',
  };
  const currentThemeBg = selectedConversation?.type === 'class_group' ? themeBgClasses[groupTheme] || 'bg-slate-950' : 'bg-slate-950';

  // If a conversation is actively open -> Show full-screen WhatsApp-Style Chat View
  if (selectedConversation) {
    return (
      <div className={`flex flex-col h-[calc(100vh-140px)] ${currentThemeBg} border border-slate-800 rounded-3xl overflow-hidden shadow-2xl`}>
        {/* WhatsApp-Style Chat Top Header */}
        <div className="p-3 sm:p-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shadow-md">
          {/* Left: DP + Title (Tappable for Group Info) */}
          <div
            onClick={() => selectedConversation.type === 'class_group' && setIsGroupSettingsOpen(true)}
            className={`flex items-center gap-3 cursor-pointer group rounded-2xl p-1 transition ${
              selectedConversation.type === 'class_group' ? 'hover:bg-slate-800/40' : ''
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedConversation(null);
              }}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Avatar (DP) */}
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0 overflow-hidden shadow">
              {selectedConversation.type === 'class_group' ? (
                activeGroupData?.photoURL ? (
                  <img
                    src={activeGroupData.photoURL}
                    alt="Group DP"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Users className="w-5 h-5 text-cyan-400" />
                )
              ) : (
                <User className="w-5 h-5 text-cyan-300" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 truncate group-hover:text-cyan-400 transition">
                {getConversationTitle(selectedConversation)}
                {selectedConversation.type === 'class_group' && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                    Group
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-slate-400 truncate">
                {getConversationSubtitle(selectedConversation)}
              </p>
            </div>
          </div>

          {/* Call Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              id="student-audio-call-btn"
              onClick={() => handleInitiateCall('audio')}
              className="p-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold"
              title="Voice Call"
            >
              <Phone className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Voice Call</span>
            </button>

            <button
              id="student-video-call-btn"
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
                title="Group Info & Members"
              >
                <Users className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pinned Group Announcement Banner */}
        {selectedConversation.type === 'class_group' && activeGroupData?.announcement && (
          <div className="bg-cyan-950/70 border-b border-cyan-500/30 px-4 py-2 flex items-center gap-2 text-xs text-cyan-200">
            <Megaphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate flex-1 font-medium">
              <strong>Announcement:</strong> {activeGroupData.announcement}
            </span>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-400">No messages yet.</p>
              <p className="text-[11px]">Send a message, photo, video, or document to begin!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                msg={msg}
                isMine={msg.senderUid === currentUser.uid}
                themeColor={groupTheme === 'whatsapp' ? 'emerald' : 'cyan'}
              />
            ))
          )}
        </div>

        {/* Bottom Area: Locked vs Active Composer */}
        {selectedConversation.type === 'class_group' && onlyTeachersCanSend ? (
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 text-center flex items-center justify-center gap-2 text-xs text-rose-300 font-semibold shadow-inner">
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Only teachers can send messages in this group (Announcement Only Mode).</span>
          </div>
        ) : selectedConversation.type === 'class_group' && isStudentMutedByTeacher ? (
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 text-center flex items-center justify-center gap-2 text-xs text-amber-300 font-semibold shadow-inner">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Your messaging in this group has been restricted by the teacher.</span>
          </div>
        ) : (
          <ChatComposer
            onSendMessage={handleSendMessage}
            isSending={isSending}
            placeholder="Type message, choose emoji, or attach media..."
            themeColor={groupTheme === 'whatsapp' ? 'emerald' : 'cyan'}
          />
        )}

        {/* WhatsApp Group Info Modal */}
        {activeGroupId && (
          <GroupInfoSettingsModal
            groupId={activeGroupId}
            currentUser={currentUser}
            isOpen={isGroupSettingsOpen}
            onClose={() => setIsGroupSettingsOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Messages</h1>
          <p className="text-xs text-slate-400">Class groups & verified connections</p>
        </div>

        {/* Top Tabs: Chats vs Connections */}
        <div className="flex rounded-2xl bg-slate-900 p-1 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('CHATS')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'CHATS'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chats ({conversations.length})
          </button>
          <button
            onClick={() => setActiveTab('CONNECTIONS')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'CONNECTIONS'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Find Peers
            {pendingRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'CHATS' ? (
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No conversations yet.</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Connect with classmates using their 8-digit Student ID or join class discussions.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('CONNECTIONS')}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-md"
              >
                Search Classmates by ID
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => {
                const unread = conv.unreadCount?.[currentUser.uid] || 0;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-300 shrink-0">
                        {conv.type === 'class_group' ? (
                          <Users className="w-5 h-5" />
                        ) : (
                          (getConversationTitle(conv) || 'C').charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate">
                            {getConversationTitle(conv)}
                          </h4>
                          {conv.type === 'class_group' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-cyan-500/10 text-cyan-300">
                              Group
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {conv.lastMessage?.text || 'No messages yet'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {conv.lastMessage && (
                        <span className="text-[9px] text-slate-500 font-mono block">
                          {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {unread > 0 && (
                        <span className="mt-1 inline-block px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[9px]">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* CONNECTIONS & 8-DIGIT SEARCH TAB */
        <div className="space-y-4">
          {/* Search Box */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Find Peer by 8-Digit Student ID
              </h3>
            </div>

            <form onSubmit={handleSearchStudent} className="flex gap-2">
              <input
                type="text"
                maxLength={8}
                value={searchIdQuery}
                onChange={(e) => setSearchIdQuery(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 8-digit Student ID (e.g. 56987326)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isSearching || searchIdQuery.length !== 8}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition disabled:opacity-40"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {searchFeedback && (
              <p
                className={`text-xs ${
                  searchFeedback.error ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {searchFeedback.text}
              </p>
            )}

            {searchNotFound && (
              <p className="text-xs text-rose-400">
                No student found with ID {searchIdQuery}. Verify with your classmate.
              </p>
            )}

            {searchResult && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                    {(searchResult.name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{searchResult.name}</h4>
                    <p className="text-[10px] font-mono text-cyan-400">
                      ID: {searchResult.studentId}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSendConnectionRequest}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition"
                >
                  SEND CONNECTION REQUEST
                </button>
              </div>
            )}
          </div>

          {/* Pending Received Connection Requests */}
          {pendingRequests.length > 0 && (
            <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Pending Connection Requests ({pendingRequests.length})
              </h3>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{req.fromStudentName}</span>
                      <p className="text-[10px] font-mono text-slate-400">
                        ID: {req.fromStudentId}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespondRequest(req, true)}
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondRequest(req, false)}
                        className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected Peers List */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Verified Student Connections ({connections.length})
            </h3>
            {connections.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No connections yet. Send a request to begin chatting!
              </p>
            ) : (
              <div className="space-y-2">
                {connections.map((conn) => {
                  const peerName =
                    conn.user1Uid === currentUser.uid ? conn.user2Name : conn.user1Name;
                  const peerId =
                    conn.user1Uid === currentUser.uid ? conn.user2Id : conn.user1Id;
                  const peerUid =
                    conn.user1Uid === currentUser.uid ? conn.user2Uid : conn.user1Uid;
                  const peerPhoto =
                    conn.user1Uid === currentUser.uid ? conn.user2Photo : conn.user1Photo;

                  return (
                    <div
                      key={conn.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{peerName}</span>
                        <p className="text-[10px] font-mono text-cyan-400">
                          ID: {peerId}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            startCall({
                              targetUser: {
                                uid: peerUid,
                                name: peerName,
                                photoURL: peerPhoto,
                                role: 'student',
                                studentId: peerId,
                              },
                              callType: 'audio',
                            })
                          }
                          className="p-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-300 transition"
                          title="Voice Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() =>
                            startCall({
                              targetUser: {
                                uid: peerUid,
                                name: peerName,
                                photoURL: peerPhoto,
                                role: 'student',
                                studentId: peerId,
                              },
                              callType: 'video',
                            })
                          }
                          className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 transition"
                          title="Video Call"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 hidden sm:inline">
                          Connected
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
