import React, { useState } from 'react';
import {
  X,
  Search,
  GraduationCap,
  BookOpen,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { UserProfile, Course } from '../../types';
import { searchCourseById, requestJoinCourse } from '../../lib/databaseService';
import confetti from 'canvas-confetti';

interface StudentSearchCourseModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  onCourseJoined?: () => void;
}

export const StudentSearchCourseModal: React.FC<StudentSearchCourseModalProps> = ({
  userProfile,
  onClose,
  onCourseJoined,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedCourse, setSearchedCourse] = useState<Course | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean; success?: boolean } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setStatusMsg(null);
    setSearchedCourse(null);

    try {
      const result = await searchCourseById(q);
      setSearchedCourse(result);
      setHasSearched(true);
      if (!result) {
        setStatusMsg({
          text: `No course found with ID "${q}". Please check the Course ID provided by your teacher.`,
          error: true,
        });
      }
    } catch (err: any) {
      console.error('Error searching course:', err);
      setStatusMsg({ text: err.message || 'Error searching course', error: true });
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoinCourse = async () => {
    if (!searchedCourse) return;
    setIsJoining(true);
    setStatusMsg(null);

    try {
      const res = await requestJoinCourse(searchedCourse, userProfile);
      if (res.success) {
        confetti({ particleCount: 60, spread: 60 });
        setStatusMsg({ text: res.message, success: true });
        if (onCourseJoined) onCourseJoined();
      } else {
        setStatusMsg({ text: res.message, error: true });
      }
    } catch (err: any) {
      console.error('Error joining course:', err);
      setStatusMsg({ text: err.message || 'Failed to send join request', error: true });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Join a Course</h2>
              <p className="text-[11px] text-slate-400">Search by unique Course ID from your teacher</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              placeholder="e.g. CS-482719 or PHY-102938"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-24 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 uppercase font-mono tracking-wider transition"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition disabled:opacity-40"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center">
            Ask your teacher for their 6-digit alphanumeric Course Code.
          </p>
        </form>

        {/* Status Messages */}
        {statusMsg && (
          <div
            className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
              statusMsg.error
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }`}
          >
            {statusMsg.error ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{statusMsg.text}</span>
          </div>
        )}

        {/* Search Result Card */}
        {searchedCourse && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-3 animate-in fade-in duration-200">
            {searchedCourse.coverImageURL && (
              <div className="h-28 w-full rounded-xl overflow-hidden relative border border-slate-800">
                <img
                  src={searchedCourse.coverImageURL}
                  alt={searchedCourse.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[9px] font-mono bg-purple-950/90 text-purple-300 border border-purple-500/40">
                  {searchedCourse.courseId}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {searchedCourse.subject}
                </span>
                {searchedCourse.category && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-slate-800 text-slate-300">
                    {searchedCourse.category}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">{searchedCourse.name}</h3>
              {searchedCourse.description && (
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {searchedCourse.description}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Teacher: <strong>{searchedCourse.teacherName}</strong></span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-purple-400" /> {searchedCourse.materialCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-indigo-400" /> {searchedCourse.studentCount || 0}
                </span>
              </div>
            </div>

            <button
              onClick={handleJoinCourse}
              disabled={isJoining || statusMsg?.success}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-purple-950/50 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isJoining ? (
                'Submitting Request...'
              ) : statusMsg?.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Request Submitted!
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Send Join Request <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Private & secure course access</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
