import React, { useState } from 'react';
import {
  User,
  Mail,
  Copy,
  Check,
  BookOpen,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Edit3,
  Trash2,
  AlertTriangle,
  MessageSquare,
  Shield,
  Share2,
  Download,
} from 'lucide-react';
import { UserProfile, Group, Course } from '../../types';
import { deleteUserAccountAndData } from '../../lib/databaseService';
import { ShareAppModal } from '../common/ShareAppModal';

interface StudentProfileViewProps {
  userProfile: UserProfile;
  groups?: Group[];
  courses?: Course[];
  onOpenEditProfile: () => void;
  onOpenSettings?: () => void;
  onNavigateToGroups: () => void;
  onNavigateToCourses: () => void;
  onNavigateToMessages: () => void;
  onLogout: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  userProfile,
  groups = [],
  courses = [],
  onOpenEditProfile,
  onOpenSettings,
  onNavigateToGroups,
  onNavigateToCourses,
  onNavigateToMessages,
  onLogout,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const studentId = userProfile.studentId || userProfile.uid.slice(0, 8).toUpperCase();

  const handleCopyId = () => {
    navigator.clipboard.writeText(studentId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') return;
    setIsDeleting(true);
    try {
      await deleteUserAccountAndData(userProfile);
      setShowDeleteModal(false);
      onLogout();
    } catch (err) {
      console.error('Error deleting student account:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto">
      {/* Top Heading */}
      <div className="pt-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Student Profile</h1>
          <p className="text-xs text-slate-400">Identity, enrolled groups & account</p>
        </div>

        <button
          onClick={onOpenEditProfile}
          className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/40 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>

      {/* Main Profile Identity Card */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-4 text-center relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Profile Photo */}
        <div className="relative inline-block">
          {userProfile.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt={userProfile.name}
              className="w-20 h-20 rounded-3xl border-2 border-cyan-500/40 object-cover mx-auto shadow-md"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-2xl text-white mx-auto shadow-lg shadow-cyan-950/50">
              {userProfile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold uppercase tracking-wider">
            Student
          </span>
        </div>

        {/* Name & Details */}
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-white tracking-tight">
            {userProfile.name}
          </h2>

          {/* 8-Digit Student ID with Copy Button */}
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-xl border border-cyan-500/20">
              ID: {studentId}
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

        {/* Mini stats preview */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
          <div
            onClick={onNavigateToGroups}
            className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-cyan-500/30 transition"
          >
            <span className="text-sm font-bold text-white block">{groups.length}</span>
            <span className="text-[10px] text-slate-400">Enrolled Groups</span>
          </div>
          <div
            onClick={onNavigateToCourses}
            className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-cyan-500/30 transition"
          >
            <span className="text-sm font-bold text-cyan-300 block">{courses.length}</span>
            <span className="text-[10px] text-slate-400">Courses & Notes</span>
          </div>
        </div>
      </div>

      {/* Navigation Action Links */}
      <div className="p-2 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1">
        {/* My Groups */}
        <div
          onClick={onNavigateToGroups}
          className="p-3 rounded-2xl hover:bg-slate-800/70 transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">My Groups</p>
              <p className="text-[10px] text-slate-400">{groups.length} class groups</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
        </div>

        {/* Courses & Materials */}
        <div
          onClick={onNavigateToCourses}
          className="p-3 rounded-2xl hover:bg-slate-800/70 transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Study Materials</p>
              <p className="text-[10px] text-slate-400">{courses.length} courses</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
        </div>

        {/* Direct Messages */}
        <div
          onClick={onNavigateToMessages}
          className="p-3 rounded-2xl hover:bg-slate-800/70 transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Messages</p>
              <p className="text-[10px] text-slate-400">Direct chat with teachers</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
        </div>

        {/* Security & Access */}
        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-white">Verified Student Account</p>
              <p className="text-[10px] text-slate-400">Unique ID: {studentId}</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
            Active
          </span>
        </div>
      </div>

      {/* Share App & Download Feature Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-purple-950/40 border border-cyan-500/30 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Share App & Download</h3>
              <p className="text-[10px] text-slate-300">Invite friends or install app on mobile</p>
            </div>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            PWA Mobile
          </span>
        </div>

        <button
          type="button"
          id="student-share-app-btn"
          onClick={() => setShowShareModal(true)}
          className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-cyan-950/50"
        >
          <Download className="w-4 h-4" />
          <span>Share Link / Download QR</span>
        </button>
      </div>

      {/* Account Actions: Logout & Delete Account */}
      <div className="space-y-2 pt-1">
        <button
          id="student-profile-logout-btn"
          onClick={onLogout}
          className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm"
        >
          <LogOut className="w-4 h-4 text-slate-400" /> Log Out
        </button>

        <button
          id="student-profile-delete-account-btn"
          onClick={() => setShowDeleteModal(true)}
          className="w-full py-2.5 px-4 rounded-2xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-xs font-semibold tracking-wide transition flex items-center justify-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete Student Account
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 w-fit">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Delete Student Account?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will permanently delete your student profile, remove you from all enrolled groups & courses, and erase all your messages and account data. This action cannot be undone.
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 uppercase font-bold tracking-wider"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.toLowerCase() !== 'delete' || isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-40 shadow-lg shadow-rose-950/50"
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
