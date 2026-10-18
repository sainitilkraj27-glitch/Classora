import React, { useState } from 'react';
import { X, KeyRound, Check, AlertCircle, Clock } from 'lucide-react';
import { UserProfile, ClassSession } from '../../types';
import { submitStudentAttendance } from '../../lib/databaseService';
import confetti from 'canvas-confetti';

interface StudentCheckinModalProps {
  session: ClassSession;
  userProfile: UserProfile;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StudentCheckinModal: React.FC<StudentCheckinModalProps> = ({
  session,
  userProfile,
  onClose,
  onSuccess,
}) => {
  const [pinCode, setPinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinCode.trim();
    if (cleanPin.length !== 4) {
      setStatusMsg({ text: 'Please enter the 4-digit numerical attendance code.', error: true });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await submitStudentAttendance(session, userProfile, cleanPin);
      if (res.success) {
        confetti({ particleCount: 80, spread: 70 });
        setStatusMsg({ text: res.message });
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMsg({ text: res.message, error: true });
      }
    } catch (err: any) {
      console.error('Error checking in:', err);
      setStatusMsg({ text: err.message || 'Verification failed.', error: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-xs w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Enter Code</h2>
              <p className="text-[11px] text-slate-400">{session.className}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
              statusMsg.error
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            }`}
          >
            {statusMsg.error ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              4-Digit Attendance PIN
            </label>
            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={4}
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="w-40 mx-auto text-center tracking-[0.6em] text-2xl font-mono font-extrabold bg-slate-950 border border-slate-800 rounded-2xl py-3 text-cyan-300 placeholder-slate-700 focus:outline-none focus:border-cyan-500 block"
              autoFocus
            />
            <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              Deadline: {session.attendanceDeadline || 'Closing soon'}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || pinCode.length !== 4}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-950/50 disabled:opacity-50"
            >
              {isSubmitting ? 'Checking...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
