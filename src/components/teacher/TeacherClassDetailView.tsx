import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Users,
  Play,
  Copy,
  Check,
  UserPlus,
  MessageSquare,
  Search,
  Clock,
  Settings,
  Calendar,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Globe,
  Lock,
  UserCheck,
  UserX,
  UserMinus,
  Trash2,
  Sparkles,
  Phone,
} from 'lucide-react';
import {
  ClassRoom,
  ClassMember,
  ClassSession,
  AttendanceRecord,
  UserProfile,
} from '../../types';
import {
  subscribeClassMembers,
  subscribeClassPendingRequests,
  subscribeSessionAttendance,
  updateStudentAttendanceByTeacher,
  addStudentToClassByTeacher,
  approveClassJoinRequest,
  rejectClassJoinRequest,
  updateClass,
  getOrCreateTeacherStudentConversation,
  getOrCreateClassGroupConversation,
  removeStudentFromClass,
  deleteClass,
} from '../../lib/databaseService';
import confetti from 'canvas-confetti';
import { TeacherAICallModal } from './TeacherAICallModal';

interface TeacherClassDetailViewProps {
  classRoom: ClassRoom;
  userProfile: UserProfile;
  sessions: ClassSession[];
  activeSession: ClassSession | null;
  onBack: () => void;
  onStartSession: (classId: string) => void;
  onViewLiveSession: (session: ClassSession) => void;
  onNavigateToMessages: (convId?: string) => void;
  onClassDeleted?: (classId: string) => void;
}

type ClassTab = 'OVERVIEW' | 'STUDENTS' | 'REQUESTS' | 'ATTENDANCE' | 'SESSIONS' | 'SETTINGS';

