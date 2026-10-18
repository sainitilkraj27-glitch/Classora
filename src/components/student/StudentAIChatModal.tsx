import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Send, Bot, User, Clock } from 'lucide-react';
import { UserProfile, ClassSession, AIConversation } from '../../types';
import {
  subscribeStudentAIConversation,
  sendStudentAIMessage,
} from '../../lib/databaseService';

interface StudentAIChatModalProps {
  session: ClassSession;
  userProfile: UserProfile;
  onClose: () => void;
}

export const StudentAIChatModal: React.FC<StudentAIChatModalProps> = ({
  session,
  userProfile,
  onClose,
}) => {
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeStudentAIConversation(userProfile.uid, session.id, (data) => {
      setConversation(data);
    });
    return () => unsub();
  }, [userProfile.uid, session.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendStudentAIMessage(session, userProfile, text);
    } catch (err) {
      console.error('Error sending AI message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const defaultWelcomeMessage = `Hello ${userProfile.name}, your class "${session.className}" has started and your attendance has not been received yet. Are you joining today, or are you running late?`;

  const displayMessages =
    conversation?.messages && conversation.messages.length > 0
      ? conversation.messages
      : [{ role: 'assistant' as const, text: defaultWelcomeMessage, timestamp: Date.now() }];

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[520px] max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">AI Attendance Assistant</h2>
              <p className="text-[10px] text-slate-400">{session.className}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {displayMessages.map((msg, index) => {
            const isAI = msg.role === 'assistant';
            return (
              <div
                key={index}
                className={`flex gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {isAI && (
                  <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                    isAI
                      ? 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/60'
                      : 'bg-cyan-600 text-white rounded-tr-sm shadow-md'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="text-[9px] opacity-60 block mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-2 items-center text-xs text-slate-400 animate-pulse">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span>Processing reason...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. I will be 15 minutes late due to traffic..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
