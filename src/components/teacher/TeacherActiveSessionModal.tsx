import React, { useEffect, useState } from 'react';
import {
  X,
  Copy,
  Check,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Shield,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { ClassSession, AttendanceRecord, AttendanceStatus } from '../../types';
import {
  subscribeSessionAttendance,
  updateStudentAttendanceByTeacher,
  closeClassSession,
} from '../../lib/databaseService';

interface TeacherActiveSessionModalProps {
  session: ClassSession;
  onClose: () => void;
}

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

export const TeacherActiveSessionModal: React.FC<TeacherActiveSessionModalProps> = ({
  session,
  onClose,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [isClosing, setIsClosing] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Subscribe to live session attendance changes
  useEffect(() => {
    const unsub = subscribeSessionAttendance(session.id, (records) => {
      setAttendanceList(records);
    });
    return () => unsub();
  }, [session.id]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(session.attendanceCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleEndSession = async () => {
    setIsClosing(true);
    try {
      await closeClassSession(session.id);
      setShowConfirmClose(false);
      onClose();
    } catch (err) {
      console.error('Error closing session:', err);
    } finally {
      setIsClosing(false);
    }
  };

  // Real-time counter derived from live attendance list
  const safeList = attendanceList || [];
  const presentCount = safeList.filter((r) => r.status === 'PRESENT').length;
  const lateCount = safeList.filter((r) => r.status === 'LATE').length;
  const pendingCount = safeList.filter((r) => r.status === 'PENDING').length;
  const absentCount = safeList.filter((r) => r.status === 'ABSENT' || r.status === 'EXCUSED').length;

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              SESSION ACTIVE
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Class Title & Timing */}
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {session.className}
          </h2>
          <p className="text-xs text-slate-400">
            {formatTime12h(session.startTime)} – {formatTime12h(session.endTime)}
          </p>
        </div>

        {/* Attendance PIN Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-slate-950 border border-purple-500/30 text-center space-y-2">
          <p className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider">
            Attendance Code
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-white drop-shadow">
              {session.attendanceCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 transition"
              title="Copy Code"
            >
              {copiedCode ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Copy className="w-5 h-5 text-purple-300" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Attendance closes: <strong className="text-slate-200">{formatTime12h(session.attendanceDeadline)}</strong>
          </p>
        </div>

        {/* 4-Column Live Attendance Summary */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Present</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400 block mt-0.5">
              {presentCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Late</span>
            <span className="text-base sm:text-lg font-bold text-amber-400 block mt-0.5">
              {lateCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Pending</span>
            <span className="text-base sm:text-lg font-bold text-indigo-400 block mt-0.5">
              {pendingCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Absent</span>
            <span className="text-base sm:text-lg font-bold text-rose-400 block mt-0.5">
              {absentCount}
            </span>
          </div>
        </div>

        {/* Live Student Check-in Roster */}
        <div className="flex-1 overflow-y-auto min-h-[140px] space-y-1.5 pr-1 border-t border-slate-800/80 pt-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Student Roster ({attendanceList.length})
          </p>
          {attendanceList.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">
              Enrolling active students for live check-in...
            </p>
          ) : (
            attendanceList.map((rec) => (
              <div
                key={rec.id}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-white">{rec.studentName}</p>
                  <p className="text-[10px] font-mono text-slate-500">ID: {rec.studentId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={rec.status}
                    onChange={(e) =>
                      updateStudentAttendanceByTeacher(
                        session.id,
                        rec.studentUid,
                        e.target.value as AttendanceStatus
                      )
                    }
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-200 focus:outline-none"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE">LATE</option>
                    <option value="PENDING">PENDING</option>
                    <option value="ABSENT">ABSENT</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Primary Action Button: END SESSION */}
        <div className="pt-2 border-t border-slate-800">
          {!showConfirmClose ? (
            <button
              id="end-session-main-btn"
              onClick={() => setShowConfirmClose(true)}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" /> End Session
            </button>
          ) : (
            <div className="space-y-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
              <p className="text-xs text-rose-300 font-semibold text-center">
                End session now? Unchecked students will be marked Absent.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowConfirmClose(false)}
                  className="py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndSession}
                  disabled={isClosing}
                  className="py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  {isClosing ? 'Ending...' : 'Confirm End'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
