import React, { useState, useRef } from 'react';
import {
  User,
  Mail,
  Shield,
  BookOpen,
  LogOut,
  Bell,
  CheckCircle2,
  Lock,
  Phone,
  Sparkles,
  Copy,
  Check,
  Edit3,
  Settings,
  AlertTriangle,
  Trash2,
  Camera,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
  X,
  Share2,
  Download,
} from 'lucide-react';
import { UserProfile, ClassRoom } from '../../types';
import { updateUserProfile, deleteUserAccountAndData } from '../../lib/databaseService';
import { processImageFile } from '../../lib/imageUtils';
import confetti from 'canvas-confetti';
import { ShareAppModal } from '../common/ShareAppModal';

interface TeacherProfileViewProps {
  userProfile: UserProfile;
  classes: ClassRoom[];
  onLogout: () => void;
  onNavigateToClasses: () => void;
}

export const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({
  userProfile,
  classes,
  onLogout,
  onNavigateToClasses,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(userProfile.name);
  const [editPhoto, setEditPhoto] = useState(userProfile.photoURL || '');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setPhotoError('');

    try {
      const base64Photo = await processImageFile(file, 400, 400, 0.85);
      setEditPhoto(base64Photo);
    } catch (err: any) {
      console.error('Error processing image:', err);
      setPhotoError(err.message || 'Failed to process selected image.');
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setEditPhoto('');
  };

  // Settings & Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);

  const handleCopyId = () => {
    if (!userProfile.teacherId) return;
    navigator.clipboard.writeText(userProfile.teacherId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSaving(true);
    try {
      await updateUserProfile(userProfile.uid, {
        name: editName.trim(),
        photoURL: editPhoto.trim(),
      });
      confetti({ particleCount: 50, spread: 60 });
      setShowEditModal(false);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') return;
    setIsDeleting(true);
    try {
      await deleteUserAccountAndData(userProfile);
      onLogout();
    } catch (err) {
      console.error('Error deleting account:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto">
      {/* Header */}
      <div className="pt-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Faculty Profile</h1>
          <p className="text-xs text-slate-400">Institutional credentials & settings</p>
        </div>

        <button
          onClick={() => setShowEditModal(true)}
          className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-purple-400 hover:text-purple-300 hover:border-purple-500/40 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>

      {/* Main Profile Card */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl space-y-4 text-center relative overflow-hidden">
        <div className="relative inline-block">
          {userProfile.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt={userProfile.name}
              className="w-20 h-20 rounded-3xl border-2 border-purple-500/40 object-cover mx-auto shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-2xl text-white mx-auto shadow-lg shadow-purple-950/50">
              {userProfile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold uppercase tracking-wider">
            Teacher
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-white tracking-tight">
            {userProfile.name}
          </h2>

          {/* Teacher ID with Copy Button */}
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-xl border border-purple-500/20">
              ID: {userProfile.teacherId || 'TCH-0001'}
            </span>
            <button
              onClick={handleCopyId}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px] flex items-center gap-1 font-semibold"
              title="Copy ID"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px]">Copy</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 pt-1">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            {userProfile.email}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
          <div
            onClick={onNavigateToClasses}
            className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-purple-500/30 transition"
          >
            <span className="text-xl font-bold text-white block">{classes.length}</span>
            <span className="text-[10px] text-slate-400 font-medium">Assigned Classes</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-xl font-bold text-purple-300 block">{totalStudents}</span>
            <span className="text-[10px] text-slate-400 font-medium">Total Students</span>
          </div>
        </div>
      </div>

      {/* Settings & Info Card */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Faculty Security & Access
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-purple-400" />
              <div>
                <p className="font-semibold text-white">Verified Faculty Access</p>
                <p className="text-[10px] text-slate-400">Institutional code validated</p>
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="font-semibold text-white">Role & ID Protection</p>
                <p className="text-[10px] text-slate-400">Immutable system identity</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-purple-300 font-bold">Locked</span>
          </div>
        </div>
      </div>

      {/* Share App & Download Feature Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-cyan-950/40 border border-purple-500/30 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Share App & Download</h3>
              <p className="text-[10px] text-slate-300">Share with students or install on mobile</p>
            </div>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Mobile PWA
          </span>
        </div>

        <button
          type="button"
          id="teacher-share-app-btn"
          onClick={() => setShowShareModal(true)}
          className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-purple-950/50"
        >
          <Download className="w-4 h-4" />
          <span>Share Link / Download QR</span>
        </button>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          id="profile-logout-btn"
          onClick={onLogout}
          className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm"
        >
          <LogOut className="w-4 h-4 text-slate-400" /> Sign Out
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full py-2.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition flex items-center justify-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete Account
        </button>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-[#070913]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Faculty Profile</h3>
                  <p className="text-[11px] text-slate-400">Update photo & account details</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {photoError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {photoError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Photo Upload Section */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> Profile Photo
                  </label>
                  {editPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Avatar Preview */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group cursor-pointer shrink-0"
                    title="Click to choose from gallery"
                  >
                    {editPhoto ? (
                      <img
                        src={editPhoto}
                        alt="Avatar"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/50 shadow-md group-hover:opacity-80 transition"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:opacity-80 transition">
                        {editName.charAt(0).toUpperCase() || 'T'}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Camera className="w-5 h-5 text-white drop-shadow" />
                    </div>

                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-purple-500 text-white shadow">
                      <Camera className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />

                    <button
                      type="button"
                      id="teacher-choose-gallery-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingPhoto}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-purple-300 hover:text-purple-200 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
                    >
                      {isProcessingPhoto ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                          <span>Loading photo...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5 text-purple-400" />
                          <span>Choose from Gallery</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-400">
                      Pick from device gallery, camera or photos (JPG, PNG, WEBP).
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teacher ID</label>
                <input
                  type="text"
                  disabled
                  value={userProfile.teacherId || 'TCH-0001'}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-purple-300 cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isProcessingPhoto}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 w-fit">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Delete Faculty Account?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will permanently delete your account and erase <strong>all created classes, courses, study materials, live sessions, attendance records, and student rosters</strong>. This action cannot be undone.
              </p>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Type <strong className="text-white">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 uppercase"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.toLowerCase() !== 'delete' || isDeleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-40"
              >
                {isDeleting ? 'Deleting...' : 'DELETE ACCOUNT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share & Download App Modal */}
      {showShareModal && (
        <ShareAppModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          userProfile={userProfile}
        />
      )}
    </div>
  );
};
