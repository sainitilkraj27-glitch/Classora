import React, { useState } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  BookOpen,
  Link as LinkIcon,
  Upload,
  Sparkles,
  AlertCircle,
  HardDrive,
  Check,
} from 'lucide-react';
import { UserProfile, Course, CourseMaterial, MaterialType } from '../../types';
import { uploadCourseMaterial, formatBytes } from '../../lib/databaseService';
import confetti from 'canvas-confetti';

interface TeacherAddMaterialModalProps {
  course: Course;
  userProfile: UserProfile;
  onClose: () => void;
  onMaterialAdded: (material: CourseMaterial) => void;
}

const MATERIAL_TYPES: { type: MaterialType; label: string; icon: any; color: string }[] = [
  { type: 'pdf', label: 'PDF Document', icon: FileText, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { type: 'image', label: 'Photo / Image', icon: ImageIcon, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { type: 'video', label: 'Video Lecture', icon: VideoIcon, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { type: 'notes', label: 'Notes / Text', icon: BookOpen, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { type: 'link', label: 'External Link', icon: LinkIcon, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
];

export const TeacherAddMaterialModal: React.FC<TeacherAddMaterialModalProps> = ({
  course,
  userProfile,
  onClose,
  onMaterialAdded,
}) => {
  const [type, setType] = useState<MaterialType>('pdf');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chapter, setChapter] = useState('Chapter 1');
  const [textContent, setTextContent] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Size check (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setErrorMsg('File size exceeds 50MB limit.');
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
      if (!title) {
        // Auto populate title from file name without extension
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setTitle(cleanName.replace(/[_-]/g, ' '));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a material title.');
      return;
    }

    if ((type === 'pdf' || type === 'image' || type === 'video') && !selectedFile) {
      setErrorMsg(`Please select a ${type.toUpperCase()} file to upload.`);
      return;
    }

    if (type === 'notes' && !textContent.trim()) {
      setErrorMsg('Please enter the study notes content.');
      return;
    }

    if (type === 'link' && !externalLink.trim()) {
      setErrorMsg('Please enter a valid external link.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const material = await uploadCourseMaterial(
        course.id,
        {
          title: title.trim(),
          description: description.trim(),
          type,
          chapter: chapter.trim() || 'General',
          textContent: textContent.trim(),
          externalLink: externalLink.trim(),
          uploadedBy: userProfile.uid,
          uploadedByName: userProfile.name,
        },
        selectedFile || undefined
      );

      confetti({ particleCount: 60, spread: 50 });
      onMaterialAdded(material);
      onClose();
    } catch (err: any) {
      console.error('Error adding material:', err);
      setErrorMsg(err.message || 'Failed to upload material.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Add Study Material</h2>
              <p className="text-[11px] text-slate-400">Course: {course.name} ({course.courseId})</p>
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
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Material Type Selector */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Select Material Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MATERIAL_TYPES.map((m) => {
                const Icon = m.icon;
                const isSelected = type === m.type;
                return (
                  <button
                    type="button"
                    key={m.type}
                    onClick={() => {
                      setType(m.type);
                      setSelectedFile(null);
                    }}
                    className={`p-2.5 rounded-2xl border flex items-center gap-2 text-left transition ${
                      isSelected
                        ? `${m.color} ring-1 ring-purple-500`
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-semibold text-[11px] truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chapter / Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Chapter / Topic</label>
              <input
                type="text"
                placeholder="e.g. Chapter 1 — Chemical Reactions"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">
                Material Title <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Full Revision Notes PDF"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          {/* Type-Specific Input */}
          {(type === 'pdf' || type === 'image' || type === 'video') && (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">
                Upload {type.toUpperCase()} File <span className="text-purple-400">*</span>
              </label>
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/60 hover:border-purple-500/50 transition text-center space-y-2">
                <input
                  type="file"
                  id="material-file-input"
                  accept={
                    type === 'pdf'
                      ? '.pdf,.doc,.docx,.ppt,.pptx'
                      : type === 'image'
                      ? 'image/*'
                      : 'video/*'
                  }
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="material-file-input"
                  className="cursor-pointer block space-y-1"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-slate-200">
                    {selectedFile ? selectedFile.name : `Click to browse ${type.toUpperCase()} file`}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedFile
                      ? `Size: ${formatBytes(selectedFile.size)}`
                      : 'Supports up to 50MB files'}
                  </p>
                </label>
              </div>
            </div>
          )}

          {type === 'notes' && (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">
                Study Notes / Text Content <span className="text-purple-400">*</span>
              </label>
              <textarea
                rows={5}
                required
                placeholder="Write or paste your comprehensive study notes, key formulas, bullet points, or lecture summary here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none font-mono text-xs leading-relaxed"
              />
            </div>
          )}

          {type === 'link' && (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">
                External Resource URL <span className="text-purple-400">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://drive.google.com/... or https://youtube.com/..."
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Brief Note / Instructions</label>
            <textarea
              rows={2}
              placeholder="Optional note for students regarding this material..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold transition shadow-lg shadow-purple-950/50 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Upload Material
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
