import React, { useState } from 'react';
import { X, BookOpen, Plus, Clock, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { UserProfile, ClassRoom } from '../../types';
import { createClass, generateClassJoinCode } from '../../lib/databaseService';
import confetti from 'canvas-confetti';

interface TeacherCreateClassModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  onClassCreated: (classId: string) => void;
}

// Helper to add minutes to HH:mm string
function addMinutesToTime(timeStr: string, minutesToAdd: number = 20): string {
  if (!timeStr || !timeStr.includes(':')) return timeStr;
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return timeStr;

  const totalMinutes = h * 60 + m + minutesToAdd;
  const normalized = (totalMinutes % (24 * 60) + (24 * 60)) % (24 * 60);
  const newH = Math.floor(normalized / 60);
  const newM = normalized % 60;

  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export const TeacherCreateClassModal: React.FC<TeacherCreateClassModalProps> = ({
  userProfile,
  onClose,
  onClassCreated,
}) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:10');
  const [endTime, setEndTime] = useState('10:10');
  
  // Exactly 2 attendance time options: AI Time (Start) and ATD Time (End)
  const [aiTime, setAiTime] = useState('09:10');
  const [atdTime, setAtdTime] = useState('09:30');
  const [windowMinutes, setWindowMinutes] = useState(20);

  const [accessType, setAccessType] = useState<'public' | 'private'>('public');
  const [allowStudentChat, setAllowStudentChat] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // When AI Time changes, automatically calculate and set ATD Time to +20 minutes
  const handleAiTimeChange = (newAiTime: string) => {
    setAiTime(newAiTime);
    const calculatedAtd = addMinutesToTime(newAiTime, windowMinutes);
    setAtdTime(calculatedAtd);
  };

  // When class start time changes, also update AI Time and ATD Time
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    setAiTime(newStartTime);
    setAtdTime(addMinutesToTime(newStartTime, windowMinutes));
    setEndTime(addMinutesToTime(newStartTime, 60));
  };

  const handleApplyPreset = (minutes: number) => {
    setWindowMinutes(minutes);
    setAtdTime(addMinutesToTime(aiTime, minutes));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Class name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const joinCode = generateClassJoinCode();
      const newClassId = await createClass({
        name: name.trim(),
        subject: subject.trim() || '',
        description: description.trim() || '',
        teacherUid: userProfile.uid,
        teacherId: userProfile.teacherId || 'TEACHER',
        teacherName: userProfile.name,
        joinCode,
        accessType,
        timing: {
          startTime: startTime || '09:10',
          endTime: endTime || '10:10',
          // AI Time: Attendance start / opens
          attendanceOpeningTime: aiTime || '09:10',
          // ATD Time: Attendance window deadline (20 min window)
          attendanceDeadline: atdTime || '09:30',
          // Late cutoff: same as ATD Time (strictly closed after window)
          lateThreshold: atdTime || '09:30',
          daysOfWeek: [1, 2, 3, 4, 5],
          allowStudentChat: allowStudentChat ?? true,
        },
        isActive: true,
      });

      confetti({ particleCount: 60, spread: 70 });
      onClassCreated(newClassId);
      onClose();
    } catch (err: any) {
      console.error('Error creating class:', err);
      setErrorMsg(err.message || 'Failed to create class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Create New Class</h2>
              <p className="text-[11px] text-slate-400">Set schedule & AI attendance window</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Class Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Batch A"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Subject / Course (Optional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Computer Science / Mathematics"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Class Access Mode (Public vs Private)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccessType('public')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                  accessType === 'public'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>🌐 Public Class</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Students join immediately using Join Code or Class UID.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAccessType('private')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                  accessType === 'private'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>🔒 Private Class</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Students send join request. Requires teacher approval.
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Class Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Class End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* ATTENDANCE WINDOW RULES: EXACTLY 2 OPTIONS (AI TIME & ATD TIME) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-purple-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Attendance Window Rules</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Auto +{windowMinutes} min Window
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: AI Time (Start / Opens) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-200">
                  1. Ai Time <span className="text-slate-400 font-normal">(Start)</span>
                </label>
                <input
                  type="time"
                  required
                  value={aiTime}
                  onChange={(e) => handleAiTimeChange(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-400"
                />
                <p className="text-[9px] text-slate-400">
                  Attendance is start time se shuru hogi
                </p>
              </div>

              {/* Option 2: ATD Time (Auto +20 min End) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-200">
                  2. Atd Time <span className="text-slate-400 font-normal">(Auto +20m)</span>
                </label>
                <input
                  type="time"
                  required
                  value={atdTime}
                  onChange={(e) => setAtdTime(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-purple-400"
                />
                <p className="text-[9px] text-slate-400">
                  Is time tak 20 min attendance chalegi, fir band
                </p>
              </div>
            </div>

            {/* Quick Window Presets */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium">Quick Window:</span>
              {[
                { label: '+15 Min', val: 15 },
                { label: '+20 Min (Default)', val: 20 },
                { label: '+30 Min', val: 30 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => handleApplyPreset(p.val)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                    windowMinutes === p.val
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Summary explanation */}
            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[10px] text-purple-200 leading-relaxed flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <span>
                <strong>{aiTime}</strong> par attendance shuru hogi aur <strong>{atdTime}</strong> ({windowMinutes} minutes) tak chalegi. Iske baad attendance automatically lock ho jayegi.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="create-allow-chat"
              checked={allowStudentChat}
              onChange={(e) => setAllowStudentChat(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-purple-600 focus:ring-0"
            />
            <label htmlFor="create-allow-chat" className="text-xs text-slate-300">
              Allow student discussion in Class Group Chat
            </label>
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
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-950/50"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
