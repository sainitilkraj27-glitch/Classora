import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Camera,
  Upload,
  Image as ImageIcon,
  Lock,
  Unlock,
  Users,
  Phone,
  Video,
  UserPlus,
  Trash2,
  Shield,
  ShieldAlert,
  Sparkles,
  Palette,
  Megaphone,
  Check,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Search,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Group, GroupMember, UserProfile, GroupChatTheme } from '../../types';
import {
  updateGroup,
  subscribeGroupMembers,
  subscribeGroup,
  toggleMuteStudentInGroup,
  removeStudentFromGroupByTeacher,
  addStudentToGroupByTeacher,
  searchStudentById,
  postGroupAnnouncement,
} from '../../lib/databaseService';
import { readAndCompressImage } from '../../lib/imageHelper';
import { useCall } from '../../context/CallContext';

interface GroupInfoSettingsModalProps {
  groupId: string;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { id: GroupChatTheme; name: string; color: string; bgStyle: string }[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Emerald',
    color: '#059669',
    bgStyle: 'from-[#062419] to-[#041610] border-emerald-500/40',
  },
  {
    id: 'dark',
    name: 'Midnight Slate',
    color: '#334155',
    bgStyle: 'from-slate-900 to-slate-950 border-slate-700/50',
  },
  {
    id: 'indigo',
    name: 'Cyberpunk Indigo',
    color: '#6366f1',
    bgStyle: 'from-[#140e2b] to-[#090518] border-indigo-500/40',
  },
  {
    id: 'sunset',
    name: 'Sunset Amber',
    color: '#f59e0b',
    bgStyle: 'from-[#2b1704] to-[#120902] border-amber-500/40',
  },
  {
    id: 'cyberpunk',
    name: 'Neon Violet',
    color: '#a855f7',
    bgStyle: 'from-[#22072e] to-[#0d0113] border-purple-500/40',
  },
];

