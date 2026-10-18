import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCheck,
  Film,
  Image as ImageIcon,
  X,
  ExternalLink,
  User,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { ChatMessage, UserRole } from '../../types';

interface ChatMessageBubbleProps {
  msg: ChatMessage;
  isMine: boolean;
  themeColor?: 'cyan' | 'purple' | 'blue';
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  msg,
  isMine,
  themeColor = 'cyan',
}) => {
  const [showImageModal, setShowImageModal] = useState(false);

  // Gradient selection based on theme
  const myBubbleBg =
    themeColor === 'purple'
      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
      : themeColor === 'blue'
      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs'
      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs';

  const otherBubbleBg = 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs';

  return (
    <>
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}>
        {/* Sender Name & Role (for incoming messages) */}
        {!isMine && (
          <div className="flex items-center gap-1.5 px-1">
            {msg.senderPhotoURL ? (
              <img
                src={msg.senderPhotoURL}
                alt={msg.senderName}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-400 font-bold">
                {msg.senderName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[11px] font-bold text-slate-300">{msg.senderName}</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${
                msg.senderRole === 'teacher'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              {msg.senderRole}
            </span>
          </div>
        )}

        {/* Message Container */}
        <div
          className={`max-w-[85%] sm:max-w-md p-3 rounded-2xl text-xs space-y-2 shadow-md ${
            isMine ? myBubbleBg : otherBubbleBg
          }`}
        >
          {/* 1. Attachment: Photo / Image */}
          {msg.attachmentUrl && msg.attachmentType === 'image' && (
            <div className="rounded-xl overflow-hidden bg-black/40 border border-white/10 relative group">
              <img
                src={msg.attachmentUrl}
                alt={msg.attachmentName || 'Photo'}
                className="max-h-64 sm:max-h-80 w-full object-cover cursor-pointer hover:scale-[1.02] transition duration-200"
                onClick={() => setShowImageModal(true)}
              />
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => setShowImageModal(true)}
                  className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 text-[10px] backdrop-blur-sm flex items-center gap-1"
                  title="View Full Size"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* 2. Attachment: Video */}
          {msg.attachmentUrl && msg.attachmentType === 'video' && (
            <div className="rounded-xl overflow-hidden bg-black/60 border border-white/10 p-1">
              <video
                src={msg.attachmentUrl}
                controls
                playsInline
                preload="metadata"
                className="max-h-64 sm:max-h-72 w-full rounded-lg bg-black"
              >
                Your browser does not support the video tag.
              </video>
              {msg.attachmentName && (
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-slate-300 truncate">
                  <Film className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{msg.attachmentName}</span>
                </div>
              )}
            </div>
          )}

          {/* 3. Attachment: Document / PDF / File */}
          {msg.attachmentUrl && (msg.attachmentType === 'file' || msg.attachmentType === 'pdf') && (
            <div
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                isMine
                  ? 'bg-black/30 border-white/20 hover:bg-black/40'
                  : 'bg-slate-950/80 border-slate-700/80 hover:bg-slate-950'
              }`}
            >
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-white">
                  {msg.attachmentName || 'Document File'}
                </p>
                <p className="text-[10px] opacity-75">
                  {msg.attachmentSize ? `${(msg.attachmentSize / 1024).toFixed(1)} KB` : 'File Attachment'}
                </p>
              </div>
              <a
                href={msg.attachmentUrl}
                download={msg.attachmentName || 'download'}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition shrink-0 flex items-center gap-1 text-[11px] font-semibold"
                title="Download File"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Text Message */}
          {msg.text && (
            <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
          )}

          {/* Timestamp & Delivery status */}
          <div
            className={`text-[9px] flex items-center justify-end gap-1 ${
              isMine ? 'text-white/70' : 'text-slate-500'
            }`}
          >
            <span>
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {isMine && <CheckCheck className="w-3 h-3 text-emerald-300" />}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Preview Lightbox */}
      {showImageModal && msg.attachmentUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={msg.attachmentUrl}
              alt={msg.attachmentName || 'Full preview'}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
            />
            {msg.attachmentName && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-300">
                  {msg.attachmentName}
                </span>
                <a
                  href={msg.attachmentUrl}
                  download={msg.attachmentName}
                  className="px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
