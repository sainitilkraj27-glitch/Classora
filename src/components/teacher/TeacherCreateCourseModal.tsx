import React, { useState, useRef } from 'react';
import {
  X,
  GraduationCap,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  Tag,
  AlertCircle,
  Check,
  Upload,
  Camera,
  Trash2,
} from 'lucide-react';
import { UserProfile, Course } from '../../types';
import { createCourse, generateCourseId } from '../../lib/databaseService';
import confetti from 'canvas-confetti';

interface TeacherCreateCourseModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  onCourseCreated: (course: Course) => void;
}

const PRESET_COVERS = [
  { label: 'Science / Physics', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80' },
  { label: 'Mathematics', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80' },
  { label: 'Computer Science', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80' },
  { label: 'Chemistry / Biology', url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80' },
  { label: 'Literature & Languages', url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80' },
  { label: 'Business & Economics', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80' },
];

export const TeacherCreateCourseModal: React.FC<TeacherCreateCourseModalProps> = ({
  userProfile,
  onClose,
  onCourseCreated,
}) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('High School');
  const [coverImageURL, setCoverImageURL] = useState(PRESET_COVERS[0].url);
  const [isCustomGalleryImage, setIsCustomGalleryImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preview Generated Code
  const previewCourseId = generateCourseId(subject || 'CS');

  const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select a valid image file from your gallery.');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg('Image size exceeds 15MB. Please choose a smaller image.');
        return;
      }

      setErrorMsg(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Compress / resize image for optimal quality and performance
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setCoverImageURL(dataUrl);
            setIsCustomGalleryImage(true);
          } else {
            setCoverImageURL(event.target?.result as string);
            setIsCustomGalleryImage(true);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCustomImage = () => {
    setCoverImageURL(PRESET_COVERS[0].url);
    setIsCustomGalleryImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a course name.');
      return;
    }
    if (!subject.trim()) {
      setErrorMsg('Please enter a subject.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await createCourse({
        name: name.trim(),
        subject: subject.trim(),
        description: description.trim(),
        coverImageURL: coverImageURL.trim(),
        category: category.trim(),
        teacherProfile: userProfile,
      });

      confetti({ particleCount: 70, spread: 60 });
      onCourseCreated(created);
      onClose();
    } catch (err: any) {
      console.error('Error creating course:', err);
      setErrorMsg(err.message || 'Failed to create course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Create New Course</h2>
              <p className="text-[11px] text-slate-400">Share syllabus, study material & notes with students</p>
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
          {/* Course Name */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">
              Course Title <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Class 10 Science & Advanced Physics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Subject & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">
                Subject <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Science, Math, Python"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Category / Level</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 transition"
              >
                <option value="Middle School">Middle School</option>
                <option value="High School">High School (Grade 9-12)</option>
                <option value="Undergraduate">Undergraduate / College</option>
                <option value="Competitive Exams">Competitive Exams (JEE / NEET / SAT)</option>
                <option value="Professional Skills">Professional Skills / Tech</option>
                <option value="General">General Study</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Course Description</label>
            <textarea
              rows={3}
              placeholder="Briefly describe what this course covers and what study materials will be provided..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          {/* Course Cover / Thumbnail with Gallery Upload */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>Course Thumbnail / Cover</span>
              </label>
              <span className="text-[10px] text-purple-400 font-semibold">Gallery or Presets</span>
            </div>

            {/* Hidden File Input for Device/Gallery */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleGalleryImageUpload}
              className="hidden"
            />

            {/* Active Thumbnail Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-36 w-full group">
              {coverImageURL ? (
                <img
                  src={coverImageURL}
                  alt="Course Thumbnail Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Status Badge */}
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold flex items-center gap-1">
                  {isCustomGalleryImage ? (
                    <>
                      <Camera className="w-3 h-3 text-emerald-400" /> From Your Gallery
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3 h-3 text-purple-400" /> Preset Cover
                    </>
                  )}
                </span>
              </div>

              {/* Overlay Action Buttons */}
              <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 backdrop-blur-md shadow-lg transition"
                >
                  <Upload className="w-3.5 h-3.5" /> Choose from Gallery / Photos
                </button>

                {isCustomGalleryImage && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomImage}
                    className="p-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white backdrop-blur-md transition"
                    title="Reset to preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Presets Option Row */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Or pick from standard presets:</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {PRESET_COVERS.map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setCoverImageURL(preset.url);
                      setIsCustomGalleryImage(false);
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-video border transition ${
                      coverImageURL === preset.url && !isCustomGalleryImage
                        ? 'border-purple-500 ring-2 ring-purple-500/50 scale-[1.02]'
                        : 'border-slate-800 hover:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    {coverImageURL === preset.url && !isCustomGalleryImage && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                        <Check className="w-2 h-2" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Auto Unique Course ID Notice */}
          <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/25 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                Auto-Generated Course ID
              </p>
              <p className="font-mono text-sm font-bold text-white tracking-widest mt-0.5">
                {previewCourseId}
              </p>
            </div>
            <span className="text-[10px] text-slate-400 max-w-[170px] text-right">
              Students will search this exact ID to find and join.
            </span>
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
                  <Sparkles className="w-4 h-4" /> Create Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