export const GroupInfoSettingsModal: React.FC<GroupInfoSettingsModalProps> = ({
  groupId,
  currentUser,
  isOpen,
  onClose,
}) => {
  const { startCall } = useCall();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Edit states
  const [nameInput, setNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [announcementInput, setAnnouncementInput] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [generalSaveSuccess, setGeneralSaveSuccess] = useState(false);

  // Student search & add
  const [studentIdInput, setStudentIdInput] = useState('');
  const [searchedStudent, setSearchedStudent] = useState<UserProfile | null>(null);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [addMsg, setAddMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [memberFilter, setMemberFilter] = useState('');

  // Active section tab inside modal: 'INFO' | 'SETTINGS' | 'MEMBERS' | 'THEME'
  const [activeTab, setActiveTab] = useState<'INFO' | 'SETTINGS' | 'MEMBERS' | 'THEME'>('INFO');

  const isTeacher = currentUser.role === 'teacher' || currentUser.uid === group?.teacherUid;

  // 1. Subscribe to group document
  useEffect(() => {
    if (!groupId) return;
    const unsub = subscribeGroup(groupId, (data) => {
      if (data) {
        setGroup(data);
        setNameInput(data.name || '');
        setDescriptionInput(data.description || '');
        setAnnouncementInput(data.announcement || '');
        setPhotoPreview(data.photoURL || null);
      }
    });
    return () => unsub();
  }, [groupId]);

  // 2. Subscribe to members list
  useEffect(() => {
    if (!groupId) return;
    const unsub = subscribeGroupMembers(groupId, (list) => {
      setMembers(list);
      setLoadingMembers(false);
    });
    return () => unsub();
  }, [groupId]);

  // Handle Pick from Gallery
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const compressedDataUrl = await readAndCompressImage(file, 512, 512, 0.85);
      setPhotoPreview(compressedDataUrl);

      // If teacher, auto-save the DP to group
      if (isTeacher) {
        await updateGroup(groupId, { photoURL: compressedDataUrl });
        setGeneralSaveSuccess(true);
        setTimeout(() => setGeneralSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to read image from gallery:', err);
      alert('Could not read image from device gallery. Please try another image.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Toggle "Only Teachers Can Send Messages" (Locks messaging for all students)
  const handleToggleOnlyTeachersCanSend = async () => {
    if (!isTeacher || !group) return;
    const currentVal = Boolean(
      group.settings?.onlyTeachersCanSend ||
        group.settings?.onlyAdminCanPost ||
        group.settings?.allowStudentChat === false
    );
    const newVal = !currentVal;

    try {
      await updateGroup(groupId, {
        settings: {
          ...(group.settings || { allowStudentChat: true }),
          onlyTeachersCanSend: newVal,
          onlyAdminCanPost: newVal,
          allowStudentChat: !newVal,
        },
      });
    } catch (err: any) {
      console.error('Error updating settings:', err);
      alert(err.message || 'Failed to update group setting.');
    }
  };

  // Toggle Individual Student Mute / Chat Lock
  const handleToggleStudentMute = async (studentUid: string) => {
    if (!isTeacher || !group) return;
    const isMuted = group.settings?.mutedStudentUids?.includes(studentUid);
    try {
      await toggleMuteStudentInGroup(groupId, studentUid, !isMuted);
    } catch (err: any) {
      alert(err.message || 'Failed to update student chat permission.');
    }
  };

  // Toggle Media Sharing for students
  const handleToggleMediaSharing = async () => {
    if (!isTeacher || !group) return;
    const currentVal = group.settings?.allowMediaSharing !== false;
    try {
      await updateGroup(groupId, {
        settings: {
          ...(group.settings || { allowStudentChat: true }),
          allowMediaSharing: !currentVal,
          allowStudentMedia: !currentVal,
        },
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update media setting.');
    }
  };

  // Change Theme / Wallpaper
  const handleChangeTheme = async (theme: GroupChatTheme) => {
    if (!isTeacher || !group) return;
    try {
      await updateGroup(groupId, {
        theme,
        settings: {
          ...(group.settings || { allowStudentChat: true }),
          theme,
        },
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update theme.');
    }
  };

  // Save Name & Description
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTeacher || !nameInput.trim()) return;

    setIsSavingGeneral(true);
    try {
      await updateGroup(groupId, {
        name: nameInput.trim(),
        description: descriptionInput.trim(),
        photoURL: photoPreview || '',
      });
      if (announcementInput.trim() !== (group?.announcement || '')) {
        await postGroupAnnouncement(groupId, announcementInput.trim());
      }
      setGeneralSaveSuccess(true);
      setTimeout(() => setGeneralSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save group details.');
    } finally {
      setIsSavingGeneral(false);
    }
  };

  // Search student as teacher types 8-digit ID
  const handleStudentIdChange = async (val: string) => {
    setStudentIdInput(val);
    setAddMsg(null);
    const clean = val.trim();
    if (clean.length >= 6) {
      setIsSearchingStudent(true);
      try {
        const found = await searchStudentById(clean);
        setSearchedStudent(found);
      } catch (e) {
        setSearchedStudent(null);
      } finally {
        setIsSearchingStudent(false);
      }
    } else {
      setSearchedStudent(null);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim() || !isTeacher) return;

    setIsAddingStudent(true);
    setAddMsg(null);

    try {
      const res = await addStudentToGroupByTeacher(groupId, studentIdInput.trim(), currentUser);
      if (res.success) {
        setAddMsg({ type: 'success', text: res.message });
        setStudentIdInput('');
        setSearchedStudent(null);
        setTimeout(() => setAddMsg(null), 4000);
      } else {
        setAddMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setAddMsg({ type: 'error', text: err.message || 'Failed to add student.' });
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentUid: string, studentName: string) => {
    if (!isTeacher) return;
    if (window.confirm(`Are you sure you want to remove ${studentName} from this group?`)) {
      try {
        await removeStudentFromGroupByTeacher(groupId, studentUid);
      } catch (err: any) {
        alert(err.message || 'Failed to remove member.');
      }
    }
  };

  if (!isOpen) return null;

  const onlyTeachersCanSend = Boolean(
    group?.settings?.onlyTeachersCanSend ||
      group?.settings?.onlyAdminCanPost ||
      group?.settings?.allowStudentChat === false
  );
  const mutedStudentUids = group?.settings?.mutedStudentUids || [];
  const currentTheme = group?.theme || group?.settings?.theme || 'whatsapp';

  const filteredMembers = members.filter(
    (m) =>
      (m.studentName || '').toLowerCase().includes((memberFilter || '').toLowerCase()) ||
      (m.studentId || '').toLowerCase().includes((memberFilter || '').toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl text-slate-100 my-6 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* WhatsApp-Style Top Header Banner */}
          <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">
                  {group?.name || 'Group Info & Settings'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {members.length} members • {isTeacher ? 'Teacher Admin' : 'Student Member'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Tab Navigation */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950/50 px-3 pt-2 gap-1 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('INFO')}
              className={`px-3.5 py-2 rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'INFO'
                  ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Group Info & DP</span>
            </button>

            {isTeacher && (
              <button
                onClick={() => setActiveTab('SETTINGS')}
                className={`px-3.5 py-2 rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'SETTINGS'
                    ? 'bg-slate-900 text-purple-400 border-t-2 border-purple-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Chat Controls & Lock</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('MEMBERS')}
              className={`px-3.5 py-2 rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'MEMBERS'
                  ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members ({members.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('THEME')}
              className={`px-3.5 py-2 rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'THEME'
                  ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-500 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Wallpaper & Theme</span>
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Hidden File Input for Device Gallery DP Upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* TAB 1: GROUP INFO & DP GALLERY UPLOAD */}
            {activeTab === 'INFO' && (
              <div className="space-y-5">
                {/* DP Avatar Centerpiece */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 border border-slate-800 rounded-2xl relative">
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-emerald-600/30 via-slate-800 to-indigo-600/30 border-2 border-emerald-500/40 flex items-center justify-center overflow-hidden shadow-xl">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Group DP"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Users className="w-10 h-10 text-emerald-400" />
                      )}
                    </div>

                    {/* Teacher Upload Camera Badge */}
                    {isTeacher && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="absolute bottom-0 right-0 p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg border-2 border-slate-900 transition flex items-center justify-center"
                        title="Upload Group DP from Gallery"
                      >
                        {isUploadingPhoto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <h4 className="font-bold text-sm text-white">{group?.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Teacher: {group?.teacherName} • Created {new Date(group?.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Teacher Gallery Upload Buttons */}
                  {isTeacher && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select DP from Gallery</span>
                      </button>

                      {photoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview('');
                            if (isTeacher) updateGroup(groupId, { photoURL: '' });
                          }}
                          className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/20 transition"
                        >
                          Remove DP
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit Group Info Form (Teacher only, or Read-Only for student) */}
                <form onSubmit={handleSaveInfo} className="space-y-4">
                  {generalSaveSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Group settings and information saved successfully!</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      disabled={!isTeacher}
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter group name..."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-70 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Group Description
                    </label>
                    <textarea
                      rows={2}
                      disabled={!isTeacher}
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      placeholder="Add group description for students..."
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-70 transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5 text-purple-400" />
                      Pinned Announcement Banner
                    </label>
                    <textarea
                      rows={2}
                      disabled={!isTeacher}
                      value={announcementInput}
                      onChange={(e) => setAnnouncementInput(e.target.value)}
                      placeholder="Type a pinned announcement visible at the top of group chat..."
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 disabled:opacity-70 transition resize-none"
                    />
                  </div>

                  {isTeacher && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isSavingGeneral || !nameInput.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                      >
                        {isSavingGeneral ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* TAB 2: TEACHER CHAT CONTROLS & LOCK SETTINGS */}
            {activeTab === 'SETTINGS' && isTeacher && (
              <div className="space-y-4">
                <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl">
                  <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-purple-400" />
                    Teacher Admin Controls (WhatsApp-style Permissions)
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Control who can talk, send media, or manage group discussions.
                  </p>
                </div>

                {/* 1. Only Teacher Can Send Messages Toggle */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold text-white">
                        Only Teachers Can Send Messages
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      When enabled, students cannot send any messages in this group. Their message
                      input bar will be locked with an announcement notice.
                    </p>
                    {onlyTeachersCanSend && (
                      <span className="inline-block text-[10px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full mt-1 border border-rose-500/30">
                        🔒 Group Chat Locked for Students
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleOnlyTeachersCanSend}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      onlyTeachersCanSend ? 'bg-rose-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        onlyTeachersCanSend ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Allow Media Attachments Toggle */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">
                        Allow Student File & Media Sharing
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Allow enrolled students to attach pictures, PDF documents, and study notes in
                      the group chat.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleMediaSharing}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      group?.settings?.allowMediaSharing !== false ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        group?.settings?.allowMediaSharing !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Individual Muted Students Counter */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <VolumeX className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Individually Muted Students</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                      {mutedStudentUids.length} Restricted
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    You can lock or unlock any specific student from sending messages by clicking the
                    lock button next to their name in the Members tab.
                  </p>
                  <button
                    onClick={() => setActiveTab('MEMBERS')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline"
                  >
                    Go to Members List →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: MEMBERS LIST & INDIVIDUAL CHAT LOCK */}
            {activeTab === 'MEMBERS' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search enrolled members by name or student ID..."
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Add Student by 8-Digit ID (Teacher Only) */}
                {isTeacher && (
                  <div className="p-3.5 bg-slate-950/70 border border-cyan-500/30 rounded-2xl space-y-3">
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-cyan-400" />
                      Add Student by 8-Digit ID:
                    </div>

                    <form onSubmit={handleAddStudent} className="flex gap-2">
                      <input
                        type="text"
                        maxLength={8}
                        placeholder="Enter 8-digit Student ID..."
                        value={studentIdInput}
                        onChange={(e) => handleStudentIdChange(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isAddingStudent || !studentIdInput.trim()}
                        className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
                      >
                        {isAddingStudent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                        <span>Add</span>
                      </button>
                    </form>

                    {/* Live Student Preview */}
                    {searchedStudent && (
                      <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/40 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-cyan-600/30 flex items-center justify-center font-bold text-cyan-300">
                            {searchedStudent.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white">{searchedStudent.name}</div>
                            <div className="text-[10px] text-cyan-400 font-mono">ID: {searchedStudent.studentId}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold">Ready to enroll</span>
                      </div>
                    )}

                    {addMsg && (
                      <div
                        className={`p-2 rounded-xl text-xs ${
                          addMsg.type === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {addMsg.text}
                      </div>
                    )}
                  </div>
                )}

                {/* Member List */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {/* Teacher Admin Card */}
                  <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-bold text-purple-200 text-xs">
                        {group?.teacherName.charAt(0) || 'T'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {group?.teacherName}
                          <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 text-[9px] font-bold rounded-full border border-purple-500/30">
                            Teacher Admin
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">Group Creator</div>
                      </div>
                    </div>
                  </div>

                  {/* Student Members */}
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((m) => {
                      const isMuted = mutedStudentUids.includes(m.studentUid);

                      return (
                        <div
                          key={m.id}
                          className={`p-3 rounded-2xl border transition flex items-center justify-between gap-2 ${
                            isMuted
                              ? 'bg-rose-950/20 border-rose-500/30'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0 overflow-hidden">
                              {m.studentPhotoURL ? (
                                <img
                                  src={m.studentPhotoURL}
                                  alt={m.studentName}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                (m.studentName || 'S').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                                {m.studentName}
                                {m.studentUid === currentUser.uid && (
                                  <span className="text-[9px] text-cyan-400 font-semibold">(You)</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ID: {m.studentId}
                              </div>
                            </div>
                          </div>

                          {/* Member Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Direct Voice & Video Call */}
                            <button
                              onClick={() =>
                                startCall({
                                  targetUser: {
                                    uid: m.studentUid,
                                    name: m.studentName,
                                    photoURL: m.studentPhotoURL,
                                    role: 'student',
                                    studentId: m.studentId,
                                  },
                                  callType: 'audio',
                                  groupId: group?.id,
                                  groupName: group?.name,
                                })
                              }
                              className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 transition"
                              title="Voice Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() =>
                                startCall({
                                  targetUser: {
                                    uid: m.studentUid,
                                    name: m.studentName,
                                    photoURL: m.studentPhotoURL,
                                    role: 'student',
                                    studentId: m.studentId,
                                  },
                                  callType: 'video',
                                  groupId: group?.id,
                                  groupName: group?.name,
                                })
                              }
                              className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 transition"
                              title="Video Call"
                            >
                              <Video className="w-3.5 h-3.5" />
                            </button>

                            {/* Teacher Lock / Mute Chat Button for this student */}
                            {isTeacher && (
                              <button
                                onClick={() => handleToggleStudentMute(m.studentUid)}
                                className={`p-1.5 rounded-lg border transition flex items-center gap-1 text-[11px] font-semibold ${
                                  isMuted
                                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-amber-300 hover:bg-amber-500/10'
                                }`}
                                title={isMuted ? 'Unlock Student Chat (Allow Messages)' : 'Lock Student Chat (Mute Student)'}
                              >
                                {isMuted ? (
                                  <>
                                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                                    <span className="hidden sm:inline text-[10px]">Locked</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="hidden sm:inline text-[10px]">Lock</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Remove from Group */}
                            {isTeacher && (
                              <button
                                onClick={() => handleRemoveStudent(m.studentUid, m.studentName)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                                title="Remove Student from Group"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No matching students found in this group.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: GROUP CHAT THEME & WALLPAPER */}
            {activeTab === 'THEME' && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-amber-400" />
                    WhatsApp Group Theme & Wallpaper
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Select a theme to customize the background style of the group chat.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {THEME_OPTIONS.map((theme) => {
                    const isSelected = currentTheme === theme.id;

                    return (
                      <div
                        key={theme.id}
                        onClick={() => isTeacher && handleChangeTheme(theme.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition relative overflow-hidden bg-gradient-to-br ${
                          theme.bgStyle
                        } ${isSelected ? 'ring-2 ring-emerald-400 shadow-lg' : 'hover:opacity-90'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full border border-white/40"
                              style={{ backgroundColor: theme.color }}
                            />
                            <span className="text-xs font-bold text-white">{theme.name}</span>
                          </div>
                          {isSelected && (
                            <span className="p-1 rounded-full bg-emerald-500 text-slate-950">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        {/* Theme preview bubble pattern */}
                        <div className="mt-3 space-y-1.5 opacity-70 pointer-events-none">
                          <div className="w-3/4 h-3 rounded-full bg-white/20 ml-auto" />
                          <div className="w-2/3 h-3 rounded-full bg-white/10 mr-auto" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!isTeacher && (
                  <p className="text-[11px] text-slate-400 text-center">
                    Only teacher admins can change the group wallpaper theme.
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
