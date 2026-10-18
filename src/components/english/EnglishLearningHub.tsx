import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  Volume2,
  Mic,
  MicOff,
  Send,
  Search,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  Bot,
  User,
  ArrowRight,
  Filter,
  RefreshCw,
  Clock,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { UserProfile, EnglishMaterial } from '../../types';
import {
  BUILTIN_TENSES,
  BUILTIN_VERBS,
  BUILTIN_SENTENCES,
  BUILTIN_GRAMMAR_RULES,
  VerbDetail,
} from '../../data/englishLearningData';
import { subscribeEnglishMaterials } from '../../lib/databaseService';
import { TeacherManageEnglishModal } from './TeacherManageEnglishModal';

interface EnglishLearningHubProps {
  userProfile: UserProfile;
}

type EnglishSubTab = 'AI_TUTOR' | 'VERBS' | 'TENSES' | 'SENTENCES' | 'GRAMMAR';

interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  detectedType?: string;
  primaryEnglish?: string;
  alternatives?: string[];
  hasMistake?: boolean;
  mistakeAnalysis?: string;
  aiExplanation?: string;
  vocabTips?: Array<{ word: string; meaning: string }>;
  time: string;
}

export const EnglishLearningHub: React.FC<EnglishLearningHubProps> = ({ userProfile }) => {
  const [subTab, setSubTab] = useState<EnglishSubTab>('AI_TUTOR');
  const [teacherMaterials, setTeacherMaterials] = useState<EnglishMaterial[]>([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);

  // AI Chat States
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: 'Namaste! Main hoon aapka English Guru AI. Aap mujhse Hindi me koi bhi sentence likh kar pooch sakte hain—main use natural English me translate kar dunga! Aur agar aap English ka koi galat sentence likhenge, toh main use sahi karke bataunga ki kahan galti thi.',
      primaryEnglish: 'Hello! Welcome to Classora English Hub. Practice, translate, and correct your English anytime.',
      alternatives: ['Feel free to type in Hindi or English.'],
      aiExplanation: 'Hindi sentence likhiye translation ke liye, ya koi English sentence check karwayiye!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Verbs Filter & Search
  const [verbSearch, setVerbSearch] = useState('');
  const [selectedVerbCategory, setSelectedVerbCategory] = useState<string>('All');

  // Tenses Filter
  const [selectedTenseCategory, setSelectedTenseCategory] = useState<'All' | 'Present' | 'Past' | 'Future'>('All');

  // Sentences Filter & Search
  const [sentenceSearch, setSentenceSearch] = useState('');
  const [selectedSentenceCategory, setSelectedSentenceCategory] = useState<string>('All');

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Real-time Firestore subscription to teacher-uploaded materials
  useEffect(() => {
    const unsub = subscribeEnglishMaterials((data) => {
      setTeacherMaterials(data || []);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);

  // Speech Synthesis helper
  const speakEnglish = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.92;
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
      if (enVoice) utterance.voice = enVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Speech Recognition (Mic)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

    if (isListeningMic) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningMic(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Allows speaking in Hindi or English
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningMic(true);
      };

      recognition.onresult = (event: any) => {
        const transcriptText = event.results[0][0].transcript;
        if (transcriptText) {
          setUserInput(transcriptText);
        }
        setIsListeningMic(false);
      };

      recognition.onerror = () => {
        setIsListeningMic(false);
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Mic start error:', err);
      setIsListeningMic(false);
    }
  };

  // Handle AI Submission
  const handleSendToAI = async (messageToSend?: string) => {
    const text = (messageToSend || userInput).trim();
    if (!text || isAiLoading) return;

    setUserInput('');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userEntry: AIChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      time: nowTime,
    };

    setChatMessages((prev) => [...prev, userEntry]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/english-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userName: userProfile.name,
        }),
      });

      const data = await res.json();

      const aiEntry: AIChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.primaryEnglish || 'Here is the English expression.',
        detectedType: data.detectedType,
        primaryEnglish: data.primaryEnglish,
        alternatives: data.alternatives || [],
        hasMistake: data.hasMistake,
        mistakeAnalysis: data.mistakeAnalysis,
        aiExplanation: data.aiExplanation,
        vocabTips: data.vocabTips || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, aiEntry]);

      // Automatically speak English translation or correction
      if (data.primaryEnglish) {
        speakEnglish(data.primaryEnglish);
      }
    } catch (err: any) {
      console.error('English tutor request failed:', err);
      const fallbackEntry: AIChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I could not connect right now. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, fallbackEntry]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Quick prompt chips
  const quickChips = [
    { label: '🇮🇳 Translate Hindi', text: 'मुझे कल सुबह जल्दी निकलना पड़ेगा क्योंकि मेरी परीक्षा है।' },
    { label: '❌ Check Grammar Mistake', text: 'I am agree with your opinion, he do not know anything.' },
    { label: '🗣️ College Absence Reason', text: 'कल मेरी तबियत खराब थी इसलिए मैं क्लास नहीं आ पाया।' },
    { label: '📝 Did Rule Doubt', text: 'Did ke baad went aayega ya go aayega? Samjha do.' },
  ];

  // Merge Built-in Verbs with Teacher Uploaded Verbs
  const allVerbs: VerbDetail[] = [
    ...BUILTIN_VERBS,
    ...teacherMaterials
      .filter((m) => m.category === 'verb' && m.v1)
      .map((m) => ({
        v1: m.v1 || '',
        v2: m.v2 || '',
        v3: m.v3 || '',
        v4: m.v4_ing || `${m.v1}ing`,
        v5: m.v5_s_es || `${m.v1}s`,
        hindi: m.hindiMeaning || m.hindiText || '',
        exampleEn: m.exampleSentence || `Always ${m.v1} carefully.`,
        exampleHi: m.exampleHindi || `ध्यानपूर्वक ${m.hindiMeaning || 'करें'}।`,
        category: 'Common' as const,
      })),
  ];

  const filteredVerbs = allVerbs.filter((v) => {
    const matchesSearch =
      v.v1.toLowerCase().includes(verbSearch.toLowerCase()) ||
      v.v2.toLowerCase().includes(verbSearch.toLowerCase()) ||
      v.v3.toLowerCase().includes(verbSearch.toLowerCase()) ||
      v.hindi.toLowerCase().includes(verbSearch.toLowerCase());
    const matchesCat = selectedVerbCategory === 'All' || v.category === selectedVerbCategory;
    return matchesSearch && matchesCat;
  });

  const filteredTenses = BUILTIN_TENSES.filter((t) => {
    return selectedTenseCategory === 'All' || t.category === selectedTenseCategory;
  });

  // Merge Built-in Sentences with Teacher Uploaded Sentences
  const allSentences = [
    ...BUILTIN_SENTENCES,
    ...teacherMaterials
      .filter((m) => m.category === 'sentence')
      .map((m) => ({
        en: m.englishText || m.title,
        hi: m.hindiText || m.hindiMeaning,
        category: 'College & Class' as const,
        contextTip: m.mistakeToAvoid || 'Teacher Recommended',
      })),
  ];

  const filteredSentences = allSentences.filter((s) => {
    const matchesSearch =
      s.en.toLowerCase().includes(sentenceSearch.toLowerCase()) ||
      s.hi.toLowerCase().includes(sentenceSearch.toLowerCase());
    const matchesCat = selectedSentenceCategory === 'All' || s.category === selectedSentenceCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4 pb-20 max-w-lg mx-auto">
      {/* Top Banner / Heading */}
      <div className="pt-1 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/50">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              English Learning Hub
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Spoken & Grammar
              </span>
            </h1>
            <p className="text-xs text-slate-400">Verbs, Tenses, Daily Sentences & AI Tutor</p>
          </div>
        </div>

        {/* Teacher Upload / Manage Button */}
        {userProfile.role === 'teacher' && (
          <button
            type="button"
            onClick={() => setShowTeacherModal(true)}
            className="px-3 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5"
            title="Upload and update materials for all students"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Material</span>
          </button>
        )}
      </div>

      {/* Teacher Control Notification Pill */}
      {userProfile.role === 'teacher' && (
        <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl flex items-center justify-between text-xs text-purple-200">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong>Teacher Control:</strong> You can add new Verbs, Tenses or Sentences for all students.
            </span>
          </div>
          <button
            onClick={() => setShowTeacherModal(true)}
            className="text-[11px] font-bold text-cyan-300 underline shrink-0 hover:text-white"
          >
            Manage ({teacherMaterials.length})
          </button>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'AI_TUTOR', label: 'AI Tutor', icon: Sparkles },
          { id: 'VERBS', label: 'Verbs (V1-V3)', icon: Layers },
          { id: 'TENSES', label: 'All 12 Tenses', icon: Clock },
          { id: 'SENTENCES', label: 'Daily Sentences', icon: BookOpen },
          { id: 'GRAMMAR', label: 'Grammar Rules', icon: HelpCircle },
        ].map((tab) => {
          const isActive = subTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as EnglishSubTab)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: AI TUTOR (CHAT & TRANSLATOR & MISTAKE CHECKER) ==================== */}
      {subTab === 'AI_TUTOR' && (
        <div className="space-y-3">
          {/* Quick Guidance Box */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-1">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-cyan-400" />
              Classora AI English Guru Capabilities:
            </div>
            <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-0.5">
              <li><strong>Hindi to English:</strong> Type any sentence in Hindi, AI translates it into correct spoken English.</li>
              <li><strong>Mistake Correction:</strong> Type any broken English sentence, AI pinpoints mistakes & explains rules.</li>
              <li><strong>Audio Pronunciation:</strong> Tap the speaker button anytime to hear native pronunciation.</li>
            </ul>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setUserInput(chip.text);
                  handleSendToAI(chip.text);
                }}
                className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-semibold text-slate-300 hover:text-white transition shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Chat Transcript Area */}
          <div className="min-h-[280px] max-h-[380px] overflow-y-auto bg-slate-950/95 border border-slate-800 rounded-3xl p-3.5 space-y-3.5">
            {chatMessages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex items-start gap-2.5 text-xs ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] space-y-2 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600/40 to-indigo-600/40 text-white border border-purple-500/50 rounded-tr-sm shadow-md'
                      : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-sm shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-70">
                    <span className="font-bold">
                      {msg.sender === 'user' ? userProfile.name : 'Classora English Guru'}
                    </span>
                    <span>{msg.time}</span>
                  </div>

                  {/* Message body */}
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* AI Structured Response Cards */}
                  {msg.sender === 'ai' && msg.primaryEnglish && (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      {/* Mistake analysis alert if user made an English error */}
                      {msg.hasMistake && msg.mistakeAnalysis && (
                        <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-[11px] space-y-1">
                          <div className="font-bold text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            यहाँ गलती थी (Mistake Detected):
                          </div>
                          <p>{msg.mistakeAnalysis}</p>
                        </div>
                      )}

                      {/* Primary English Output with Speak and Copy */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                            {msg.hasMistake ? '✅ Correct English:' : '🇬🇧 Best English:'}
                          </span>
                          <span className="text-white font-bold text-xs">
                            {msg.primaryEnglish}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => speakEnglish(msg.primaryEnglish!)}
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition"
                            title="Listen Pronunciation"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.primaryEnglish!, msg.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Copy sentence"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Conversational Explanation in Hindi */}
                      {msg.aiExplanation && (
                        <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                          <strong className="text-cyan-300">Guru's Tip: </strong>
                          {msg.aiExplanation}
                        </div>
                      )}

                      {/* Alternatives if available */}
                      {msg.alternatives && msg.alternatives.length > 0 && (
                        <div className="space-y-1 text-[11px]">
                          <span className="text-[10px] font-bold text-slate-400">Other natural ways:</span>
                          {msg.alternatives.map((alt, i) => (
                            <div key={i} className="text-slate-300 flex items-center justify-between gap-1">
                              <span>• {alt}</span>
                              <button
                                type="button"
                                onClick={() => speakEnglish(alt)}
                                className="text-cyan-400 hover:text-white p-0.5"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Vocabulary Tips */}
                      {msg.vocabTips && msg.vocabTips.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {msg.vocabTips.map((vt, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-300"
                            >
                              <strong>{vt.word}</strong>: {vt.meaning}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            ))}

            {isAiLoading && (
              <div className="flex items-center gap-2 p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-xs text-cyan-300 animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Classora AI is analyzing grammar and translating...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar */}
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-3xl flex items-center gap-2 shadow-lg">
            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-3 rounded-2xl border transition flex items-center justify-center shrink-0 ${
                isListeningMic
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-lg'
                  : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-800'
              }`}
              title={isListeningMic ? 'Stop Mic' : 'Speak in Hindi or English'}
            >
              {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input Field */}
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendToAI();
              }}
              placeholder="Hindi me likhein ya English check karwayein..."
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none px-2"
            />

            {/* Send Button */}
            <button
              type="button"
              disabled={!userInput.trim() || isAiLoading}
              onClick={() => handleSendToAI()}
              className="p-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-2xl font-bold transition flex items-center justify-center shrink-0 shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: VERBS (V1, V2, V3, V4, V5) ==================== */}
      {subTab === 'VERBS' && (
        <div className="space-y-3">
          {/* Search and Category Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={verbSearch}
                onChange={(e) => setVerbSearch(e.target.value)}
                placeholder="Search verb (e.g. write, wrote, लिखना)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {['All', 'Daily Routine', 'Academic & Work', 'Action', 'Common'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedVerbCategory(cat)}
                  className={`py-1.5 px-3 rounded-xl font-semibold transition shrink-0 ${
                    selectedVerbCategory === cat
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Verbs List Cards */}
          <div className="space-y-2.5">
            <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
              <span>Showing {filteredVerbs.length} verbs with all 5 forms:</span>
              <span className="font-mono text-cyan-400">V1 • V2 • V3 • V4 • V5</span>
            </div>

            {filteredVerbs.map((v, i) => (
              <div
                key={i}
                className="p-3.5 bg-slate-900/90 border border-slate-800/90 rounded-2xl space-y-2 shadow-sm hover:border-cyan-500/40 transition"
              >
                {/* Top Row: Base verb, Hindi Meaning, Speak button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white capitalize">{v.v1}</h3>
                    <span className="text-xs text-cyan-300 font-semibold">• {v.hindi}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakEnglish(`${v.v1}, ${v.v2}, ${v.v3}`)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                    title="Listen verb forms"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 5 Verb Forms Grid */}
                <div className="grid grid-cols-5 gap-1.5 text-center text-[11px]">
                  <div className="p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[9px] font-bold text-slate-500 block">V1 (Base)</span>
                    <span className="font-bold text-cyan-300">{v.v1}</span>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[9px] font-bold text-slate-500 block">V2 (Past)</span>
                    <span className="font-bold text-indigo-300">{v.v2}</span>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[9px] font-bold text-slate-500 block">V3 (Participle)</span>
                    <span className="font-bold text-purple-300">{v.v3}</span>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[9px] font-bold text-slate-500 block">V4 (-ing)</span>
                    <span className="text-slate-300">{v.v4}</span>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[9px] font-bold text-slate-500 block">V5 (-s/es)</span>
                    <span className="text-slate-300">{v.v5}</span>
                  </div>
                </div>

                {/* Practical Example Sentence */}
                <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs flex items-center justify-between gap-2">
                  <div>
                    <p className="text-white font-medium">{v.exampleEn}</p>
                    <p className="text-[11px] text-slate-400">{v.exampleHi}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakEnglish(v.exampleEn)}
                    className="p-1 text-slate-400 hover:text-cyan-400 transition shrink-0"
                    title="Listen example"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: TENSES MASTER (ALL 12 TENSES) ==================== */}
      {subTab === 'TENSES' && (
        <div className="space-y-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            {(['All', 'Present', 'Past', 'Future'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedTenseCategory(cat)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  selectedTenseCategory === cat
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tenses Accordion / Cards */}
          <div className="space-y-3">
            {filteredTenses.map((tense) => (
              <div
                key={tense.id}
                className="p-4 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3 shadow-md"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{tense.name}</h3>
                    <p className="text-xs text-cyan-300 font-semibold">{tense.hindiName}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                    {tense.category}
                  </span>
                </div>

                {/* Identification rule */}
                <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                  <span className="text-[10px] font-bold text-amber-400 block mb-0.5">
                    हिंदी में पहचान:
                  </span>
                  <p className="text-slate-200">{tense.identificationHindi}</p>
                </div>

                {/* Formula Boxes */}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-300">
                    <span className="text-[9px] font-sans font-bold text-emerald-400 uppercase block mb-0.5">
                      Affirmative (+) Formula:
                    </span>
                    {tense.affirmativeFormula}
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-rose-500/30 text-rose-300">
                    <span className="text-[9px] font-sans font-bold text-rose-400 uppercase block mb-0.5">
                      Negative (-) Formula:
                    </span>
                    {tense.negativeFormula}
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-cyan-500/30 text-cyan-300">
                    <span className="text-[9px] font-sans font-bold text-cyan-400 uppercase block mb-0.5">
                      Interrogative (?) Formula:
                    </span>
                    {tense.interrogativeFormula}
                  </div>
                </div>

                {/* Practical Examples */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Examples (उदाहरण):
                  </span>
                  {tense.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-white font-medium">{ex.en}</p>
                        <p className="text-[11px] text-slate-400">{ex.hi}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => speakEnglish(ex.en)}
                        className="p-1 text-slate-400 hover:text-cyan-400 transition shrink-0"
                        title="Listen"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Mistake to Avoid */}
                {tense.mistakeToAvoid && (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-[11px] leading-relaxed">
                    <strong className="text-rose-300">सावधानी: </strong>
                    {tense.mistakeToAvoid}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: DAILY SENTENCES ==================== */}
      {subTab === 'SENTENCES' && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sentenceSearch}
              onChange={(e) => setSentenceSearch(e.target.value)}
              placeholder="Search phrases (e.g. excuse me, college, assignment, समय)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {['All', 'College & Class', 'Daily Routine', 'Polite & Etiquette', 'Travel & Market', 'Confidence & Fluency'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedSentenceCategory(cat)}
                className={`py-1.5 px-3 rounded-xl font-semibold transition shrink-0 ${
                  selectedSentenceCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sentences List */}
          <div className="space-y-2">
            {filteredSentences.map((s, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-sm hover:border-cyan-500/30 transition"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-white font-bold leading-relaxed">{s.en}</p>
                  <p className="text-[11px] text-slate-300">{s.hi}</p>
                  {s.contextTip && (
                    <span className="text-[10px] text-cyan-400 block pt-0.5">
                      💡 {s.contextTip}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => speakEnglish(s.en)}
                    className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition"
                    title="Listen pronunciation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(s.en, `s-${idx}`)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
                    title="Copy sentence"
                  >
                    {copiedId === `s-${idx}` ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 5: GRAMMAR RULES & PREPOSITIONS ==================== */}
      {subTab === 'GRAMMAR' && (
        <div className="space-y-3">
          {BUILTIN_GRAMMAR_RULES.map((rule, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-white">{rule.title}</h3>
                  <p className="text-xs text-cyan-300 font-semibold">{rule.hindiTitle}</p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                  {rule.category}
                </span>
              </div>

              {/* Rule formula */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs font-mono text-cyan-300">
                <span className="text-[9px] font-sans font-bold text-slate-400 uppercase block mb-0.5">
                  Grammar Rule:
                </span>
                {rule.ruleFormula}
              </div>

              {/* Explanation in Hindi */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                {rule.hindiExplanation}
              </p>

              {/* Examples */}
              <div className="space-y-1.5">
                {rule.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-white font-medium">{ex.en}</p>
                      <p className="text-[11px] text-slate-400">{ex.hi}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakEnglish(ex.en)}
                      className="p-1 text-slate-400 hover:text-cyan-400 transition shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teacher Modal to Add / Update Materials */}
      {showTeacherModal && userProfile.role === 'teacher' && (
        <TeacherManageEnglishModal
          isOpen={showTeacherModal}
          onClose={() => setShowTeacherModal(false)}
          teacher={userProfile}
          teacherMaterials={teacherMaterials}
        />
      )}
    </div>
  );
};
