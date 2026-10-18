import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  KeyRound,
  MessageSquare,
  Sparkles,
  Calendar,
  Shield,
  Info,
  LogOut,
} from 'lucide-react';
import {
  ClassRoom,
  UserProfile,
  ClassSession,
  AttendanceRecord,
} from '../../types';
import { getOrCreateClassGroupConversation, leaveClass } from '../../lib/databaseService';

interface StudentClassDetailViewProps {
  classRoom: ClassRoom;
  userProfile: UserProfile;
  activeSessions: ClassSession[];
  attendanceHistory: AttendanceRecord[];
  onBack: () => void;
  onOpenCheckinModal: (session: ClassSession) => void;
  onOpenAIChatModal: (session: ClassSession) => void;
  onNavigateToMessages: (convId?: string) => void;
  onLeftClass?: (classId: string) => void;
}

export const StudentClassDetailView: React.FC<StudentClassDetailViewProps> = ({
  classRoom,
  userProfile,
  activeSessions = [],
  attendanceHistory = [],
  onBack,
  onOpenCheckinModal,
  onOpenAIChatModal,
  onNavigateToMessages,
  onLeftClass,
}) => {
  const [activeSegment, setActiveSegment] = useState<'OVERVIEW' | 'ATTENDANCE' | 'INFO'>('OVERVIEW');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const safeSessions = activeSessions || [];
  const safeHistory = attendanceHistory || [];

  // Check if this class has a live active session right now
  const liveSession = safeSessions.find(
    (s) => s.classId === classRoom.id && s.status === 'active'
  );

  // Student's records for this specific class
  const classRecords = safeHistory.filter((a) => a.classId === classRoom.id);
  const presentCount = classRecords.filter((a) => a.status === 'PRESENT').length;
  const lateCount = classRecords.filter((a) => a.status === 'LATE').length;
  const absentCount = classRecords.filter((a) => a.status === 'ABSENT').length;

  const handleOpenClassChat = async () => {
    try {
      const convId = await getOrCreateClassGroupConversation(classRoom, userProfile);
      onNavigateToMessages(convId);
    } catch (err) {
      console.error('Error opening class chat:', err);
      onNavigateToMessages();
    }
  };

  const handleConfirmLeaveClass = async () => {
    setIsLeaving(true);
    try {
      await leaveClass(classRoom.id, userProfile.uid, userProfile.name);
      setShowLeaveModal(false);
      if (onLeftClass) onLeftClass(classRoom.id);
      onBack();
    } catch (err) {
      console.error('Error leaving class:', err);
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Top Bar with Back Button & Leave Option */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Classes</span>
        </button>

        <div className="flex items-center gap-2">
          {classRoom.timing.allowStudentChat && (
            <button
              onClick={handleOpenClassChat}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
          )}

          <button
            onClick={() => setShowLeaveModal(true)}
            className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition flex items-center gap-1 text-xs"
            title="Leave Batch / Class"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Class Title Hero */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 inline-block mb-1.5">
            {classRoom.subject || 'Enrolled Course'}
          </span>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            {classRoom.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            Faculty: <strong className="text-slate-200">{classRoom.teacherName}</strong>
          </p>
        </div>

        {/* Live Session Alert if active */}
        {liveSession && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Live Attendance Session Open
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Deadline: {liveSession.attendanceDeadline || 'Closing soon'}
              </span>
            </div>

            <button
              onClick={() => onOpenCheckinModal(liveSession)}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <KeyRound className="w-4 h-4" />
              Enter 4-Digit Attendance Code
            </button>
          </div>
        )}

        {/* Segmented Controls */}
        <div className="flex rounded-2xl bg-slate-950/80 p-1 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveSegment('OVERVIEW')}
            className={`flex-1 py-1.5 rounded-xl transition ${
              activeSegment === 'OVERVIEW'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSegment('ATTENDANCE')}
            className={`flex-1 py-1.5 rounded-xl transition ${
              activeSegment === 'ATTENDANCE'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Attendance ({classRecords.length})
          </button>
          <button
            onClick={() => setActiveSegment('INFO')}
            className={`flex-1 py-1.5 rounded-xl transition ${
              activeSegment === 'INFO'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Info & Policy
          </button>
        </div>
      </div>

      {/* Segment Content */}
      {activeSegment === 'OVERVIEW' && (
        <div className="space-y-4">
          {/* Quick Attendance Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block mb-0.5">Present</span>
              <span className="text-xl font-bold text-emerald-400">{presentCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block mb-0.5">Late</span>
              <span className="text-xl font-bold text-amber-400">{lateCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block mb-0.5">Absent</span>
              <span className="text-xl font-bold text-rose-400">{absentCount}</span>
            </div>
          </div>

          {/* Schedule Details */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Class Schedule & Attendance Window
              </h3>
              <span className="text-[10px] text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                20-min Window
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Class Hours</span>
                <span className="font-mono font-semibold text-white">
                  {classRoom.timing.startTime} – {classRoom.timing.endTime}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">1. AI Time (Attendance Opens)</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {classRoom.timing.attendanceOpeningTime || classRoom.timing.startTime}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">2. ATD Time (Attendance Closes)</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {classRoom.timing.attendanceDeadline || classRoom.timing.lateThreshold}
                </span>
              </div>
            </div>
          </div>

          {/* Class Description */}
          {classRoom.description && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                About Course
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {classRoom.description}
              </p>
            </div>
          )}
        </div>
      )}

      {activeSegment === 'ATTENDANCE' && (
        <div className="space-y-2.5">
          {classRecords.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-500">
              No attendance history recorded for this class yet.
            </div>
          ) : (
            classRecords.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {rec.verifiedAt || rec.submittedAt
                        ? new Date(rec.verifiedAt || rec.submittedAt!).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Session'}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        rec.status === 'PRESENT'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : rec.status === 'LATE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                  {rec.reason && (
                    <p className="text-[11px] text-slate-400 italic">
                      "{rec.reason}"
                    </p>
                  )}
                </div>

                <span className="font-mono text-slate-400 text-[11px]">
                  {rec.submittedAt
                    ? new Date(rec.submittedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeSegment === 'INFO' && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
            <Shield className="w-4 h-4" />
            Classroom Guidelines & Rules
          </div>
          <ul className="space-y-2 list-disc list-inside text-slate-400 text-[11px] leading-relaxed">
            <li>Attendance codes are unique 4-digit numbers generated live by the teacher.</li>
            <li>Submit attendance before the closing deadline to receive Present status.</li>
            <li>Submissions after the deadline up to late cutoff are marked Late.</li>
            <li>If you are late or absent, contact the AI assistant or message the teacher directly.</li>
          </ul>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => setShowLeaveModal(true)}
              className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Leave This Class / Batch
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM LEAVE CLASS MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-4 h-4" /> Leave Class / Batch
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to leave <strong>{classRoom.name}</strong>? You will no longer receive attendance sessions or announcements for this batch unless you rejoin.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLeaveClass}
                disabled={isLeaving}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                {isLeaving ? 'Leaving...' : 'Confirm Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
