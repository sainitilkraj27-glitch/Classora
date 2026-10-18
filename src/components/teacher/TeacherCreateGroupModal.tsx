import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  Image as ImageIcon,
  Camera,
  Upload,
  ShieldCheck,
  Loader2,
  Lock,
  Palette,
  Check,
} from 'lucide-react';
import { UserProfile, GroupSettings, GroupChatTheme } from '../../types';
import { createGroup } from '../../lib/databaseService';
import { readAndCompressImage } from '../../lib/imageHelper';

interface TeacherCreateGroupModalProps {
  isOpen?: boolean;
  onClose: () => void;
  teacher: UserProfile;
  onGroupCreated: (groupId: string) => void;
}

export const TeacherCreateGroupModal: React.FC<TeacherCreateGroupModalProps> = ({
  isOpen = true,
  onClose,
  teacher,
  onGroupCreated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [theme, setTheme] = useState<GroupChatTheme>('whatsapp');
  const [allowStudentChat, setAllowStudentChat] = useState(true);
  const [onlyAdminCanPost, setOnlyAdminCanPost] = useState(false);
  const [allowMediaSharing, setAllowMediaSharing] = useState(true);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingPhoto(true);
    try {
      const dataUrl = await readAndCompressImage(file, 512, 512, 0.85);
      setPhotoURL(dataUrl);
    } catch (err) {
      console.error(err);
      setError('Could not process selected image. Please choose another image.');
    } finally {
      setIsReadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a group name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const settings: GroupSettings = {
        allowStudentChat: !onlyAdminCanPost && allowStudentChat,
        onlyAdminCanPost,
        onlyTeachersCanSend: onlyAdminCanPost,
        allowMediaSharing,
        mutedStudentUids: [],
        theme,
      };

      const newGroupId = await createGroup(teacher, {
        name: name.trim(),
        description: description.trim(),
        photoURL: photoURL.trim(),
        theme,
        settings,
      });

      // Reset form
      setName('');
      setDescription('');
      setPhotoURL('');
      setAllowStudentChat(true);
      setOnlyAdminCanPost(false);
      setAllowMediaSharing(true);

      onGroupCreated(newGroupId);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 my-8 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create New Group</h3>
                <p className="text-xs text-slate-400">WhatsApp-style teacher controlled group</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Group DP Gallery Upload Centerpiece */}
            <div className="flex items-center gap-4 p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-purple-500/40 flex items-center justify-center overflow-hidden shrink-0">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt="Group Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Users className="w-7 h-7 text-purple-400" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-purple-600 text-white border-2 border-slate-900 shadow hover:bg-purple-500 transition"
                  title="Upload from Gallery"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white">Group Profile Picture (DP)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select a photo from your gallery or enter image URL.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isReadingPhoto}
                    className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                  >
                    {isReadingPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    <span>Gallery DP</span>
                  </button>

                  {photoURL && (
                    <button
                      type="button"
                      onClick={() => setPhotoURL('')}
                      className="text-[11px] text-rose-400 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleGalleryUpload}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Group Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Class 10 Physics / Science 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Group Description
              </label>
              <textarea
                rows={2}
                placeholder="Explain the purpose of this group for enrolled students..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
              />
            </div>

            {/* Chat Theme Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                Group Chat Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'whatsapp', name: 'WhatsApp Emerald', color: '#059669' },
                  { id: 'dark', name: 'Midnight Slate', color: '#334155' },
                  { id: 'indigo', name: 'Cyberpunk Violet', color: '#6366f1' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id as GroupChatTheme)}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                      theme === t.id
                        ? 'border-purple-500 bg-purple-950/40 text-white font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="truncate">{t.name}</span>
                    </span>
                    {theme === t.id && <Check className="w-3 h-3 text-purple-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Group Permissions & Settings */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Group Settings & Chat Controls:
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-rose-400" />
                    Only Teachers Can Send Messages
                  </div>
                  <div className="text-[11px] text-slate-400">Lock messaging for students (Announcement Mode)</div>
                </div>
                <input
                  type="checkbox"
                  checked={onlyAdminCanPost}
                  onChange={(e) => setOnlyAdminCanPost(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-700 bg-slate-900"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-200">Allow Media & PDF Attachments</div>
                  <div className="text-[11px] text-slate-400">Enable PDF, documents, and photo uploads</div>
                </div>
                <input
                  type="checkbox"
                  checked={allowMediaSharing}
                  onChange={(e) => setAllowMediaSharing(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-create-group-btn"
                disabled={isSubmitting || !name.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Group...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Create Group
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
