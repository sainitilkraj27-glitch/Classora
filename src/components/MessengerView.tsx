import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Shield,
  ArrowLeft,
  Search,
  Lock,
  UserCheck,
} from 'lucide-react';
import { UserProfile, Conversation, ChatMessage } from '../types';
import {
  subscribeUserConversations,
  subscribeMessages,
  sendMessage,
} from '../lib/databaseService';
import { ChatMessageBubble } from './chat/ChatMessageBubble';
import { ChatComposer, ChatAttachment } from './chat/ChatComposer';

interface MessengerViewProps {
  currentUser: UserProfile;
  initialConversationId?: string | null;
  onBackToDashboard: () => void;
}

export const MessengerView: React.FC<MessengerViewProps> = ({
  currentUser,
  initialConversationId,
  onBackToDashboard,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to user's authorized conversations
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

  // Subscribe to active conversation messages
  useEffect(() => {
    if (!selectedConversation) return;
    const unsub = subscribeMessages(selectedConversation.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    return () => unsub();
  }, [selectedConversation?.id]);

  const handleSendMessage = async (text: string, attachment?: ChatAttachment) => {
    if (!selectedConversation || (!text.trim() && !attachment) || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(selectedConversation.id, currentUser, text, attachment);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const getConversationTitle = (conv: Conversation) => {
    if (conv.type === 'class_group') {
      return conv.className || 'Class Group Chat';
    }
    // Direct chat - display other participant name
    const otherUid = conv.participants.find((u) => u !== currentUser.uid);
    if (otherUid && conv.participantProfiles?.[otherUid]) {
      return conv.participantProfiles[otherUid].name || 'Direct Educational Chat';
    }
    return 'Direct Educational Chat';
  };

  const getConversationSubtitle = (conv: Conversation) => {
    if (conv.type === 'class_group') {
      return 'Authorized Class Group';
    }
    const otherUid = conv.participants.find((u) => u !== currentUser.uid);
    if (otherUid && conv.participantProfiles?.[otherUid]) {
      const prof = conv.participantProfiles[otherUid];
      return `${(prof.role || '').toUpperCase()} &bull; ID: ${prof.displayId || 'Student'}`;
    }
    return '';
  };

  const safeConversations = conversations || [];
  const filteredConversations = safeConversations.filter((c) =>
    (getConversationTitle(c) || '').toLowerCase().includes((searchFilter || '').toLowerCase())
  );

  const themeColor = currentUser.role === 'teacher' ? 'purple' : 'cyan';

  return (
    <div className="h-[calc(100vh-140px)] min-h-[500px] flex flex-col md:flex-row bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Conversations Sidebar */}
      <div className={`w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950/60 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> Authorized Messages
            </h3>
            <button
              onClick={onBackToDashboard}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 space-y-2">
              <Lock className="w-6 h-6 mx-auto text-slate-600" />
              <p>No active conversations.</p>
              <p className="text-[11px] text-slate-600">
                Connect with peers via 8-digit Student ID or join a class to initiate chats.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-3.5 text-left transition flex items-start gap-3 ${
                    isSelected ? 'bg-indigo-600/10 border-l-4 border-indigo-500' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                    {conv.type === 'class_group' ? <Users className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white truncate">
                        {getConversationTitle(conv)}
                      </h4>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-slate-500">
                          {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[11px] text-slate-400 mt-0.5"
                      dangerouslySetInnerHTML={{ __html: getConversationSubtitle(conv) }}
                    />
                    {conv.lastMessage && (
                      <p className="text-xs text-slate-400 truncate mt-1">
                        {conv.lastMessage.attachmentType
                          ? `[${conv.lastMessage.attachmentType.toUpperCase()}] ${conv.lastMessage.text || conv.lastMessage.attachmentName || ''}`
                          : conv.lastMessage.text}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation Chat Window */}
      <div className={`flex-1 flex flex-col bg-slate-900 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <>
            {/* Chat Top Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {getConversationTitle(selectedConversation)}
                  </h3>
                  <p
                    className="text-[11px] text-slate-400"
                    dangerouslySetInnerHTML={{ __html: getConversationSubtitle(selectedConversation) }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Authorized Connection</span>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-xs text-slate-500">
                  <Shield className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p>This is a secure educational message thread.</p>
                  <p>Send a message, photo, video, or document to begin.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id}
                    msg={msg}
                    isMine={msg.senderUid === currentUser.uid}
                    themeColor={themeColor}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box with Photo, Video, File, and Emoji */}
            <ChatComposer
              onSendMessage={handleSendMessage}
              isSending={isSending}
              placeholder="Type message, choose emoji, or attach media..."
              themeColor={themeColor}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-500 space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-700" />
            <p className="font-semibold text-slate-400">Select a conversation to start chatting</p>
            <p className="text-slate-600 max-w-xs">
              Chat privately with connected students or participate in your teacher's authorized class groups.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
