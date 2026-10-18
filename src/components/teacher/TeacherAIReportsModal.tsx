import React, { useState } from 'react';
import {
  X,
  Sparkles,
  MessageSquare,
  Clock,
  User,
  Check,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  PhoneCall,
  Search,
  ChevronDown,
  ChevronUp,
  Bot,
  Volume2,
} from 'lucide-react';
import { AIStudentReport, UserProfile } from '../../types';
import {
  getOrCreateTeacherStudentConversation,
  deleteAIStudentReport,
  acknowledgeAIReport,
} from '../../lib/databaseService';

interface TeacherAIReportsModalProps {
  reports: AIStudentReport[];
  userProfile: UserProfile;
  onClose: () => void;
  onNavigateToMessages: (convId?: string) => void;
}

export const TeacherAIReportsModal: React.FC<TeacherAIReportsModalProps> = ({
  reports,
  userProfile,
  onClose,
  onNavigateToMessages,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'absent' | 'attending'>('all');
  const [expandedTranscriptId, setExpandedTranscriptId] = useState<string | null>(null);

  const handleOpenStudentChat = async (r: AIStudentReport) => {
    const convId = await getOrCreateTeacherStudentConversation(userProfile, {
      uid: r.studentUid,
      name: r.studentName,
      studentId: r.studentId,
      photoURL: r.studentPhotoURL,
    });
    onClose();
    onNavigateToMessages(convId);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteAIStudentReport(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledge = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await acknowledgeAIReport(id);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReports = reports.filter((rep) => {
    const matchesSearch =
      rep.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rep.reason && rep.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rep.exactStudentReply && rep.exactStudentReply.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'absent') {
      return rep.response !== 'Attending today';
    }
    if (filterStatus === 'attending') {
      return rep.response === 'Attending today';
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#060814]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-2xl w-full bg-slate-900 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-purple-600 text-white shadow-lg shadow-cyan-950/50">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Student AI Attendance & Call Reports
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  {reports.length} Total
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Live spoken responses & reasons collected from students after AI attendance calls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, 8-digit ID, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({reports.length})
            </button>
            <button
              onClick={() => setFilterStatus('absent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'absent'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Absent / Not Coming
            </button>
            <button
              onClick={() => setFilterStatus('attending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'attending'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Attending
            </button>
          </div>
        </div>

        {/* Reports Cards List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredReports.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs space-y-2">
              <PhoneCall className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
              <p className="font-semibold text-slate-400">No student AI reports match this query.</p>
              <p className="text-[11px] text-slate-500">
                Initiate an AI call from your group/class student list to collect student responses.
              </p>
            </div>
          ) : (
            filteredReports.map((rep) => {
              const isAttending = rep.response === 'Attending today';
              const isExpanded = expandedTranscriptId === rep.id;
              const studentResponseText =
                rep.exactStudentReply ||
                rep.reason?.replace(/^Student confirmed:\s*"?|"?$/g, '') ||
                'Reason not specified';

              return (
                <div
                  key={rep.id}
                  className={`p-4 rounded-2xl bg-slate-950/90 border transition space-y-3 text-xs shadow-lg ${
                    isAttending
                      ? 'border-emerald-500/30 hover:border-emerald-500/50'
                      : 'border-rose-500/30 hover:border-rose-500/50'
                  }`}
                >
                  {/* Top Header: Student DP, Name, ID & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Student DP (Photo / Avatar) */}
                      <div className="relative shrink-0">
                        {rep.studentPhotoURL ? (
                          <img
                            src={rep.studentPhotoURL}
                            alt={rep.studentName}
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white font-bold text-base border-2 border-slate-700 shadow-md">
                            {rep.studentName ? rep.studentName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center text-[8px] font-bold ${
                            isAttending ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                          }`}
                        >
                          {isAttending ? '✓' : '✕'}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{rep.studentName}</span>
                          <span
                            className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              isAttending
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {isAttending ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-400" />
                            )}
                            {rep.response || (isAttending ? 'Attending today' : 'Not attending today')}
                          </span>
                          {rep.isAcknowledgedByTeacher && (
                            <span className="text-[9px] font-bold text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40">
                              Reviewed
                            </span>
                          )}
                        </div>

                        {/* ID and Branch */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                          <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-800/40">
                            ID: {rep.studentId}
                          </span>
                          {rep.groupName && (
                            <span className="text-slate-400 font-medium">
                              • {rep.groupName}
                            </span>
                          )}
                          {rep.studentPhone && (
                            <span className="text-slate-500">
                              • {rep.studentPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenStudentChat(rep)}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition flex items-center gap-1 text-[11px] font-semibold"
                        title="Direct Message Student"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Message</span>
                      </button>

                      {!rep.isAcknowledgedByTeacher && (
                        <button
                          onClick={(e) => handleAcknowledge(rep.id, e)}
                          className="p-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition"
                          title="Mark Reviewed"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDelete(rep.id, e)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 transition"
                        title="Delete Report"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Student Exact Spoken Reply Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5" />
                        Student's Spoken Response / Verbal Reply:
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(rep.createdAt || rep.timestamp || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-white font-medium bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                      "{studentResponseText}"
                    </p>

                    {/* AI Coordinator Summary */}
                    {rep.aiSummary && (
                      <div className="pt-2 border-t border-slate-800 flex items-start gap-2">
                        <Bot className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-cyan-300/90 leading-relaxed">
                          <strong className="text-cyan-200">AI Coordinator Note: </strong>
                          {rep.aiSummary}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transcript Dropdown if available */}
                  {(rep.transcript && rep.transcript.length > 0) || rep.conversationSnippet ? (
                    <div className="space-y-1.5">
                      <button
                        onClick={() =>
                          setExpandedTranscriptId(isExpanded ? null : rep.id)
                        }
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" /> Hide Full Call Conversation
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" /> View Full Call Conversation
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
                          {rep.transcript && rep.transcript.length > 0 ? (
                            rep.transcript.map((t, idx) => (
                              <div
                                key={idx}
                                className={`flex items-start gap-2 ${
                                  t.speaker === 'ai' ? 'text-cyan-300' : 'text-purple-300'
                                }`}
                              >
                                <span className="font-bold text-[10px] uppercase opacity-75 shrink-0 w-14">
                                  {t.speaker === 'ai' ? 'Classora AI:' : 'Student:'}
                                </span>
                                <span className="text-slate-200 flex-1">{t.text}</span>
                              </div>
                            ))
                          ) : (
                            <pre className="whitespace-pre-wrap font-sans text-slate-300 text-[11px]">
                              {rep.conversationSnippet}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Footer Note */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1 text-emerald-400/80 font-medium">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      Confidential • Only visible to teacher
                    </span>
                    <span>
                      {new Date(rep.createdAt || rep.timestamp || Date.now()).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shadow"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

