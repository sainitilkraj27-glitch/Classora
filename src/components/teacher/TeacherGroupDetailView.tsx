import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  PhoneCall,
  MessageSquare,
  Megaphone,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Settings,
  X,
  Phone,
  Video,
  Camera,
  Upload,
  Lock,
  Unlock,
  Palette,
} from 'lucide-react';
import { Group, GroupMember, UserProfile } from '../../types';
import {
  subscribeGroupMembers,
  subscribeGroup,
  updateGroup,
  toggleMuteStudentInGroup,
  addStudentToGroupByTeacher,
  removeStudentFromGroupByTeacher,
  postGroupAnnouncement,
  deleteGroup,
  searchStudentById,
  getOrCreateTeacherStudentConversation,
  getOrCreateClassGroupConversation,
} from '../../lib/databaseService';
import { readAndCompressImage } from '../../lib/imageHelper';
import { TeacherAICallModal } from './TeacherAICallModal';
import { GroupInfoSettingsModal } from '../chat/GroupInfoSettingsModal';
import { useCall } from '../../context/CallContext';

interface TeacherGroupDetailViewProps {
  group: Group;
  teacher: UserProfile;
  onBack: () => void;
  onNavigateToMessages: (convId?: string) => void;
}

export const TeacherGroupDetailView: React.FC<TeacherGroupDetailViewProps> = ({
  group: initialGroup,
  teacher,
  onBack,
  onNavigateToMessages,
}) => {
  const { startCall } = useCall();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [group, setGroup] = useState<Group>(initialGroup);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadingDP, setIsUploadingDP] = useState(false);

  // Add student state
  const [studentIdInput, setStudentIdInput] = useState('');
  const [searchedStudent, setSearchedStudent] = useState<UserProfile | null>(null);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);
  const [addErrorMessage, setAddErrorMessage] = useState<string | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Announcement state
  const [announcementText, setAnnouncementText] = useState(group.announcement || '');
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  // AI Call modal state
  const [aiCallStudent, setAiCallStudent] = useState<{
    uid: string;
    studentId: string;
    name: string;
    phone?: string;
    photoURL?: string;
  } | null>(null);

  // Search filter for members
  const [memberFilter, setMemberFilter] = useState('');

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  // Subscribe to live group updates
  useEffect(() => {
    const unsub = subscribeGroup(initialGroup.id, (data) => {
      if (data) {
        setGroup(data);
        setAnnouncementText(data.announcement || '');
      }
    });
    return () => unsub();
  }, [initialGroup.id]);

  // Subscribe to group members
  useEffect(() => {
    const unsub = subscribeGroupMembers(group.id, (list) => {
      setMembers(list);
      setLoadingMembers(false);
    });
    return () => unsub();
  }, [group.id]);

  // Handle Pick DP from Device Gallery
  const handleGalleryDP = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDP(true);
    try {
      const dataUrl = await readAndCompressImage(file, 512, 512, 0.85);
      await updateGroup(group.id, { photoURL: dataUrl });
    } catch (err) {
      console.error(err);
      alert('Could not upload image from gallery. Please try again.');
    } finally {
      setIsUploadingDP(false);
    }
  };

  // Toggle Mute / Lock for individual student
  const handleToggleStudentLock = async (studentUid: string) => {
    const isMuted = group.settings?.mutedStudentUids?.includes(studentUid);
    try {
      await toggleMuteStudentInGroup(group.id, studentUid, !isMuted);
    } catch (err: any) {
      alert(err.message || 'Failed to update student chat permissions.');
    }
  };

  // Live lookup student by ID
  const handleStudentIdChange = async (val: string) => {
    setStudentIdInput(val);
    setAddErrorMessage(null);
    setAddSuccessMessage(null);

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
    if (!studentIdInput.trim()) return;

    setIsAddingStudent(true);
    setAddErrorMessage(null);
    setAddSuccessMessage(null);

    try {
      const res = await addStudentToGroupByTeacher(group.id, studentIdInput.trim(), teacher);
      if (res.success) {
        setAddSuccessMessage(res.message);
        setStudentIdInput('');
        setSearchedStudent(null);
        setTimeout(() => setAddSuccessMessage(null), 4000);
      } else {
        setAddErrorMessage(res.message);
      }
    } catch (err: any) {
      setAddErrorMessage(err.message || 'Failed to add student to group.');
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleRemoveMember = async (studentUid: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to remove ${studentName} from this group?`)) {
      try {
        await removeStudentFromGroupByTeacher(group.id, studentUid);
      } catch (err: any) {
        alert(err.message || 'Failed to remove member.');
      }
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPostingAnnouncement(true);
    try {
      await postGroupAnnouncement(group.id, announcementText);
      setAnnouncementSuccess(true);
      setTimeout(() => setAnnouncementSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to post announcement.');
    } finally {
      setIsPostingAnnouncement(false);
    }
  };

  const handleOpenGroupChat = async () => {
    try {
      const convId = await getOrCreateClassGroupConversation(group, teacher);
      onNavigateToMessages(convId);
    } catch (err) {
      console.error(err);
      onNavigateToMessages(`class_group_${group.id}`);
    }
  };

  const handleDirectChat = async (student: GroupMember) => {
    try {
      const convId = await getOrCreateTeacherStudentConversation(teacher, {
        uid: student.studentUid,
        name: student.studentName,
        photoURL: student.studentPhotoURL,
        studentId: student.studentId,
      });
      onNavigateToMessages(convId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGroup = async () => {
    setIsDeletingGroup(true);
    try {
      await deleteGroup(group.id);
      onBack();
    } catch (err: any) {
      alert(err.message || 'Failed to delete group.');
      setIsDeletingGroup(false);
    }
  };

  const mutedStudentUids = group.settings?.mutedStudentUids || [];
  const onlyTeachersCanSend = Boolean(
    group.settings?.onlyTeachersCanSend ||
      group.settings?.onlyAdminCanPost ||
      group.settings?.allowStudentChat === false
  );

  const filteredMembers = members.filter(
    (m) =>
      (m.studentName || '').toLowerCase().includes((memberFilter || '').toLowerCase()) ||
      (m.studentId || '').toLowerCase().includes((memberFilter || '').toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Hidden Gallery Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleGalleryDP}
      />

      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 shadow"
          >
            <Settings className="w-3.5 h-3.5 text-purple-400" />
            <span>Group Settings & DP</span>
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition border border-rose-500/20 text-xs flex items-center gap-1.5"
            title="Delete Group"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Group Hero Banner (WhatsApp-Style with Gallery DP Upload) */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#120f29] border border-purple-500/30 p-6 shadow-xl overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            {/* Clickable Group DP from Gallery */}
            <div className="relative group shrink-0">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-slate-800 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-2xl overflow-hidden shadow-xl cursor-pointer hover:opacity-90 transition"
                title="Tap to change Group DP from Gallery"
              >
                {group.photoURL ? (
                  <img
                    src={group.photoURL}
                    alt={group.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Users className="w-9 h-9 text-emerald-400" />
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingDP}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg border-2 border-slate-900 transition flex items-center justify-center"
                title="Upload Group DP from Gallery"
              >
                {isUploadingDP ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-white">{group.name}</h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  Teacher Admin
                </span>
                {onlyTeachersCanSend && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3 text-rose-400" /> Only Teacher Can Send
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-lg">
                {group.description || 'Teacher-controlled student group on Classora.'}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <Users className="w-3.5 h-3.5" /> {members.length} Enrolled Students
                </span>
                <span>• Teacher: {group.teacherName}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={handleOpenGroupChat}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Group Chat</span>
            </button>

            <div className="flex gap-1.5">
              <button
                onClick={() =>
                  startCall({
                    targetUser: {
                      uid: 'group_' + group.id,
                      name: group.name,
                      photoURL: group.photoURL,
                      role: 'student',
                    },
                    callType: 'audio',
                    groupId: group.id,
                    groupName: group.name,
                  })
                }
                className="flex-1 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition flex items-center justify-center gap-1"
                title="Group Voice Call"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call</span>
              </button>

              <button
                onClick={() =>
                  startCall({
                    targetUser: {
                      uid: 'group_' + group.id,
                      name: group.name,
                      photoURL: group.photoURL,
                      role: 'student',
                    },
                    callType: 'video',
                    groupId: group.id,
                    groupName: group.name,
                  })
                }
                className="flex-1 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition flex items-center justify-center gap-1"
                title="Group Video Call"
              >
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                <span>Video</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Group Announcement Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Group Announcement</h3>
              <p className="text-[11px] text-slate-400">Post updates pinned directly in the group chat</p>
            </div>
          </div>
          {announcementSuccess && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveAnnouncement} className="space-y-2">
          <textarea
            rows={2}
            placeholder="Type an announcement for all students in this group..."
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPostingAnnouncement}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              {isPostingAnnouncement ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Megaphone className="w-3.5 h-3.5" />}
              Publish Announcement
            </button>
          </div>
        </form>
      </div>

      {/* Add Student Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Add Student by 8-Digit ID</h3>
            <p className="text-[11px] text-slate-400">
              Enter the student's unique 8-digit Student ID to enroll them directly.
            </p>
          </div>
        </div>

        {addErrorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{addErrorMessage}</span>
          </div>
        )}

        {addSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{addSuccessMessage}</span>
          </div>
        )}

        <form onSubmit={handleAddStudent} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                maxLength={12}
                placeholder="Enter 8-digit Student ID (e.g. 84729103)"
                value={studentIdInput}
                onChange={(e) => handleStudentIdChange(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
              />
              {isSearchingStudent && (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3 top-3" />
              )}
            </div>

            <button
              type="submit"
              disabled={isAddingStudent || !studentIdInput.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/40 transition flex items-center justify-center gap-2"
            >
              {isAddingStudent ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Add to Group
            </button>
          </div>

          {/* Student Live Lookup Preview */}
          {searchedStudent && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
                  {(searchedStudent.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{searchedStudent.name}</div>
                  <div className="text-[11px] font-mono text-cyan-300">
                    ID: {searchedStudent.studentId || studentIdInput}
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-cyan-400 font-medium bg-cyan-900/50 px-2 py-0.5 rounded-lg border border-cyan-700/50">
                Verified Student
              </span>
            </div>
          )}
        </form>
      </div>

      {/* Group Members List with Chat Lock Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Group Students ({members.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Manage student chat locks, voice & video calls, and AI study tutor calls
            </p>
          </div>

          {/* Search filter within members */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search member by name/ID..."
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-full sm:w-56"
            />
          </div>
        </div>

        {loadingMembers ? (
          <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            Loading group members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p>
              {members.length === 0
                ? 'No students added to this group yet.'
                : 'No students match your search filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredMembers.map((member) => {
              const isMuted = mutedStudentUids.includes(member.studentUid);

              return (
                <div
                  key={member.id}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                    isMuted
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600/20 to-cyan-500/20 border border-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                      {member.studentPhotoURL ? (
                        <img
                          src={member.studentPhotoURL}
                          alt={member.studentName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        (member.studentName || 'S').charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        {member.studentName}
                        {isMuted && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Chat Locked
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                          ID: {member.studentId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Member Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Direct Voice Call */}
                    <button
                      onClick={() =>
                        startCall({
                          targetUser: {
                            uid: member.studentUid,
                            name: member.studentName,
                            photoURL: member.studentPhotoURL,
                            role: 'student',
                            studentId: member.studentId,
                          },
                          callType: 'audio',
                          groupId: group.id,
                          groupName: group.name,
                        })
                      }
                      className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 transition"
                      title="Voice Call Student"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>

                    {/* Direct Video Call */}
                    <button
                      onClick={() =>
                        startCall({
                          targetUser: {
                            uid: member.studentUid,
                            name: member.studentName,
                            photoURL: member.studentPhotoURL,
                            role: 'student',
                            studentId: member.studentId,
                          },
                          callType: 'video',
                          groupId: group.id,
                          groupName: group.name,
                        })
                      }
                      className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 transition"
                      title="Video Call Student"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>

                    {/* Lock / Mute Student Chat */}
                    <button
                      onClick={() => handleToggleStudentLock(member.studentUid)}
                      className={`p-2 rounded-xl border transition ${
                        isMuted
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-amber-300 hover:bg-amber-500/10'
                      }`}
                      title={isMuted ? 'Unlock Student Chat (Allow Messages)' : 'Lock Student Chat (Mute Student)'}
                    >
                      {isMuted ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    {/* AI Call Tutor */}
                    <button
                      onClick={() =>
                        setAiCallStudent({
                          uid: member.studentUid,
                          studentId: member.studentId,
                          name: member.studentName,
                          phone: member.studentPhone,
                          photoURL: member.studentPhotoURL,
                        })
                      }
                      className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 transition"
                      title="AI Tutor Call"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    {/* Remove Member */}
                    <button
                      onClick={() => handleRemoveMember(member.studentUid, member.studentName)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                      title="Remove Student from Group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WhatsApp Group Info & Settings Modal */}
      <GroupInfoSettingsModal
        groupId={group.id}
        currentUser={teacher}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* AI Call Modal */}
      {aiCallStudent && (
        <TeacherAICallModal
          isOpen={true}
          teacher={teacher}
          group={group}
          groupId={group.id}
          groupName={group.name}
          student={aiCallStudent}
          onClose={() => setAiCallStudent(null)}
        />
      )}

      {/* Delete Group Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete this Group?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to permanently delete <strong>{group.name}</strong>? All members will be removed.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={isDeletingGroup}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                {isDeletingGroup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
