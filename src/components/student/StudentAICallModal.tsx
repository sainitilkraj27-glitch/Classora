import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone,
  PhoneOff,
  Sparkles,
  Bot,
  User,
  Mic,
  MicOff,
  Send,
  Loader2,
  CheckCircle2,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  Shield,
} from 'lucide-react';
import { AICallSession, UserProfile, AIStudentReport } from '../../types';
import {
  answerAICall,
  declineAICall,
  completeAICallWithReport,
  updateAICallSession,
} from '../../lib/databaseService';
import { ringtoneService } from '../../lib/ringtoneService';

interface StudentAICallModalProps {
  incomingCall: AICallSession;
  studentProfile: UserProfile;
  onClose: () => void;
}

export const StudentAICallModal: React.FC<StudentAICallModalProps> = ({
  incomingCall,
  studentProfile,
  onClose,
}) => {
  const [callState, setCallState] = useState<'RINGING' | 'CONNECTED' | 'COMPLETED' | 'DECLINED'>(
    incomingCall.status === 'connected' ? 'CONNECTED' : 'RINGING'
  );
  const [isSpeakingAI, setIsSpeakingAI] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ speaker: 'ai' | 'student'; text: string; time: string }>>(
    incomingCall.transcript?.map((t) => ({
      speaker: t.speaker,
      text: t.text,
      time: t.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })) || []
  );
  const [studentInput, setStudentInput] = useState('');
  const [liveInterimText, setLiveInterimText] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [finalReportSummary, setFinalReportSummary] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const silenceTimerRef = useRef<any>(null);
  const callTimerRef = useRef<any>(null);
  const isCallActiveRef = useRef(false);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, liveInterimText, isProcessingAI]);

  // Call timer when connected
  useEffect(() => {
    if (callState === 'CONNECTED') {
      isCallActiveRef.current = true;
      callTimerRef.current = setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      isCallActiveRef.current = false;
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callState]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Browser Notification & Melodic Ringtone Handling
  useEffect(() => {
    if (callState === 'RINGING') {
      // Start modern mast ringtone
      ringtoneService.start();

      // Request notification permission and show real native smartphone notification
      try {
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            const notif = new Notification('📞 Incoming AI Attendance Call', {
              body: `Teacher ${incomingCall.teacherName || 'Faculty'} is calling for class attendance... Tap to answer.`,
              icon: incomingCall.teacherPhotoURL || '/icon.png',
              tag: `ai-call-${incomingCall.id}`,
              requireInteraction: true,
            });
            notif.onclick = () => {
              window.focus();
              handleAcceptCall();
            };
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
          }
        }
      } catch (e) {
        // Notification blocked or not supported
      }
    } else {
      ringtoneService.stop();
    }

    return () => {
      ringtoneService.stop();
    };
  }, [callState, incomingCall.teacherName, incomingCall.teacherPhotoURL, incomingCall.id]);

  // Sweet Indian Girl Voice Text-To-Speech (Natural SpeechSynthesis)
  const speakAI = useCallback((text: string) => {
    if (isSoundMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.96;
      utterance.pitch = 1.16; // Sweet, natural female pitch

      const selectFemaleIndianVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find(
            (v) =>
              (v.lang.includes('hi') || v.lang.includes('hi-IN')) &&
              (v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('google') ||
                v.name.toLowerCase().includes('swara') ||
                v.name.toLowerCase().includes('lekha') ||
                v.name.toLowerCase().includes('kalpana') ||
                v.name.toLowerCase().includes('heera'))
          ) ||
          voices.find(
            (v) =>
              v.lang.includes('hi') ||
              v.lang.includes('en-IN') ||
              v.name.toLowerCase().includes('india') ||
              v.name.toLowerCase().includes('zira') ||
              v.name.toLowerCase().includes('samantha')
          ) ||
          voices.find((v) => v.name.toLowerCase().includes('female')) ||
          voices[0];

        if (preferred) {
          utterance.voice = preferred;
        }
      };

      selectFemaleIndianVoice();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = selectFemaleIndianVoice;
      }

      utterance.onstart = () => {
        setIsSpeakingAI(true);
      };
      utterance.onend = () => {
        setIsSpeakingAI(false);
      };
      utterance.onerror = () => {
        setIsSpeakingAI(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsSpeakingAI(false);
    }
  }, [isSoundMuted]);

  // Forward declaration for sendStudentUtterance
  const handleProcessStudentUtterance = useCallback(
    async (spokenWords: string) => {
      const cleanText = spokenWords.trim();
      if (!cleanText || isProcessingAI) return;

      setIsProcessingAI(true);
      setLiveInterimText('');
      setStudentInput('');

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const studentEntry = {
        speaker: 'student' as const,
        text: cleanText,
        time: nowTime,
      };

      const updatedTranscript = [...transcript, studentEntry];
      setTranscript(updatedTranscript);

      // Sync partial transcript to Firestore so teacher sees it in real time
      try {
        await updateAICallSession(incomingCall.id, {
          transcript: updatedTranscript,
        });
      } catch (e) {}

      try {
        // Call continuous conversational AI backend
        const res = await fetch('/api/ai/live-call-turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: studentProfile.name,
            studentId: studentProfile.studentId || studentProfile.uid.slice(0, 8),
            teacherName: incomingCall.teacherName,
            groupName: incomingCall.groupName || incomingCall.className || 'FEA',
            studentUtterance: cleanText,
            transcriptHistory: updatedTranscript,
          }),
        });

        const data = await res.json();
        const aiReply =
          data.aiReply ||
          'Haan haan bolo, sun rahi hoon! Aaj aap class kyu nahi aa rahe ho?';

        const aiEntry = {
          speaker: 'ai' as const,
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const finalTranscript = [...updatedTranscript, aiEntry];
        setTranscript(finalTranscript);

        // Sync AI reply to Firestore
        try {
          await updateAICallSession(incomingCall.id, {
            transcript: finalTranscript,
          });
        } catch (e) {}

        // Speak AI reply in Indian girl voice
        speakAI(aiReply);

        // Check if conversation concluded
        if (data.isConversationEnding && (data.attendanceStatus === 'Attending' || data.attendanceStatus === 'Not Attending')) {
          setFinalReportSummary(data.aiSummary || `Response recorded: "${cleanText}"`);

          const reportPayload: Omit<AIStudentReport, 'id'> = {
            studentUid: studentProfile.uid,
            studentId: studentProfile.studentId || studentProfile.uid.slice(0, 8),
            studentName: studentProfile.name,
            studentPhotoURL: studentProfile.photoURL || '',
            studentPhone: studentProfile.phone || '',
            teacherUid: incomingCall.teacherUid,
            teacherName: incomingCall.teacherName,
            groupId: incomingCall.groupId || undefined,
            groupName: incomingCall.groupName || undefined,
            classId: incomingCall.classId || undefined,
            className: incomingCall.className || undefined,
            response: data.attendanceStatus === 'Attending' ? 'Attending today' : 'Not attending today',
            reason: data.extractedReason || cleanText,
            exactStudentReply: cleanText,
            aiSummary: data.aiSummary || `Student reported: "${cleanText}"`,
            callStatus: 'Completed',
            timestamp: Date.now(),
            createdAt: Date.now(),
            transcript: finalTranscript,
            conversationSnippet: finalTranscript
              .map((t) => `${t.speaker === 'ai' ? 'Classora AI' : studentProfile.name}: ${t.text}`)
              .join('\n'),
          };

          await completeAICallWithReport(incomingCall.id, reportPayload, finalTranscript);

          setTimeout(() => {
            setCallState('COMPLETED');
          }, 3500);
        }
      } catch (err) {
        console.error('Error processing student speech:', err);
      } finally {
        setIsProcessingAI(false);
      }
    },
    [incomingCall, isProcessingAI, speakAI, studentProfile, transcript]
  );

  // Setup Continuous Web Speech Recognition
  const startContinuousSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Recognizes Hindi, Hinglish and Indian English naturally

      recognition.onstart = () => {
        setIsListeningMic(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setLiveInterimText(interim);
        }

        const candidateText = finalTranscript || interim;
        if (candidateText && candidateText.trim().length > 1) {
          // Debounce auto-send when student finishes speaking
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (candidateText.trim()) {
              handleProcessStudentUtterance(candidateText.trim());
            }
          }, 1600);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListeningMic(false);
        }
      };

      recognition.onend = () => {
        // Auto-restart if call is still active and mic not muted
        if (isCallActiveRef.current && !isMicMuted) {
          try {
            recognition.start();
          } catch (e) {}
        } else {
          setIsListeningMic(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
    }
  }, [handleProcessStudentUtterance, isMicMuted]);

  // Stop Speech Recognition
  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListeningMic(false);
  }, []);

  // Answer Incoming Call
  const handleAcceptCall = async () => {
    ringtoneService.stop();
    setCallState('CONNECTED');
    isCallActiveRef.current = true;

    try {
      await answerAICall(incomingCall.id);
    } catch (e) {
      console.error('Error answering AI call:', e);
    }

    const branchName = incomingCall.groupName || incomingCall.className || 'FEA';
    const greeting =
      incomingCall.aiInitialGreeting ||
      `Hello! Main ${branchName} branch ki AI bol rahi hoon, aaj kyu nahi aa rahe ho class me?`;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setTranscript((prev) => {
      if (prev.length === 0) {
        return [{ speaker: 'ai', text: greeting, time: nowTime }];
      }
      return prev;
    });

    // AI greets verbally
    setTimeout(() => {
      speakAI(greeting);
    }, 400);

    // Start listening after greeting finishes
    setTimeout(() => {
      startContinuousSpeechRecognition();
    }, 1800);
  };

  // Decline Incoming Call
  const handleDeclineCall = async () => {
    ringtoneService.stop();
    setCallState('DECLINED');
    isCallActiveRef.current = false;
    stopSpeechRecognition();

    try {
      await declineAICall(incomingCall.id);
    } catch (e) {
      console.error('Error declining AI call:', e);
    }
    setTimeout(() => {
      onClose();
    }, 600);
  };

  // End / Cut Call Explicitly (Red Button)
  const handleCutCall = async () => {
    isCallActiveRef.current = false;
    stopSpeechRecognition();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    // Determine final status
    const studentSpokenWords =
      transcript
        .filter((t) => t.speaker === 'student')
        .map((t) => t.text)
        .join('; ') || 'Call ended by student';

    const isAttending =
      studentSpokenWords.toLowerCase().includes('aa raha') ||
      studentSpokenWords.toLowerCase().includes('aunga') ||
      studentSpokenWords.toLowerCase().includes('present') ||
      studentSpokenWords.toLowerCase().includes('attending');

    const reportPayload: Omit<AIStudentReport, 'id'> = {
      studentUid: studentProfile.uid,
      studentId: studentProfile.studentId || studentProfile.uid.slice(0, 8),
      studentName: studentProfile.name,
      studentPhotoURL: studentProfile.photoURL || '',
      studentPhone: studentProfile.phone || '',
      teacherUid: incomingCall.teacherUid,
      teacherName: incomingCall.teacherName,
      groupId: incomingCall.groupId || undefined,
      groupName: incomingCall.groupName || undefined,
      classId: incomingCall.classId || undefined,
      className: incomingCall.className || undefined,
      response: isAttending ? 'Attending today' : 'Not attending today',
      reason: studentSpokenWords,
      exactStudentReply: studentSpokenWords,
      aiSummary: `Call ended (${formatDuration(callDurationSeconds)}). Student response: "${studentSpokenWords}"`,
      callStatus: 'Completed',
      timestamp: Date.now(),
      createdAt: Date.now(),
      transcript: transcript,
      conversationSnippet: transcript
        .map((t) => `${t.speaker === 'ai' ? 'Classora AI' : studentProfile.name}: ${t.text}`)
        .join('\n'),
    };

    try {
      await completeAICallWithReport(incomingCall.id, reportPayload, transcript);
    } catch (e) {}

    setFinalReportSummary(reportPayload.aiSummary || 'Call finished.');
    setCallState('COMPLETED');
  };

  // Quick Reply chips
  const quickReplies = [
    { label: '🤒 Tabiyat kharab (Sick/Fever)', text: 'Aaj meri tabiyat kharab hai, fever hai isliye nahi aa paunga.' },
    { label: '🚗 Travelling / Bahar hoon', text: 'Main abhi bahar / travelling me hoon, aaj nahi aa paunga.' },
    { label: '🏠 Family Emergency / Kaam', text: 'Ghar par zaroori kaam hai, isliye class attend nahi kar sakta.' },
    { label: '✅ Main aa raha hoon (Attending)', text: 'Main nikal gaya hoon, 10-15 minute me class aa raha hoon.' },
  ];

  // ================= STAGE 1: INCOMING RINGING AS HEADS-UP NOTIFICATION =================
  // Pops up outside/at top of app like smartphone incoming call banner
  if (callState === 'RINGING') {
    return (
      <AnimatePresence>
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[999999] w-[95%] max-w-lg px-2 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.94 }}
            transition={{ type: 'spring', damping: 22, stiffness: 340 }}
            className="relative bg-gradient-to-r from-[#0b0e1e]/98 via-[#0f142b]/98 to-[#130d26]/98 border-2 border-cyan-500/60 rounded-3xl p-3.5 sm:p-4 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-3xl text-slate-100 overflow-hidden"
          >
            {/* Top ambient glowing accents */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/25 rounded-full blur-2xl animate-pulse pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-600/25 rounded-full blur-2xl animate-pulse pointer-events-none" />

            <div className="flex items-center justify-between gap-3 relative z-10">
              {/* Caller Avatar with Live Rings */}
              <div
                className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                onClick={handleAcceptCall}
                title="Tap to answer call"
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-purple-600 p-0.5 shadow-xl shadow-cyan-950/60 overflow-hidden">
                    {incomingCall.teacherPhotoURL ? (
                      <img
                        src={incomingCall.teacherPhotoURL}
                        alt={incomingCall.teacherName}
                        className="w-full h-full object-cover rounded-[14px]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-cyan-400">
                        <Bot className="w-7 h-7 animate-pulse" />
                      </div>
                    )}
                  </div>
                  {/* Pulsing Ring Waves */}
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 shadow" />
                </div>

                {/* Caller & Call Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                      Incoming AI Call
                    </span>
                    {/* Ringing Sound Equalizer animation */}
                    <div className="flex items-center gap-0.5 h-3" title="Melodious phone ring active">
                      <span className="w-0.5 h-full bg-cyan-400 animate-[bounce_0.6s_infinite_100ms] rounded-full" />
                      <span className="w-0.5 h-2/3 bg-purple-400 animate-[bounce_0.6s_infinite_200ms] rounded-full" />
                      <span className="w-0.5 h-full bg-emerald-400 animate-[bounce_0.6s_infinite_300ms] rounded-full" />
                      <span className="w-0.5 h-1/2 bg-cyan-400 animate-[bounce_0.6s_infinite_150ms] rounded-full" />
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-white truncate mt-0.5">
                    {incomingCall.teacherName || 'Faculty Instructor'}
                  </h3>

                  <p className="text-[11px] text-slate-300 truncate">
                    {incomingCall.groupName ? `Branch: ${incomingCall.groupName}` : 'Your Teacher'} • Calling for attendance
                  </p>
                </div>
              </div>

              {/* Action Buttons: Decline & Answer */}
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Decline Button */}
                <button
                  type="button"
                  id="decline-call-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeclineCall();
                  }}
                  className="w-11 h-11 rounded-2xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white transition shadow-lg flex items-center justify-center shrink-0 active:scale-90"
                  title="Decline Call (काटें)"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>

                {/* Answer Button */}
                <button
                  type="button"
                  id="answer-call-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcceptCall();
                  }}
                  className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition shadow-xl shadow-emerald-950/70 border border-emerald-300/40 animate-bounce active:scale-95 shrink-0"
                  title="Answer Call (उठाएं)"
                >
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                  <span>Answer</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#04060f]/92 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-[#0c0f20] to-[#070914] border border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Top Header Bar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-950/60">
                <Bot className="w-6 h-6" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                  Classora AI Voice Call
                </span>
                {callState === 'CONNECTED' && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDuration(callDurationSeconds)}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white">
                Teacher: {incomingCall.teacherName || 'Faculty Instructor'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsSoundMuted(!isSoundMuted);
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              }}
              className={`p-2.5 rounded-xl border transition ${
                isSoundMuted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={isSoundMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ================= STAGE 2: CONNECTED / ACTIVE CALL ================= */}
        {callState === 'CONNECTED' && (
          <div className="p-4 sm:p-5 flex flex-col flex-1 min-h-0 space-y-3.5 overflow-hidden">
            {/* Live Audio Status Bar */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white transition ${
                    isSpeakingAI
                      ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 animate-pulse shadow-lg shadow-cyan-950/50'
                      : isListeningMic
                      ? 'bg-gradient-to-tr from-rose-500 to-pink-600 animate-pulse shadow-lg shadow-rose-950/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isSpeakingAI ? (
                    <Volume2 className="w-5 h-5 animate-bounce" />
                  ) : isListeningMic ? (
                    <Mic className="w-5 h-5 animate-pulse text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-cyan-400" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {isSpeakingAI ? (
                      <span className="text-cyan-400 flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        AI bol rahi hai... (Sun lijiye)
                      </span>
                    ) : isListeningMic ? (
                      <span className="text-rose-400 flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                        Aap boliye... AI sun rahi hai
                      </span>
                    ) : (
                      <span className="text-slate-300">Call Connected • Tell reason or ask anything</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {studentProfile.name} (ID: {studentProfile.studentId || 'Verified'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              </div>
            </div>

            {/* Real-time Dialogue Transcript Box */}
            <div className="flex-1 min-h-[160px] max-h-[240px] overflow-y-auto bg-slate-950/95 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              {transcript.map((item, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={`flex items-start gap-2.5 text-xs ${
                    item.speaker === 'ai' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {item.speaker === 'ai' && (
                    <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl max-w-[82%] text-xs leading-relaxed ${
                      item.speaker === 'ai'
                        ? 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-sm shadow-md'
                        : 'bg-gradient-to-r from-purple-600/40 to-indigo-600/40 text-white border border-purple-500/50 rounded-tr-sm shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                      <span className="font-bold">
                        {item.speaker === 'ai' ? 'Classora AI' : studentProfile.name}
                      </span>
                      <span>{item.time}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{item.text}</p>
                  </div>

                  {item.speaker === 'student' && (
                    <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Interim Live Speech Transcript */}
              {liveInterimText && (
                <div className="flex items-start justify-end gap-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs italic animate-pulse">
                    <span className="text-[10px] font-bold text-purple-400 block mb-0.5">Speaking:</span>
                    "{liveInterimText}..."
                  </div>
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4 animate-ping" />
                  </div>
                </div>
              )}

              {isProcessingAI && (
                <div className="flex items-center gap-2 p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-xs text-cyan-300">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>AI samajh rahi hai aur reply de rahi hai...</span>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Quick Tap Attendance Buttons */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Quick Tap to Reply / Speak:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickReplies.map((qr, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={isProcessingAI}
                    onClick={() => handleProcessStudentUtterance(qr.text)}
                    className="p-2.5 text-left rounded-xl bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold text-slate-200 hover:text-white transition disabled:opacity-50"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Mic, Text input & Prominent RED "CUT CALL" Button */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              {/* Type or Voice input bar */}
              <div className="flex items-center gap-2">
                {/* Mic toggle */}
                <button
                  type="button"
                  onClick={() => {
                    if (isMicMuted) {
                      setIsMicMuted(false);
                      startContinuousSpeechRecognition();
                    } else {
                      setIsMicMuted(true);
                      stopSpeechRecognition();
                    }
                  }}
                  className={`p-3 rounded-2xl border transition flex items-center justify-center shrink-0 ${
                    isMicMuted
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : isListeningMic
                      ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-lg'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                  }`}
                  title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Text input */}
                <input
                  type="text"
                  placeholder="Type anything (e.g. hello, tabiyat kharab hai, exam kab hai?)..."
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && studentInput.trim()) {
                      handleProcessStudentUtterance(studentInput.trim());
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none transition"
                />

                {/* Send button */}
                <button
                  type="button"
                  disabled={!studentInput.trim() || isProcessingAI}
                  onClick={() => handleProcessStudentUtterance(studentInput.trim())}
                  className="p-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-2xl font-bold transition flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950/50"
                  title="Send message to AI"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Prominent Large Red "End Call / Cut Call" Button */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  id="cut-call-btn"
                  onClick={handleCutCall}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-xl shadow-rose-950/70 border border-rose-400/40 tracking-wider"
                >
                  <PhoneOff className="w-5 h-5" />
                  END CALL / CALL CUT KAREN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STAGE 3: COMPLETED ================= */}
        {callState === 'COMPLETED' && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 flex-1">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/60">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-bold text-white">Call Completed & Reason Sent!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aapka reply aur explanation Teacher <strong>{incomingCall.teacherName}</strong> ko direct AI report me successfully bhej diya gaya hai.
              </p>
              {finalReportSummary && (
                <div className="p-3.5 bg-slate-950 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 font-medium text-left mt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Delivered Report:</p>
                  "{finalReportSummary}"
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Visible privately on Teacher's AI Reports dashboard</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-7 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition shadow"
            >
              Close Window
            </button>
          </div>
        )}

        {/* ================= STAGE 4: DECLINED ================= */}
        {callState === 'DECLINED' && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 flex-1">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <PhoneOff className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">Call Declined</h3>
            <p className="text-xs text-slate-400">AI Attendance Call decline kar di gayi.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
