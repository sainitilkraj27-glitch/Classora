import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Search,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Link as LinkIcon,
  ExternalLink,
  Eye,
  UserCheck,
  UserX,
  UserMinus,
  AlertTriangle,
  HardDrive,
  Calendar,
  CheckCircle2,
  Upload,
  Camera,
} from 'lucide-react';
import {
  Course,
  CourseMaterial,
  CourseStudent,
  CourseJoinRequest,
  UserProfile,
  MaterialType,
} from '../../types';
import {
  subscribeCourseMaterials,
  subscribeCourseStudents,
  subscribeCourseJoinRequests,
  deleteCourseMaterial,
  acceptCourseJoinRequest,
  rejectCourseJoinRequest,
  removeStudentFromCourse,
  deleteCourse,
  updateCourse,
} from '../../lib/databaseService';
import { TeacherAddMaterialModal } from './TeacherAddMaterialModal';
import { MaterialViewerModal } from '../common/MaterialViewerModal';
import confetti from 'canvas-confetti';

interface TeacherCourseDetailViewProps {
  course: Course;
  userProfile: UserProfile;
  onBack: () => void;
  onCourseUpdated?: (updated: Course) => void;
  onCourseDeleted?: (courseId: string) => void;
}

export const TeacherCourseDetailView: React.FC<TeacherCourseDetailViewProps> = ({
  course: initialCourse,
  userProfile,
  onBack,
  onCourseUpdated,
  onCourseDeleted,
}) => {
  const [course, setCourse] = useState<Course>(initialCourse);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MATERIALS' | 'STUDENTS' | 'SETTINGS'>('MATERIALS');
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [joinRequests, setJoinRequests] = useState<CourseJoinRequest[]>([]);

  // Modals & State
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [selectedMaterialForView, setSelectedMaterialForView] = useState<CourseMaterial | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<CourseStudent | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<CourseMaterial | null>(null);
  const [showDeleteCourseConfirm, setShowDeleteCourseConfirm] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | MaterialType>('ALL');
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState(false);

  // Settings Edit State
  const [editName, setEditName] = useState(course.name);
  const [editSubject, setEditSubject] = useState(course.subject);
  const [editDesc, setEditDesc] = useState(course.description);
  const [editCategory, setEditCategory] = useState(course.category || 'General');
  const [editCover, setEditCover] = useState(course.coverImageURL || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const settingsFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSettingsGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setSettingsMsg({ text: 'Please select a valid image file from your gallery.', error: true });
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setSettingsMsg({ text: 'Image size exceeds 15MB. Please choose a smaller image.', error: true });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
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
            setEditCover(dataUrl);
            setSettingsMsg({ text: 'Thumbnail chosen from gallery. Click "Save Changes" to apply.', error: false });
          } else {
            setEditCover(event.target?.result as string);
            setSettingsMsg({ text: 'Thumbnail chosen from gallery. Click "Save Changes" to apply.', error: false });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Real-time Subscriptions
  useEffect(() => {
    const unsubMaterials = subscribeCourseMaterials(course.id, (list) => {
      setMaterials(list);
    });

    const unsubStudents = subscribeCourseStudents(course.id, (list) => {
      setStudents(list);
    });

    const unsubRequests = subscribeCourseJoinRequests(course.id, (list) => {
      setJoinRequests(list);
    });

    return () => {
      unsubMaterials();
      unsubStudents();
      unsubRequests();
    };
  }, [course.id]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(course.courseId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAcceptRequest = async (req: CourseJoinRequest) => {
    try {
      await acceptCourseJoinRequest(req);
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      console.error('Error accepting course request:', err);
    }
  };

  const handleRejectRequest = async (req: CourseJoinRequest) => {
    try {
      await rejectCourseJoinRequest(req.id, course.id, req.studentUid);
    } catch (err) {
      console.error('Error rejecting course request:', err);
    }
  };

  const handleConfirmRemoveStudent = async () => {
    if (!studentToRemove) return;
    try {
      await removeStudentFromCourse(course.id, studentToRemove.studentUid, studentToRemove.studentName);
      setStudentToRemove(null);
    } catch (err) {
      console.error('Error removing student:', err);
    }
  };

  const handleConfirmDeleteMaterial = async () => {
    if (!materialToDelete) return;
    try {
      await deleteCourseMaterial(course.id, materialToDelete.id, materialToDelete.storagePath);
      setMaterialToDelete(null);
    } catch (err) {
      console.error('Error deleting material:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsMsg(null);
    try {
      const updates: Partial<Course> = {
        name: editName.trim(),
        subject: editSubject.trim(),
        description: editDesc.trim(),
        category: editCategory.trim(),
        coverImageURL: editCover.trim(),
      };
      await updateCourse(course.id, updates);
      const updated = { ...course, ...updates };
      setCourse(updated);
      if (onCourseUpdated) onCourseUpdated(updated);
      setSettingsMsg({ text: 'Course settings updated successfully!' });
    } catch (err: any) {
      setSettingsMsg({ text: err.message || 'Error updating settings', error: true });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await deleteCourse(course.id);
      if (onCourseDeleted) onCourseDeleted(course.id);
      onBack();
    } catch (err) {
      console.error('Error deleting course:', err);
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
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
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
        </div>
      </div>

      {/* Course Hero Banner */}
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
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
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  ID: {course.courseId}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{course.name}</h1>
              {course.description && (
                <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-normal">{course.description}</p>
              )}
            </div>

            <button
              onClick={() => setShowAddMaterial(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-950/50 transition shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Material
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium">Materials</p>
                <p className="font-bold text-white">{materials.length}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium">Students</p>
                <p className="font-bold text-white">{students.length}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium">Join Requests</p>
                <p className="font-bold text-amber-400">{joinRequests.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-semibold gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('MATERIALS')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'MATERIALS'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Materials ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('STUDENTS')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition relative ${
            activeTab === 'STUDENTS'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Students ({students.length})
          {joinRequests.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'OVERVIEW'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Overview
        </button>
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'SETTINGS'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" /> Settings
        </button>
      </div>

      {/* TAB 1: MATERIALS */}
      {activeTab === 'MATERIALS' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search notes, chapters, documents..."
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
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
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

                      <button
                        onClick={() => setMaterialToDelete(m)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete Material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-xs sm:text-sm tracking-tight">{m.title}</h3>
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

                    <button
                      onClick={() => setSelectedMaterialForView(m)}
                      className="px-3 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-1 transition"
                    >
                      <Eye className="w-3 h-3" /> Open / View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No study material yet</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Share PDFs, notes, image diagrams, video lectures, and external links with your students.
              </p>
              <button
                onClick={() => setShowAddMaterial(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Add First Material
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDENTS & REQUESTS */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-5">
          {/* Pending Requests Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Pending Join Requests</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                  {joinRequests.length}
                </span>
              </h3>
            </div>

            {joinRequests.length > 0 ? (
              <div className="space-y-2">
                {joinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {req.studentPhotoURL ? (
                        <img
                          src={req.studentPhotoURL}
                          alt={req.studentName}
                          className="w-9 h-9 rounded-full border border-slate-700 object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center font-bold text-white text-xs">
                          {req.studentName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white">{req.studentName}</p>
                        <p className="text-[11px] font-mono text-purple-300">
                          Student ID: {req.studentId}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Requested: {new Date(req.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleRejectRequest(req)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1 transition"
                      >
                        <UserX className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 shadow-lg shadow-emerald-950/40 transition"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                No pending join requests.
              </div>
            )}
          </div>

          {/* Enrolled Students Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Enrolled Students</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px]">
                {students.length}
              </span>
            </h3>

            {students.length > 0 ? (
              <div className="space-y-2">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {s.studentPhotoURL ? (
                        <img
                          src={s.studentPhotoURL}
                          alt={s.studentName}
                          className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-[11px]">
                          {s.studentName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{s.studentName}</p>
                        <span className="text-[11px] font-mono text-purple-300">
                          ID: {s.studentId}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setStudentToRemove(s)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-[11px] flex items-center gap-1 transition"
                      title="Remove Student"
                    >
                      <UserMinus className="w-3 h-3" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                No students enrolled in this course yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="font-bold text-white text-sm">About This Course</h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {course.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white">Course Information</h4>
              <div className="space-y-1 text-slate-400 text-[11px]">
                <p><strong>Course Code:</strong> <span className="font-mono text-purple-300">{course.courseId}</span></p>
                <p><strong>Subject:</strong> {course.subject}</p>
                <p><strong>Category:</strong> {course.category || 'General'}</p>
                <p><strong>Created:</strong> {new Date(course.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white">Teacher Profile</h4>
              <div className="space-y-1 text-slate-400 text-[11px]">
                <p><strong>Instructor:</strong> {course.teacherName}</p>
                <p><strong>Teacher ID:</strong> <span className="font-mono text-purple-300">{course.teacherId}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-5 text-xs">
          {settingsMsg && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
                settingsMsg.error
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{settingsMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm">Edit Course Information</h3>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Course Title</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Subject</label>
                <input
                  type="text"
                  required
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Category</label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Course Description</label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Cover Image / Thumbnail with Gallery Upload */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-purple-400" /> Course Thumbnail / Cover
                </span>
                <span className="text-[10px] text-purple-400 font-medium">Device Gallery or URL</span>
              </label>

              {/* Hidden file input */}
              <input
                type="file"
                ref={settingsFileInputRef}
                accept="image/*"
                onChange={handleSettingsGalleryUpload}
                className="hidden"
              />

              {/* Thumbnail Preview Banner */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-32 w-full">
                {editCover ? (
                  <img src={editCover} alt="Course Cover Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => settingsFileInputRef.current?.click()}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 backdrop-blur-md shadow-lg transition"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload from Gallery / Photos
                  </button>
                </div>
              </div>

              <input
                type="url"
                placeholder="Or custom Image URL (https://...)"
                value={editCover}
                onChange={(e) => setEditCover(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-lg shadow-purple-950/40"
            >
              {isSavingSettings ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          {/* Danger Zone: Delete Course */}
          <div className="p-5 rounded-3xl bg-rose-950/20 border border-rose-500/25 space-y-3">
            <h3 className="font-bold text-rose-300 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Danger Zone: Delete Course
            </h3>
            <p className="text-slate-400 text-xs">
              Deleting this course will permanently remove all associated study materials, enrollments, and join requests.
            </p>
            <button
              onClick={() => setShowDeleteCourseConfirm(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-rose-950/40"
            >
              <Trash2 className="w-4 h-4" /> Delete Course
            </button>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {showAddMaterial && (
        <TeacherAddMaterialModal
          course={course}
          userProfile={userProfile}
          onClose={() => setShowAddMaterial(false)}
          onMaterialAdded={(newM) => {
            setMaterials((prev) => [newM, ...prev]);
          }}
        />
      )}

      {/* Material Viewer Modal */}
      {selectedMaterialForView && (
        <MaterialViewerModal
          material={selectedMaterialForView}
          onClose={() => setSelectedMaterialForView(null)}
        />
      )}

      {/* Confirm Delete Material Modal */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm">Delete Material</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete "{materialToDelete.title}"? Students will no longer be able to access it.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMaterialToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteMaterial}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Remove Student Modal */}
      {studentToRemove && (
        <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm">Remove Student</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to remove <strong>{studentToRemove.studentName}</strong> from this course?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStudentToRemove(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemoveStudent}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Course Modal */}
      {showDeleteCourseConfirm && (
        <div className="fixed inset-0 z-50 bg-[#070913]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-4 h-4" /> Confirm Course Deletion
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>{course.name}</strong> ({course.courseId})? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteCourseConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
