import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  PlusCircle,
  BookOpen,
  Sparkles,
  Layers,
  Volume2,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { EnglishMaterial, EnglishMaterialCategory, UserProfile } from '../../types';
import { addEnglishMaterial, updateEnglishMaterial, deleteEnglishMaterial } from '../../lib/databaseService';

interface TeacherManageEnglishModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: UserProfile;
  editingItem?: EnglishMaterial | null;
  teacherMaterials: EnglishMaterial[];
}

export const TeacherManageEnglishModal: React.FC<TeacherManageEnglishModalProps> = ({
  isOpen,
  onClose,
  teacher,
  editingItem = null,
  teacherMaterials,
}) => {
  const [activeTab, setActiveTab] = useState<'ADD' | 'MANAGE_EXISTING'>('ADD');
  const [category, setCategory] = useState<EnglishMaterialCategory>(editingItem?.category || 'verb');

  // Form Fields
  const [title, setTitle] = useState(editingItem?.title || '');
  const [hindiMeaning, setHindiMeaning] = useState(editingItem?.hindiMeaning || '');
  const [v1, setV1] = useState(editingItem?.v1 || '');
  const [v2, setV2] = useState(editingItem?.v2 || '');
  const [v3, setV3] = useState(editingItem?.v3 || '');
  const [v4_ing, setV4_ing] = useState(editingItem?.v4_ing || '');
  const [v5_s_es, setV5_s_es] = useState(editingItem?.v5_s_es || '');
  const [tenseFormula, setTenseFormula] = useState(editingItem?.tenseFormula || '');
  const [identificationHindi, setIdentificationHindi] = useState(editingItem?.identificationHindi || '');
  const [englishText, setEnglishText] = useState(editingItem?.englishText || '');
  const [hindiText, setHindiText] = useState(editingItem?.hindiText || '');
  const [exampleSentence, setExampleSentence] = useState(editingItem?.exampleSentence || '');
  const [exampleHindi, setExampleHindi] = useState(editingItem?.exampleHindi || '');
  const [explanation, setExplanation] = useState(editingItem?.explanation || '');
  const [mistakeToAvoid, setMistakeToAvoid] = useState(editingItem?.mistakeToAvoid || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !v1.trim() && !englishText.trim()) {
      setStatusMsg({ text: 'Please fill in the primary English title or text.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const payload: Omit<EnglishMaterial, 'id'> = {
        category,
        title: title.trim() || v1.trim() || englishText.trim(),
        hindiMeaning: hindiMeaning.trim() || hindiText.trim(),
        englishText: englishText.trim() || v1.trim() || title.trim(),
        hindiText: hindiText.trim() || hindiMeaning.trim(),
        v1: v1.trim() || undefined,
        v2: v2.trim() || undefined,
        v3: v3.trim() || undefined,
        v4_ing: v4_ing.trim() || undefined,
        v5_s_es: v5_s_es.trim() || undefined,
        tenseFormula: tenseFormula.trim() || undefined,
        identificationHindi: identificationHindi.trim() || undefined,
        exampleSentence: exampleSentence.trim() || undefined,
        exampleHindi: exampleHindi.trim() || undefined,
        explanation: explanation.trim() || undefined,
        mistakeToAvoid: mistakeToAvoid.trim() || undefined,
        addedByTeacherUid: teacher.uid,
        addedByTeacherName: teacher.name,
        isTeacherCustom: true,
        createdAt: editingItem?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      if (editingItem) {
        await updateEnglishMaterial(editingItem.id, payload);
        setStatusMsg({ text: 'Material updated successfully!', type: 'success' });
      } else {
        await addEnglishMaterial(payload);
        setStatusMsg({ text: 'New English material added for all students!', type: 'success' });
        // Reset form
        setTitle('');
        setHindiMeaning('');
        setV1('');
        setV2('');
        setV3('');
        setV4_ing('');
        setV5_s_es('');
        setTenseFormula('');
        setIdentificationHindi('');
        setEnglishText('');
        setHindiText('');
        setExampleSentence('');
        setExampleHindi('');
        setExplanation('');
        setMistakeToAvoid('');
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('Error saving English material:', err);
      setStatusMsg({ text: err.message || 'Failed to save material.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this English material?')) return;
    try {
      await deleteEnglishMaterial(id);
    } catch (e) {
      console.error('Error deleting material:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-[#0c0f20] to-[#070914] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 my-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {editingItem ? 'Edit English Material' : 'Teacher Control: Add Material'}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Faculty Admin
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Verbs, Tenses, Sentences & Grammar notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ADD')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'ADD'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {editingItem ? 'Edit Selected' : '+ Upload New Item'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MANAGE_EXISTING')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'MANAGE_EXISTING'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Manage Uploaded ({teacherMaterials.length})
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`mt-3 p-3 rounded-2xl text-xs flex items-center gap-2 shrink-0 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* TAB 1: ADD / EDIT FORM */}
        {activeTab === 'ADD' && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 overflow-y-auto pr-1 flex-1">
            {/* Category Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                Category (सामग्री का प्रकार):
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'verb', label: 'Verb (क्रिया)' },
                  { id: 'tense', label: 'Tense (काल)' },
                  { id: 'sentence', label: 'Sentence' },
                  { id: 'grammar', label: 'Grammar' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id as EnglishMaterialCategory)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition ${
                      category === c.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* VERB SPECIFIC FIELDS */}
            {category === 'verb' && (
              <div className="space-y-3 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Verb Forms (क्रिया के रूप)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">V1 Base (e.g. write)</label>
                    <input
                      type="text"
                      required
                      value={v1}
                      onChange={(e) => {
                        setV1(e.target.value);
                        if (!title) setTitle(e.target.value);
                      }}
                      placeholder="write"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">V2 Past (e.g. wrote)</label>
                    <input
                      type="text"
                      required
                      value={v2}
                      onChange={(e) => setV2(e.target.value)}
                      placeholder="wrote"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">V3 Participle</label>
                    <input
                      type="text"
                      required
                      value={v3}
                      onChange={(e) => setV3(e.target.value)}
                      placeholder="written"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">V4 (-ing)</label>
                    <input
                      type="text"
                      value={v4_ing}
                      onChange={(e) => setV4_ing(e.target.value)}
                      placeholder="writing"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">V5 (-s/es)</label>
                    <input
                      type="text"
                      value={v5_s_es}
                      onChange={(e) => setV5_s_es(e.target.value)}
                      placeholder="writes"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Hindi Meaning (अर्थ)</label>
                  <input
                    type="text"
                    required
                    value={hindiMeaning}
                    onChange={(e) => setHindiMeaning(e.target.value)}
                    placeholder="लिखना / पत्र लिखना"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* TENSE SPECIFIC FIELDS */}
            {category === 'tense' && (
              <div className="space-y-3 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Tense Formula & Rules
                </span>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Tense Name</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Simple Present / Past Continuous"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Hindi Identification (पहचान)</label>
                  <input
                    type="text"
                    value={identificationHindi}
                    onChange={(e) => setIdentificationHindi(e.target.value)}
                    placeholder="ता है, ती है, ते हैं"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Formula / Structure</label>
                  <input
                    type="text"
                    value={tenseFormula}
                    onChange={(e) => setTenseFormula(e.target.value)}
                    placeholder="Subject + V1(s/es) + Object"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* SENTENCE OR GRAMMAR SPECIFIC FIELDS */}
            {(category === 'sentence' || category === 'grammar') && (
              <div className="space-y-3 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">English Sentence / Title</label>
                  <input
                    type="text"
                    required
                    value={englishText || title}
                    onChange={(e) => {
                      setEnglishText(e.target.value);
                      setTitle(e.target.value);
                    }}
                    placeholder="Could you please explain this topic?"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Hindi Translation / Meaning</label>
                  <input
                    type="text"
                    required
                    value={hindiText || hindiMeaning}
                    onChange={(e) => {
                      setHindiText(e.target.value);
                      setHindiMeaning(e.target.value);
                    }}
                    placeholder="क्या आप कृपया यह विषय समझा सकते हैं?"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* COMMON EXAMPLES & EXPLANATION */}
            <div className="space-y-2.5 p-3.5 bg-slate-950/60 border border-slate-800/60 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Examples & Student Guidance (Optional)
              </span>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Example Sentence (English)</label>
                <input
                  type="text"
                  value={exampleSentence}
                  onChange={(e) => setExampleSentence(e.target.value)}
                  placeholder="I wrote an email to the principal."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Example Hindi Translation</label>
                <input
                  type="text"
                  value={exampleHindi}
                  onChange={(e) => setExampleHindi(e.target.value)}
                  placeholder="मैंने प्राचार्य जी को एक ईमेल लिखा।"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Common Mistake Alert (कहाँ गलती होती है)</label>
                <input
                  type="text"
                  value={mistakeToAvoid}
                  onChange={(e) => setMistakeToAvoid(e.target.value)}
                  placeholder='गलती: "Did you wrote?" ❌ -> सही: "Did you write?" ✅'
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : editingItem ? 'Update Material' : 'Upload & Publish for Students'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MANAGE EXISTING ITEMS */}
        {activeTab === 'MANAGE_EXISTING' && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
            {teacherMaterials.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No custom materials uploaded yet. Use the "+ Upload New Item" tab above to add custom verbs, tenses or sentences!
              </div>
            ) : (
              teacherMaterials.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate">
                        {item.title || item.v1 || item.englishText}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.hindiMeaning || item.hindiText}
                    </p>
                    {item.v1 && (
                      <p className="text-[10px] font-mono text-cyan-300 mt-1">
                        Forms: {item.v1} • {item.v2} • {item.v3}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                      title="Delete material"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
