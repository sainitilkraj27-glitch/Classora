import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  User,
  Search,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Link as LinkIcon,
  Eye,
  LogOut,
  AlertTriangle,
  HardDrive,
  Copy,
  Check,
  Calendar,
} from 'lucide-react';
import {
  Course,
  CourseMaterial,
  UserProfile,
  MaterialType,
} from '../../types';
import {
  subscribeCourseMaterials,
  leaveCourse,
} from '../../lib/databaseService';
import { MaterialViewerModal } from '../common/MaterialViewerModal';

interface StudentCourseDetailViewProps {
  course: Course;
  userProfile: UserProfile;
  onBack: () => void;
  onLeftCourse?: () => void;
}

export const StudentCourseDetailView: React.FC<StudentCourseDetailViewProps> = ({
  course,
  userProfile,
  onBack,
  onLeftCourse,
}) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [selectedMaterialForView, setSelectedMaterialForView] = useState<CourseMaterial | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | MaterialType>('ALL');
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState(false);

  // Subscriptions
  useEffect(() => {
    const unsub = subscribeCourseMaterials(course.id, (list) => {
      setMaterials(list);
    });
    return () => unsub();
  }, [course.id]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(course.courseId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConfirmLeaveCourse = async () => {
    setIsLeaving(true);
    try {
      await leaveCourse(course.id, userProfile.uid, userProfile.name);
      setShowLeaveConfirm(false);
      if (onLeftCourse) onLeftCourse();
      onBack();
    } catch (err) {
      console.error('Error leaving course:', err);
    } finally {
      setIsLeaving(false);
    }
  };

  // Distinct Chapters list
  const chapters = Array.from(new Set(materials.map((m) => m.chapter || 'General')));

  // Filtered Materials
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      (m.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes((searchQuery || '').toLowerCase())) ||
      (m.chapter && m.chapter.toLowerCase().includes((searchQuery || '').toLowerCase()));
    const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
    const matchesChapter = selectedChapter === 'ALL' || m.chapter === selectedChapter;
    return matchesSearch && matchesType && matchesChapter;
  });

  const getMaterialTypeIcon = (type: MaterialType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-400" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      case 'video':
        return <VideoIcon className="w-4 h-4 text-blue-400" />;
      case 'notes':
        return <BookOpen className="w-4 h-4 text-amber-400" />;
      case 'link':
        return <LinkIcon className="w-4 h-4 text-cyan-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-150">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Courses
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5 transition hover:bg-purple-500/20"
            title="Copy Course ID"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {course.courseId}
          </button>

          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition flex items-center gap-1 text-xs"
            title="Leave Course"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
        {course.coverImageURL ? (
          <div className="h-36 sm:h-44 w-full relative">
            <img src={course.coverImageURL} alt={course.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
          </div>
        ) : (
          <div className="h-28 w-full bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900" />
        )}

        <div className="p-4 sm:p-6 -mt-12 sm:-mt-16 relative z-10 space-y-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {course.subject}
              </span>
              {course.category && (
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300">
                  {course.category}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{course.name}</h1>
            {course.description && (
              <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-normal">{course.description}</p>
            )}
          </div>

          {/* Teacher Info */}
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">
                {course.teacherName?.charAt(0) || 'T'}
              </div>
              <span>Instructor: <strong>{course.teacherName}</strong></span>
            </div>
            <span className="flex items-center gap-1 text-purple-300 font-semibold">
              <BookOpen className="w-3.5 h-3.5" /> {materials.length} Study Items
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search study material, chapters, formulas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {(['ALL', 'pdf', 'image', 'video', 'notes', 'link'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl uppercase text-[10px] font-bold tracking-wider transition ${
                typeFilter === t
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Chapter Selector */}
      {chapters.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedChapter('ALL')}
            className={`px-3 py-1 rounded-xl text-[11px] font-medium transition shrink-0 ${
              selectedChapter === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Chapters
          </button>
          {chapters.map((ch) => (
            <button
              key={ch}
              onClick={() => setSelectedChapter(ch)}
              className={`px-3 py-1 rounded-xl text-[11px] font-medium transition shrink-0 ${
                selectedChapter === ch
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      )}

      {/* Materials List */}
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredMaterials.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedMaterialForView(m)}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition cursor-pointer space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-purple-500/30 transition">
                    {getMaterialTypeIcon(m.type)}
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                      {m.type}
                    </span>
                    {m.chapter && (
                      <span className="text-[10px] text-slate-400 ml-2">{m.chapter}</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm tracking-tight group-hover:text-purple-300 transition">
                    {m.title}
                  </h3>
                  {m.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{m.description}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-2">
                  {m.fileSizeFormatted && m.fileSizeFormatted !== '0 B' && (
                    <span>{m.fileSizeFormatted}</span>
                  )}
                  <span>{new Date(m.uploadedAt).toLocaleDateString()}</span>
                </div>

                <span className="px-3 py-1 rounded-xl bg-purple-600/15 group-hover:bg-purple-600 group-hover:text-white text-purple-300 font-semibold flex items-center gap-1 transition">
                  <Eye className="w-3 h-3" /> View Material
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-10 text-center text-xs text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-2">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">No study material found</p>
          <p className="text-[11px] text-slate-500">
            {searchQuery || typeFilter !== 'ALL'
              ? 'Try changing your search query or filters.'
              : 'Your instructor will upload PDFs, notes, and study resources here.'}
          </p>
        </div>
      )}

      {/* Material Viewer Modal */}
      {selectedMaterialForView && (
        <MaterialViewerModal
          material={selectedMaterialForView}
          onClose={() => setSelectedMaterialForView(null)}
        />
      )}

      {/* Leave Course Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-4 h-4" /> Leave Course
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to leave <strong>{course.name}</strong>? You will lose access to its study materials until you request to join again.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLeaveCourse}
                disabled={isLeaving}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                {isLeaving ? 'Leaving...' : 'Confirm Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
