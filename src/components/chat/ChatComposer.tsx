import React, { useState, useRef } from 'react';
import {
  Send,
  Image as ImageIcon,
  Film,
  Paperclip,
  Smile,
  X,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

export interface ChatAttachment {
  url: string;
  type: 'image' | 'video' | 'file' | 'pdf';
  name: string;
  size?: number;
}

interface ChatComposerProps {
  onSendMessage: (text: string, attachment?: ChatAttachment) => Promise<void> | void;
  isSending?: boolean;
  placeholder?: string;
  themeColor?: 'cyan' | 'purple' | 'blue';
}

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🎉', '👏', '📚', '💡', '💯', '🎓', '✨'];

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  isSending = false,
  placeholder = 'Type your message...',
  themeColor = 'cyan',
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'video' | 'file'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Limit to 5MB for fast real-time Firestore storage
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 5MB limit. Please choose a smaller file.`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      let finalType: 'image' | 'video' | 'file' | 'pdf' = type;
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        finalType = 'pdf';
      } else if (file.type.startsWith('video/')) {
        finalType = 'video';
      } else if (file.type.startsWith('image/')) {
        finalType = 'image';
      }

      setAttachment({
        url: reader.result as string,
        type: finalType,
        name: file.name,
        size: file.size,
      });
      setShowAttachMenu(false);
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read file. Please try again.');
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    textInputRef.current?.focus();
  };

  const handleQuickEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    textInputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputText.trim();
    if ((!cleanText && !attachment) || isSending) return;

    const attachmentToSend = attachment || undefined;
    setInputText('');
    setAttachment(null);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    setErrorMessage(null);

    await onSendMessage(cleanText, attachmentToSend);
  };

  // Color tokens
  const buttonActiveColor =
    themeColor === 'purple'
      ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-950/50'
      : themeColor === 'blue'
      ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/50'
      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950/50';

  const activeFocusBorder =
    themeColor === 'purple'
      ? 'focus:border-purple-500'
      : themeColor === 'blue'
      ? 'focus:border-blue-500'
      : 'focus:border-cyan-500';

  return (
    <div className="relative border-t border-slate-800 bg-slate-950/90 p-2.5 sm:p-3 space-y-2">
      {/* Hidden File Pickers */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleFileChange(e, 'image')}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={(e) => handleFileChange(e, 'video')}
        accept="video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e, 'file')}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
        className="hidden"
      />

      {/* Error alert if file too big */}
      {errorMessage && (
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Attachment Preview Box */}
      {attachment && (
        <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-between gap-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3 min-w-0">
            {attachment.type === 'image' ? (
              <img
                src={attachment.url}
                alt="Selected"
                className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
              />
            ) : attachment.type === 'video' ? (
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
                <Film className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {attachment.type}
                </span>
                <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                  {attachment.name}
                </p>
              </div>
              {attachment.size && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {(attachment.size / 1024).toFixed(1)} KB &bull; Ready to send
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-2 sm:left-4 mb-2 z-50">
          <EmojiPicker
            onSelectEmoji={handleSelectEmoji}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Attach Media Actions Bar */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar pt-0.5">
        <div className="flex items-center gap-1">
          {/* Photos Button */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition shrink-0"
            title="Send Photo / Image from Gallery"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Photo</span>
          </button>

          {/* Videos Button */}
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition shrink-0"
            title="Send Video"
          >
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Video</span>
          </button>

          {/* Files / PDF Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition shrink-0"
            title="Send Document / PDF / File"
          >
            <Paperclip className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">File</span>
          </button>

          {/* Emoji Picker Toggle Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 shrink-0 ${
              showEmojiPicker
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-yellow-400 border-slate-800'
            }`}
            title="Choose Emojis"
          >
            <Smile className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden sm:inline">Emoji</span>
          </button>
        </div>

        {/* Quick Emojis strip */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {QUICK_EMOJIS.slice(0, 7).map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleQuickEmoji(emoji)}
              className="w-7 h-7 rounded-lg hover:bg-slate-800 hover:scale-125 transition text-sm flex items-center justify-center active:scale-95"
              title={`Add ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          ref={textInputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none ${activeFocusBorder} transition`}
        />
        <button
          type="submit"
          disabled={(!inputText.trim() && !attachment) || isSending}
          className={`p-2.5 sm:px-4 sm:py-2.5 rounded-2xl font-bold transition flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${buttonActiveColor}`}
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Send</span>
        </button>
      </form>
    </div>
  );
};