function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export const TeacherClassDetailView: React.FC<TeacherClassDetailViewProps> = ({
  classRoom,
  userProfile,
  sessions = [],
  activeSession,
  onBack,
  onStartSession,
  onViewLiveSession,
  onNavigateToMessages,
  onClassDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<ClassTab>('OVERVIEW');
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ClassMember[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [actionLoadingStudentUid, setActionLoadingStudentUid] = useState<string | null>(null);

  // Add student modal state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [addMsg, setAddMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Remove student & Delete class state
  const [studentToRemove, setStudentToRemove] = useState<ClassMember | null>(null);
  const [isRemovingStudent, setIsRemovingStudent] = useState(false);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [isDeletingClass, setIsDeletingClass] = useState(false);
  const [aiCallStudent, setAiCallStudent] = useState<{
    uid: string;
    studentId: string;
    name: string;
    phone?: string;
    photoURL?: string;
  } | null>(null);

  // Selected session for attendance records tab
  const safeSessions = sessions || [];
  const classSessions = safeSessions.filter((s) => s.classId === classRoom.id);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    classSessions[0]?.id || ''
  );
  const [sessionAttendance, setSessionAttendance] = useState<AttendanceRecord[]>([]);

  // Subscribe to active class members
  useEffect(() => {
    const unsub = subscribeClassMembers(classRoom.id, (data) => {
      setMembers(data);
    });
    return () => unsub();
  }, [classRoom.id]);

  // Subscribe to pending join requests
  useEffect(() => {
    const unsub = subscribeClassPendingRequests(classRoom.id, (data) => {
      setPendingRequests(data);
    });
    return () => unsub();
  }, [classRoom.id]);

  // Subscribe to selected session attendance
  useEffect(() => {
    if (!selectedSessionId) {
      if (classSessions.length > 0) {
        setSelectedSessionId(classSessions[0].id);
      }
      return;
    }
    const unsub = subscribeSessionAttendance(selectedSessionId, (records) => {
      setSessionAttendance(records);
    });
    return () => unsub();
  }, [selectedSessionId, classSessions.length]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim()) return;
    setIsAdding(true);
    setAddMsg(null);
    try {
      const res = await addStudentToClassByTeacher(classRoom.id, studentIdInput.trim(), userProfile);
      if (res.success) {
        setAddMsg({ text: res.message });
        setStudentIdInput('');
        confetti({ particleCount: 50, spread: 60 });
      } else {
        setAddMsg({ text: res.message, error: true });
      }
    } catch (err: any) {
      setAddMsg({ text: err.message || 'Error adding student', error: true });
    } finally {
      setIsAdding(false);
    }
  };

  const handleConfirmRemoveStudent = async () => {
    if (!studentToRemove) return;
    setIsRemovingStudent(true);
    try {
      await removeStudentFromClass(classRoom.id, studentToRemove.studentUid, studentToRemove.studentName);
      setStudentToRemove(null);
    } catch (err) {
      console.error('Error removing student:', err);
    } finally {
      setIsRemovingStudent(false);
    }
  };

  const handleConfirmDeleteClass = async () => {
    setIsDeletingClass(true);
    try {
      await deleteClass(classRoom.id);
      setShowDeleteClassModal(false);
      if (onClassDeleted) onClassDeleted(classRoom.id);
      onBack();
    } catch (err) {
      console.error('Error deleting class:', err);
    } finally {
      setIsDeletingClass(false);
    }
  };

  const handleApprove = async (studentUid: string) => {
    setActionLoadingStudentUid(studentUid);
    try {
      await approveClassJoinRequest(classRoom.id, studentUid, classRoom);
      confetti({ particleCount: 40, spread: 50 });
    } catch (err) {
      console.error('Error approving student:', err);
    } finally {
      setActionLoadingStudentUid(null);
    }
  };

  const handleReject = async (studentUid: string) => {
    setActionLoadingStudentUid(studentUid);
    try {
      await rejectClassJoinRequest(classRoom.id, studentUid);
    } catch (err) {
      console.error('Error rejecting student:', err);
    } finally {
      setActionLoadingStudentUid(null);
    }
  };

  const handleToggleAccessType = async () => {
    const nextType = classRoom.accessType === 'private' ? 'public' : 'private';
    try {
      await updateClass(classRoom.id, { accessType: nextType });
    } catch (err) {
      console.error('Error updating access type:', err);
    }
  };

  const handleDirectChat = async (m: { studentUid: string; studentName: string; studentPhotoURL?: string; studentId: string }) => {
    try {
      const convId = await getOrCreateTeacherStudentConversation(userProfile, {
        uid: m.studentUid,
        name: m.studentName,
        photoURL: m.studentPhotoURL,
        studentId: m.studentId,
      });
      onNavigateToMessages(convId);
    } catch (err) {
      console.error('Error starting direct chat:', err);
    }
  };

  const handleGroupChat = async () => {
    try {
      const convId = await getOrCreateClassGroupConversation(classRoom, userProfile);
      onNavigateToMessages(convId);
    } catch (err) {
      console.error('Error starting group chat:', err);
    }
  };

  const isClassSessionActive = activeSession && activeSession.classId === classRoom.id;

  const filteredMembers = (members || []).filter(
    (m) =>
      (m.studentName || '').toLowerCase().includes((studentSearch || '').toLowerCase()) ||
      (m.studentId || '').includes((studentSearch || '').trim())
  );

  const isPrivate = classRoom.accessType === 'private';

  return (
    <div className="space-y-4 pb-20">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition py-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Classes
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGroupChat}
            className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Class Chat
          </button>
        </div>
      </div>

      {/* Class Hero Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0e122b] to-slate-900 border border-slate-800/90 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {classRoom.name}
              </h1>
              {isClassSessionActive && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Active Session
                </span>
              )}
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  isPrivate
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {isPrivate ? 'Private (Approval Req.)' : 'Public (Direct Join)'}
              </span>
            </div>
            <p className="text-xs text-purple-300 font-medium">
              {classRoom.subject || 'General Course'} &bull; {members.length} Enrolled Students
              {pendingRequests.length > 0 && (
                <span className="ml-2 text-amber-400 font-bold">
                  &bull; {pendingRequests.length} Pending Requests!
                </span>
              )}
            </p>
          </div>

          {/* Primary Action Button */}
          <div>
            {isClassSessionActive ? (
              <button
                id="class-view-live-session-btn"
                onClick={() => onViewLiveSession(activeSession!)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
              >
                <Activity className="w-4 h-4 animate-pulse" /> View Live Session (PIN: {activeSession!.attendanceCode})
              </button>
            ) : (
              <button
                id="class-start-session-btn"
                onClick={() => onStartSession(classRoom.id)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40"
              >
                <Play className="w-4 h-4 fill-current" /> Start Session
              </button>
            )}
          </div>
        </div>

        {/* Identification Bar: Join Code & Class UID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center justify-between bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/60">
            <span className="text-slate-400">Join Code:</span>
            <button
              onClick={() => handleCopy(classRoom.joinCode)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-950/40 border border-purple-800/50 font-mono text-purple-300 hover:text-white"
              title="Copy Join Code"
            >
              <span className="font-bold tracking-wider">{classRoom.joinCode}</span>
              {copiedCode === classRoom.joinCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/60">
            <span className="text-slate-400">Class UID:</span>
            <button
              onClick={() => handleCopy(classRoom.id)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-300 hover:text-white"
              title="Copy Class UID"
            >
              <span className="font-mono text-[11px] truncate max-w-[120px]">{classRoom.id}</span>
              {copiedCode === classRoom.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1 text-xs">
        {(['OVERVIEW', 'STUDENTS', 'REQUESTS', 'ATTENDANCE', 'SESSIONS', 'SETTINGS'] as ClassTab[]).map(
          (tab) => (
            <button
              key={tab}
              id={`class-tab-${tab.toLowerCase()}-btn`}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-xl font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'STUDENTS' && `Students (${members.length})`}
              {tab === 'REQUESTS' && (
                <>
                  <span>Requests</span>
                  {pendingRequests.length > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950">
                      {pendingRequests.length}
                    </span>
                  )}
                </>
              )}
              {tab !== 'STUDENTS' && tab !== 'REQUESTS' && tab}
            </button>
          )
        )}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Schedule & Attendance Timing
              </h3>
              <span className="text-[10px] text-purple-300 font-bold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30">
                ⚡ 20-min AI Window
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Class Hours</span>
                <span className="font-semibold text-white mt-0.5 block">
                  {formatTime12h(classRoom.timing.startTime)} – {formatTime12h(classRoom.timing.endTime)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-purple-500/30">
                <span className="text-purple-300 font-semibold block text-[11px]">1. AI Time (Start)</span>
                <span className="font-bold text-white mt-0.5 block font-mono">
                  {formatTime12h(classRoom.timing.attendanceOpeningTime || classRoom.timing.startTime)}
                </span>
                <span className="text-[9px] text-slate-500">Attendance opens</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/30">
                <span className="text-emerald-300 font-semibold block text-[11px]">2. ATD Time (Closes)</span>
                <span className="font-bold text-white mt-0.5 block font-mono">
                  {formatTime12h(classRoom.timing.attendanceDeadline || classRoom.timing.lateThreshold)}
                </span>
                <span className="text-[9px] text-slate-500">Window ends & locks</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setActiveTab('STUDENTS');
                setShowAddStudent(true);
              }}
              className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/30 text-left space-y-1 transition"
            >
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <p className="text-xs font-bold text-white">Enroll Student</p>
              <p className="text-[11px] text-slate-400">Add by 8-digit Student ID</p>
            </button>

            <button
              onClick={handleGroupChat}
              className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/30 text-left space-y-1 transition"
            >
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <p className="text-xs font-bold text-white">Class Group Chat</p>
              <p className="text-[11px] text-slate-400">Message all students</p>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Student ID or name..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              id="open-add-student-modal-btn"
              onClick={() => setShowAddStudent(true)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Student
            </button>
          </div>

          {/* Student List */}
          {filteredMembers.length > 0 ? (
            <div className="space-y-2">
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    {m.studentPhotoURL ? (
                      <img
                        src={m.studentPhotoURL}
                        alt={m.studentName}
                        className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-[11px]">
                        {m.studentName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{m.studentName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-purple-300">
                          ID: {m.studentId}
                        </span>
                        <button
                          onClick={() => handleCopy(m.studentId)}
                          className="text-slate-500 hover:text-white"
                          title="Copy Student ID"
                        >
                          {copiedCode === m.studentId ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setAiCallStudent({
                          uid: m.studentUid,
                          studentId: m.studentId,
                          name: m.studentName,
                          phone: m.studentPhone,
                          photoURL: m.studentPhotoURL,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-semibold text-xs transition"
                      title="AI Voice Call Student"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> AI Call
                    </button>
                    <button
                      onClick={() => handleDirectChat(m)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 font-semibold text-xs transition"
                      title="Direct Message Student"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </button>
                    <button
                      onClick={() => setStudentToRemove(m)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 transition"
                      title="Remove Student from Batch"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
              No students found matching your search.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REQUESTS (Pending Student Join Requests) */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            {isPrivate ? (
              <p>
                🔒 This is a <strong>Private Class</strong>. Students who search for this class or enter the code submit a request to join below.
              </p>
            ) : (
              <p>
                🌐 This is a <strong>Public Class</strong>. You can also review any pending requests below.
              </p>
            )}
          </div>

          {pendingRequests.length > 0 ? (
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    {req.studentPhotoURL ? (
                      <img
                        src={req.studentPhotoURL}
                        alt={req.studentName}
                        className="w-9 h-9 rounded-full border border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center font-bold text-white text-xs">
                        {req.studentName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white">{req.studentName}</p>
                      <p className="text-[11px] font-mono text-purple-300">
                        Student ID: {req.studentId}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Requested: {new Date(req.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleDirectChat(req)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 transition"
                      title="Message Student"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReject(req.studentUid)}
                      disabled={actionLoadingStudentUid === req.studentUid}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1 transition"
                    >
                      <UserX className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleApprove(req.studentUid)}
                      disabled={actionLoadingStudentUid === req.studentUid}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 shadow-lg shadow-emerald-950/40 transition"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-semibold text-slate-300">No pending join requests</p>
              <p className="text-[11px] text-slate-500">
                When new students request to join this class, they will appear here for your approval.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ATTENDANCE */}
      {activeTab === 'ATTENDANCE' && (
        <div className="space-y-3">
          {/* Session Picker & AI Absent Call Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {classSessions.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                {classSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition ${
                      selectedSessionId === s.id
                        ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {s.date} (PIN: {s.attendanceCode})
                  </button>
                ))}
              </div>
            )}

            {sessionAttendance.filter((r) => r.status === 'ABSENT').length > 0 && (
              <button
                onClick={() => {
                  const absent = sessionAttendance.find((r) => r.status === 'ABSENT');
                  if (absent) {
                    setAiCallStudent({
                      uid: absent.studentUid,
                      studentId: absent.studentId,
                      name: absent.studentName,
                    });
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-900/30 transition shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto AI Call Absent ({sessionAttendance.filter((r) => r.status === 'ABSENT').length})</span>
              </button>
            )}
          </div>

          {sessionAttendance.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs bg-slate-900/90">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="p-3 font-semibold">Student</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Submitted</th>
                    <th className="p-3 font-semibold">Override</th>
                    <th className="p-3 font-semibold text-right">AI Call</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sessionAttendance.map((rec) => (
                    <tr key={rec.id}>
                      <td className="p-3 text-white font-medium">
                        {rec.studentName}
                        <span className="block text-[10px] font-mono text-slate-400">
                          {rec.studentId}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.status === 'PRESENT'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : rec.status === 'LATE'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : rec.status === 'ABSENT'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {rec.submittedAt
                          ? new Date(rec.submittedAt).toLocaleTimeString()
                          : '—'}
                      </td>
                      <td className="p-3">
                        <select
                          value={rec.status}
                          onChange={(e) =>
                            updateStudentAttendanceByTeacher(
                              selectedSessionId,
                              rec.studentUid,
                              e.target.value as any
                            )
                          }
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
                        >
                          <option value="PRESENT">PRESENT</option>
                          <option value="LATE">LATE</option>
                          <option value="ABSENT">ABSENT</option>
                          <option value="EXCUSED">EXCUSED</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() =>
                            setAiCallStudent({
                              uid: rec.studentUid,
                              studentId: rec.studentId,
                              name: rec.studentName,
                            })
                          }
                          className="px-2 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-[10px] font-bold inline-flex items-center gap-1 transition"
                          title="Call Student with AI to ask reason for absence"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>AI Call</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
              No attendance records recorded for this session.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SESSIONS */}
      {activeTab === 'SESSIONS' && (
        <div className="space-y-3">
          {classSessions.length > 0 ? (
            <div className="space-y-2">
              {classSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{s.date}</span>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          s.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-purple-300">
                      PIN Code: {s.attendanceCode} &bull; Present: {s.presentCount} | Late: {s.lateCount} | Absent: {s.absentCount}
                    </p>
                  </div>

                  {s.status === 'active' && (
                    <button
                      onClick={() => onViewLiveSession(s)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Manage Live
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
              No sessions have been started for this class yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-white">Class Configuration</h3>
            <div className="space-y-2 text-slate-400">
              <p>
                <strong className="text-slate-300">Allow Student-to-Student Chat:</strong>{' '}
                {classRoom.timing.allowStudentChat ? 'Enabled' : 'Disabled'}
              </p>
              <p>
                <strong className="text-slate-300">Class ID:</strong> {classRoom.id}
              </p>
              <p>
                <strong className="text-slate-300">Teacher UID:</strong> {classRoom.teacherUid}
              </p>
            </div>
          </div>

          {/* Danger Zone: Delete Class */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/25 space-y-2.5 text-xs">
            <h3 className="font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Danger Zone: Delete Class / Batch
            </h3>
            <p className="text-slate-400">
              Permanently remove this class batch, its sessions, and all student enrollments.
            </p>
            <button
              onClick={() => setShowDeleteClassModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 transition shadow-lg shadow-rose-950/40"
            >
              <Trash2 className="w-4 h-4" /> Delete Class
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM REMOVE STUDENT MODAL */}
      {studentToRemove && (
        <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm">Remove Student from Batch</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to remove <strong>{studentToRemove.studentName}</strong> (ID: {studentToRemove.studentId}) from this class?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStudentToRemove(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemoveStudent}
                disabled={isRemovingStudent}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                {isRemovingStudent ? 'Removing...' : 'Remove Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE CLASS MODAL */}
      {showDeleteClassModal && (
        <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-4 h-4" /> Delete Batch / Class
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>{classRoom.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteClassModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteClass}
                disabled={isDeletingClass}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                {isDeletingClass ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD STUDENT BY 8-DIGIT ID */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 bg-[#070913]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              Enroll Student to {classRoom.name}
            </h3>
            <p className="text-xs text-slate-400">
              Enter the student's unique 8-digit Student ID (e.g. <code>48372915</code>) to authorize and enroll them.
            </p>

            {addMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  addMsg.error
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                }`}
              >
                <span>{addMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  8-Digit Student ID
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value.trim())}
                  placeholder="e.g. 48372915"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStudent(false);
                    setAddMsg(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {isAdding ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* AI Call Modal */}
      {aiCallStudent && (
        <TeacherAICallModal
          isOpen={true}
          teacher={userProfile}
          classId={classRoom.id}
          className={classRoom.name}
          student={aiCallStudent}
          onClose={() => setAiCallStudent(null)}
        />
      )}
    </div>
  );
};
