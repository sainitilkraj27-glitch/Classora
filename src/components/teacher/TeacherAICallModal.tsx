import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PhoneCall,
  PhoneOff,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Shield,
  Volume2,
  Radio,
  FileText,
} from 'lucide-react';
import { UserProfile, AIStudentReport, AICallSession } from '../../types';
import {
  initiateStudentAICall,
  subscribeAICallSession,
  saveAIStudentReport,
  updateAICallSession,
} from '../../lib/databaseService';

interface TeacherAICallModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserProfile;
  teacher: UserProfile;
  groupId?: string;
  groupName?: string;
  classId?: string;
  className?: string;
  onOpenAIReports?: () => void;
}

export const TeacherAICallModal: React.FC<TeacherAICallModalProps> = ({
  isOpen,
  onClose,
  student,
  teacher,
  groupId,
  groupName,
  classId,
  className,
  onOpenAIReports,
}) => {
  const [stage, setStage] = useState<'CONFIRM' | 'CONNECTING' | 'IN_CALL' | 'COMPLETED' | 'FAILED'>('CONFIRM');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ speaker: 'ai' | 'student'; text: string; time: string }>>([]);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [generatedReport, setGeneratedReport] = useState<AIStudentReport | null>(null);

  const callUnsubRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStage('CONFIRM');
      setTranscript([]);
      setActiveCallId(null);
      setCallDurationSeconds(0);
      setGeneratedReport(null);
    } else {
      if (callUnsubRef.current) {
        callUnsubRef.current();
        callUnsubRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // Timer when IN_CALL
  useEffect(() => {
    if (stage === 'IN_CALL') {
      timerRef.current = setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start the AI Call to the student
  const startAICall = async () => {
    try {
      setStage('CONNECTING');
      const branchName = groupName || className || 'FEA';

      // 1. Create Firestore AI Call Session
      const callSessionId = await initiateStudentAICall({
        teacherUid: teacher.uid,
        teacherName: teacher.name,
        teacherPhotoURL: teacher.photoURL || '',
        studentUid: student.uid,
        studentName: student.name,
        studentId: student.studentId || student.uid.slice(0, 8),
        studentPhotoURL: student.photoURL || '',
        studentPhone: student.phone || '',
        groupId: groupId || undefined,
        groupName: branchName,
        classId: classId || undefined,
        className: className || undefined,
      });

      setActiveCallId(callSessionId);

      const initialGreeting = `Hello! Main ${branchName} branch ki AI bol rahi hoon, aaj kyu nahi aa rahe ho class me?`;
      setTranscript([
        {
          speaker: 'ai',
          text: initialGreeting,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // 2. Real-time Firestore subscription to listen to student's live call actions & transcript
      if (callUnsubRef.current) callUnsubRef.current();
      callUnsubRef.current = subscribeAICallSession(callSessionId, (callData) => {
        if (!callData) return;

        // Sync live transcript stream
        if (callData.transcript && callData.transcript.length > 0) {
          setTranscript(
            callData.transcript.map((t) => ({
              speaker: t.speaker,
              text: t.text,
              time: t.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }))
          );
        }

        if (callData.status === 'connected') {
          setStage('IN_CALL');
        } else if (callData.status === 'completed') {
          setStage('COMPLETED');
          const isAttending =
            (callData.studentAttendingStatus as string) === 'Attending' ||
            callData.studentAttendingStatus === 'Attending today';

          setGeneratedReport({
            id: callData.aiReportId || callSessionId,
            studentUid: student.uid,
            studentId: student.studentId || student.uid.slice(0, 8),
            studentName: student.name,
            studentPhotoURL: student.photoURL || '',
            studentPhone: student.phone || '',
            teacherUid: teacher.uid,
            teacherName: teacher.name,
            groupId: groupId,
            groupName: branchName,
            response: callData.studentAttendingStatus || (isAttending ? 'Attending today' : 'Not attending today'),
            reason: callData.studentResponseText || 'Reason recorded during voice call',
            exactStudentReply: callData.studentResponseText || 'Student spoken words recorded',
            aiSummary: callData.aiSummary || `Student reported their attendance status via AI call.`,
            callStatus: 'Completed',
            createdAt: Date.now(),
            transcript: callData.transcript || [],
            conversationSnippet: (callData.transcript || [])
              .map((t) => `${t.speaker === 'ai' ? 'Classora AI' : student.name}: ${t.text}`)
              .join('\n'),
          });
        } else if (callData.status === 'declined') {
          setStage('FAILED');
        }
      });
    } catch (err: any) {
      console.error('Error starting AI call:', err);
      setStage('FAILED');
    }
  };

  // Teacher manually hangs up / ends the call
  const handleTeacherEndCall = async () => {
    if (!activeCallId) {
      onClose();
      return;
    }

    const branchName = groupName || className || 'FEA';
    const studentWords = transcript
      .filter((t) => t.speaker === 'student')
      .map((t) => t.text)
      .join('; ');

    const isAttending =
      studentWords.toLowerCase().includes('aa raha') ||
      studentWords.toLowerCase().includes('aunga') ||
      studentWords.toLowerCase().includes('present');

    const rep: Omit<AIStudentReport, 'id'> = {
      studentUid: student.uid,
      studentId: student.studentId || student.uid.slice(0, 8),
      studentName: student.name,
      studentPhotoURL: student.photoURL || '',
      studentPhone: student.phone || '',
      teacherUid: teacher.uid,
      teacherName: teacher.name,
      groupId: groupId,
      groupName: branchName,
      response: isAttending ? 'Attending today' : 'Not attending today',
      reason: studentWords || 'Call concluded by teacher',
      exactStudentReply: studentWords || 'Voice conversation completed',
      aiSummary: studentWords
        ? `Student reported: "${studentWords}".`
        : `AI call conducted by faculty ${teacher.name}.`,
      callStatus: 'Completed',
      createdAt: Date.now(),
      transcript: transcript,
      conversationSnippet: transcript
        .map((t) => `${t.speaker === 'ai' ? 'Classora AI' : student.name}: ${t.text}`)
        .join('\n'),
    };

    try {
      const repId = await saveAIStudentReport(rep);
      await updateAICallSession(activeCallId, {
        status: 'completed',
        aiReportId: repId,
        studentResponseText: rep.reason,
        studentAttendingStatus: rep.response as any,
        aiSummary: rep.aiSummary,
        transcript: transcript,
      });

      setGeneratedReport({
        id: repId,
        ...rep,
      });
      setStage('COMPLETED');
    } catch (e) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-[#0c0f20] to-[#070914] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/60 text-slate-100 overflow-hidden my-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Classora AI Attendance Call
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                    Voice Telephony
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Automated student inquiry & response recording</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>

          {/* STAGE 1: CONFIRMATION & STUDENT DETAILS */}
          {stage === 'CONFIRM' && (
            <div className="space-y-4">
              {/* Student Card with DP and 8-Digit ID */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
                <div className="relative shrink-0">
                  {student.photoURL ? (
                    <img
                      src={student.photoURL}
                      alt={student.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/40 shadow"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 border-2 border-cyan-500/40 flex items-center justify-center text-white font-black text-xl shadow">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 border-2 border-slate-950 flex items-center justify-center text-[9px] font-bold text-slate-950">
                    ID
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-white truncate">{student.name}</h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono font-bold text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded-lg border border-cyan-800/50 text-xs">
                      ID: {student.studentId || student.uid.slice(0, 8)}
                    </span>
                    {(groupName || className) && (
                      <span className="text-xs text-slate-300 font-medium">
                        • {groupName || className}
                      </span>
                    )}
                  </div>
                  {student.phone && (
                    <p className="text-[11px] text-slate-400 mt-1">Phone: {student.phone}</p>
                  )}
                </div>
              </div>

              {/* Protocol Note */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-300">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  What AI will do:
                </div>
                <p className="text-slate-400 pl-1 leading-relaxed text-[11px]">
                  Classora AI will call {student.name} in natural Indian girl voice, ask why they are not coming to class today, listen continuously, record their exact reason, and automatically deliver the structured report into your <strong>AI Reports</strong>.
                </p>
              </div>

              {/* Privacy Badge */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Private & Secure: Report is directly saved to your Teacher Dashboard.</span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="initiate-student-ai-call-btn"
                  onClick={startAICall}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/50 transition flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  Initiate AI Call
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: DIALING / CONNECTING */}
          {stage === 'CONNECTING' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-500/40 flex items-center justify-center text-cyan-400 animate-pulse">
                  <PhoneCall className="w-9 h-9 animate-bounce" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-30" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Calling {student.name}...</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Connecting automated AI voice call to Student ID: {student.studentId || 'Verified'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Ringing on student device...
              </div>
            </div>
          )}

          {/* STAGE 3: ACTIVE CALL (TEACHER MONITORS LIVE TRANSCRIPT) */}
          {stage === 'IN_CALL' && (
            <div className="space-y-4">
              {/* Active Call Status Bar */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    Live Call In Progress
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDuration(callDurationSeconds)}</span>
                </div>
              </div>

              {/* Informative message for Teacher */}
              <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>AI Coordinator is talking with <strong>{student.name}</strong></span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono animate-pulse">Streaming Live...</span>
              </div>

              {/* Real-time Synced Transcript */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 min-h-[170px] max-h-[240px] overflow-y-auto space-y-3">
                {transcript.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 text-xs ${
                      item.speaker === 'ai' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {item.speaker === 'ai' && (
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`p-2.5 rounded-2xl max-w-[82%] ${
                        item.speaker === 'ai'
                          ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
                          : 'bg-purple-600/30 text-purple-100 border border-purple-500/40 rounded-tr-sm'
                      }`}
                    >
                      <div className="text-[10px] font-semibold opacity-60 mb-0.5">
                        {item.speaker === 'ai' ? 'Classora AI' : student.name} • {item.time}
                      </div>
                      <p>{item.text}</p>
                    </div>

                    {item.speaker === 'student' && (
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>

              {/* End Call Button for Teacher */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTeacherEndCall}
                  className="w-full py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg"
                >
                  <PhoneOff className="w-4 h-4" />
                  Hang Up / End Call & Finalize Report
                </button>
              </div>
            </div>
          )}

          {/* STAGE 4: CALL COMPLETED & STRUCTURED REPORT */}
          {stage === 'COMPLETED' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-white">Call Completed Successfully</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {formatDuration(callDurationSeconds)}
                  </span>
                </div>

                {/* Student Exact Reply Box */}
                {generatedReport && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">Status:</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          generatedReport.response === 'Attending today'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {generatedReport.response}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1 mb-1">
                        <Volume2 className="w-3 h-3" />
                        Student's Exact Verbal Reply:
                      </div>
                      <p className="text-white font-medium">
                        "{generatedReport.exactStudentReply || generatedReport.reason}"
                      </p>
                    </div>

                    {generatedReport.aiSummary && (
                      <div className="text-[11px] text-cyan-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        <strong className="text-cyan-200">AI Coordinator Note: </strong>
                        {generatedReport.aiSummary}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-1">
                {onOpenAIReports && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAIReports();
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    Open AI Reports Window
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
                >
                  Done / Close
                </button>
              </div>
            </div>
          )}

          {/* STAGE 5: FAILED / DECLINED */}
          {stage === 'FAILED' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                <XCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Call Not Connected / Declined</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Student declined the automated call or connection timed out.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
