import React, { useState, useRef } from 'react';
import { X, User, Camera, Lock, Check, Image as ImageIcon, Trash2, Loader2, UploadCloud } from 'lucide-react';
import { UserProfile } from '../../types';
import { updateUserProfile } from '../../lib/databaseService';
import { processImageFile } from '../../lib/imageUtils';
import confetti from 'canvas-confetti';

interface StudentEditProfileModalProps {
  userProfile: UserProfile;
  onClose: () => void;
}

export const StudentEditProfileModal: React.FC<StudentEditProfileModalProps> = ({
  userProfile,
  onClose,
}) => {
  const [name, setName] = useState(userProfile.name);
  const [photoURL, setPhotoURL] = useState(userProfile.photoURL || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setErrorMsg('');

    try {
      const base64Photo = await processImageFile(file, 400, 400, 0.85);
      setPhotoURL(base64Photo);
    } catch (err: any) {
      console.error('Error processing image:', err);
      setErrorMsg(err.message || 'Failed to process selected image.');
    } finally {
      setIsProcessingPhoto(false);
      // Reset input value so same file can be re-selected if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoURL('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      await updateUserProfile(userProfile.uid, {
        name: name.trim(),
        photoURL: photoURL.trim(),
        phone: phone.trim(),
      });

      confetti({ particleCount: 50, spread: 60 });
      setSuccessMsg(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Edit Profile</h2>
              <p className="text-[11px] text-slate-400">Update photo & personal details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            Profile updated successfully!
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Gallery Photo Upload Section */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" /> Profile Photo
              </label>
              {photoURL && (
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
              {/* Avatar Clickable Preview */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer shrink-0"
                title="Click to choose from gallery"
              >
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt="Avatar"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-md group-hover:opacity-80 transition"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:opacity-80 transition">
                    {name.charAt(0).toUpperCase() || 'S'}
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <Camera className="w-5 h-5 text-white drop-shadow" />
                </div>

                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-cyan-500 text-slate-950 shadow">
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
                  id="student-choose-gallery-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingPhoto}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 hover:text-cyan-200 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
                >
                  {isProcessingPhoto ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      <span>Loading photo...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
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

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Email - Read-only Google account */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Email Address
              </label>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-500" /> Google Account
              </span>
            </div>
            <input
              type="email"
              disabled
              value={userProfile.email}
              className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Student ID - Strictly READ-ONLY */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                8-Digit Student ID
              </label>
              <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-cyan-500" /> System Permanent
              </span>
            </div>
            <input
              type="text"
              disabled
              value={userProfile.studentId || 'NOT ASSIGNED'}
              className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-cyan-300 cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              The 8-digit Student ID is institutional and permanent.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isProcessingPhoto}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-950/50 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
