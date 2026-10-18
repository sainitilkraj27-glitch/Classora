import React from 'react';
import { X, Calendar, CheckCircle2, AlertTriangle, XCircle, Clock, BookOpen } from 'lucide-react';
import { AttendanceRecord, UserProfile } from '../../types';

interface StudentAttendanceModalProps {
  userProfile: UserProfile;
  attendanceHistory: AttendanceRecord[];
  onClose: () => void;
}

export const StudentAttendanceModal: React.FC<StudentAttendanceModalProps> = ({
  userProfile,
  attendanceHistory = [],
  onClose,
}) => {
  const safeHistory = attendanceHistory || [];
  const totalRecords = safeHistory.length;
  const presentCount = safeHistory.filter((a) => a.status === 'PRESENT').length;
  const lateCount = safeHistory.filter((a) => a.status === 'LATE').length;
  const absentCount = safeHistory.filter((a) => a.status === 'ABSENT').length;

  const attendanceRate =
    totalRecords > 0
      ? Math.round(((presentCount + lateCount * 0.75) / totalRecords) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Attendance History</h2>
              <p className="text-[11px] text-slate-400">
                {userProfile.name} &bull; ID: {userProfile.studentId || '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats summary bar */}
        <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block">Rate</span>
            <span className="text-sm font-bold text-white">{totalRecords > 0 ? `${attendanceRate}%` : '0%'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Present</span>
            <span className="text-sm font-bold text-emerald-400">{presentCount}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Late</span>
            <span className="text-sm font-bold text-amber-400">{lateCount}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Absent</span>
            <span className="text-sm font-bold text-rose-400">{absentCount}</span>
          </div>
        </div>

        {/* Records List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {attendanceHistory.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-400">No attendance history yet.</p>
              <p className="text-[11px]">Attendance records will automatically appear here once classes start.</p>
            </div>
          ) : (
            attendanceHistory.map((rec) => {
              const recordDate = rec.submittedAt || rec.verifiedAt;
              const dateStr = recordDate
                ? new Date(recordDate).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Session';

              const timeStr = recordDate
                ? new Date(recordDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              return (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-300 text-[11px] font-bold">
                        {dateStr}
                      </span>
                      <span className="font-bold text-white">{rec.className}</span>
                    </div>

                    {rec.reason && (
                      <p className="text-[11px] text-slate-400 italic">
                        Reason: {rec.reason} {rec.eta ? `(ETA: ${rec.eta})` : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                        rec.status === 'PRESENT'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : rec.status === 'LATE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {rec.status}
                    </span>

                    {timeStr && (
                      <span className="font-mono text-[10px] text-slate-500">
                        {timeStr}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
