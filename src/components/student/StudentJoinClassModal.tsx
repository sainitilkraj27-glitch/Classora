import React, { useState } from 'react';
import { X, BookOpen, KeyRound, Check, AlertCircle, Search, Globe, Lock, Clock } from 'lucide-react';
import { UserProfile, ClassRoom } from '../../types';
import { searchClassByCodeOrId, joinClassByCode } from '../../lib/databaseService';
import confetti from 'canvas-confetti';

interface StudentJoinClassModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  onClassJoined?: (classId: string) => void;
}

export const StudentJoinClassModal: React.FC<StudentJoinClassModalProps> = ({
  userProfile,
  onClose,
  onClassJoined,
}) => {
  const [queryInput, setQueryInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundClass, setFoundClass] = useState<ClassRoom | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = queryInput.trim();
    if (!clean) return;

    setIsSearching(true);
    setStatusMsg(null);
    setFoundClass(null);

    try {
      const cls = await searchClassByCodeOrId(clean);
      if (cls) {
        setFoundClass(cls);
      } else {
        setStatusMsg({ text: 'No classroom found with this Join Code or UID.', error: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error searching class.', error: true });
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoinOrRequest = async () => {
    if (!foundClass && !queryInput.trim()) return;
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const codeOrId = foundClass ? foundClass.joinCode : queryInput.trim();
      const res = await joinClassByCode(codeOrId, userProfile);
      if (res.success) {
        confetti({ particleCount: 70, spread: 60 });
        setStatusMsg({ text: res.message });
        if (res.classId && onClassJoined) {
          onClassJoined(res.classId);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMsg({ text: res.message, error: true });
      }
    } catch (err: any) {
      console.error('Error joining class:', err);
      setStatusMsg({ text: err.message || 'Failed to join class.', error: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Find & Join Class</h2>
              <p className="text-[11px] text-slate-400">Search by 6-character Join Code or Class UID</p>
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

        {/* Search input form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Class Join Code or UID
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={queryInput}
                  onChange={(e) => {
                    setQueryInput(e.target.value);
                    setFoundClass(null);
                  }}
                  placeholder="e.g. AI890B or class-uid"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !queryInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                {isSearching ? 'Searching...' : 'Find'}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Supports 6-character short code or full class identifier.
            </p>
          </div>
        </form>

        {/* Preview of found class */}
        {foundClass && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white">{foundClass.name}</h3>
                <p className="text-xs text-purple-300 font-medium">
                  {foundClass.subject || 'General Course'} &bull; Teacher: {foundClass.teacherName}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  foundClass.accessType === 'private'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {foundClass.accessType === 'private' ? (
                  <>
                    <Lock className="w-3 h-3" /> Private
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3" /> Public
                  </>
                )}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
              {foundClass.accessType === 'private' ? (
                <div className="flex items-center gap-2 text-amber-300">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    This is a <strong>Private Class</strong>. Joining will send a request to Teacher {foundClass.teacherName} for approval.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-300">
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>
                    This is a <strong>Public Class</strong>. You will be enrolled immediately!
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleJoinOrRequest}
              disabled={isSubmitting}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg ${
                foundClass.accessType === 'private'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-950/50'
              }`}
            >
              {isSubmitting
                ? 'Processing...'
                : foundClass.accessType === 'private'
                ? 'Send Join Request'
                : 'Join Class Now'}
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
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
