import React, { useState } from 'react';
import {
  Plus,
  Users,
  Clock,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  GraduationCap,
  FileText,
  Search,
  Sparkles,
} from 'lucide-react';
import { ClassRoom, Course } from '../../types';

interface TeacherClassesViewProps {
  classes: ClassRoom[];
  courses?: Course[];
  onCreateClass: () => void;
  onCreateCourse?: () => void;
  onOpenClassDetail: (cls: ClassRoom) => void;
  onOpenCourseDetail?: (course: Course) => void;
}

// Format "17:00" to "5:00 PM"
function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export const TeacherClassesView: React.FC<TeacherClassesViewProps> = ({
  classes = [],
  courses = [],
  onCreateClass,
  onCreateCourse,
  onOpenClassDetail,
  onOpenCourseDetail,
}) => {
  const [activeSection, setActiveSection] = useState<'CLASSES' | 'COURSES'>('CLASSES');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredClasses = classes.filter(
    (c) =>
      (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (c.subject && c.subject.toLowerCase().includes((searchQuery || '').toLowerCase()))
  );

  const filteredCourses = courses.filter(
    (c) =>
      (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (c.subject && c.subject.toLowerCase().includes((searchQuery || '').toLowerCase())) ||
      (c.courseId && c.courseId.toLowerCase().includes((searchQuery || '').toLowerCase()))
  );

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-150">
      {/* Header & Create Action */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {activeSection === 'CLASSES' ? 'My Live Batches' : 'Courses & Materials'}
          </h1>
          <p className="text-xs text-slate-400">
            {activeSection === 'CLASSES'
              ? `${classes.length} ${classes.length === 1 ? 'active class batch' : 'active class batches'}`
              : `${courses.length} ${courses.length === 1 ? 'published course' : 'published courses'}`}
          </p>
        </div>

        {activeSection === 'CLASSES' ? (
          <button
            id="teacher-create-class-header-btn"
            onClick={onCreateClass}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-purple-950/40"
          >
            <Plus className="w-4 h-4" /> Create Class
          </button>
        ) : (
          <button
            id="teacher-create-course-header-btn"
            onClick={onCreateCourse}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-indigo-950/40"
          >
            <Plus className="w-4 h-4" /> Create Course
          </button>
        )}
      </div>

      {/* Modern Segmented Navigation Bar */}
      <div className="flex p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveSection('CLASSES')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeSection === 'CLASSES'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Live Classes ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('COURSES')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeSection === 'COURSES'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Courses & Notes ({courses.length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder={
            activeSection === 'CLASSES'
              ? 'Search classes, subjects...'
              : 'Search courses, subjects, course codes...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* SECTION 1: LIVE CLASSES */}
      {activeSection === 'CLASSES' && (
        <>
          {filteredClasses.length > 0 ? (
            <div className="space-y-3">
              {filteredClasses.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => onOpenClassDetail(cls)}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-purple-500/40 hover:bg-slate-900 transition-all cursor-pointer shadow-md space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                        {cls.name}
                      </h3>
                      {cls.subject && (
                        <p className="text-xs text-purple-400 font-medium">{cls.subject}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenClassDetail(cls);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Class Info Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        {cls.studentCount} Students
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {formatTime12h(cls.timing.startTime)} – {formatTime12h(cls.timing.endTime)}
                      </span>
                    </div>

                    <div
                      onClick={(e) => handleCopyCode(e, cls.joinCode)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer"
                      title="Click to copy join code"
                    >
                      <span>Code: {cls.joinCode}</span>
                      {copiedCode === cls.joinCode ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center space-y-3 my-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                <BookOpen className="w-6 h-6 text-purple-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No classes found.</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Create your class to enroll students and manage automated attendance.
                </p>
              </div>
              <button
                id="create-first-class-classes-tab-btn"
                onClick={onCreateClass}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" /> Create Class
              </button>
            </div>
          )}
        </>
      )}

      {/* SECTION 2: COURSES & STUDY MATERIAL */}
      {activeSection === 'COURSES' && (
        <>
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => onOpenCourseDetail && onOpenCourseDetail(course)}
                  className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition cursor-pointer overflow-hidden flex flex-col justify-between group shadow-md"
                >
                  {/* Course Thumbnail */}
                  <div className="h-28 w-full relative bg-slate-950 overflow-hidden">
                    {course.coverImageURL ? (
                      <img
                        src={course.coverImageURL}
                        alt={course.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-purple-900/40 via-indigo-900/30 to-slate-950 flex items-center justify-center">
                        <GraduationCap className="w-10 h-10 text-purple-400/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold">
                        {course.courseId}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-3">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                        {course.subject}
                      </span>
                    </div>
                  </div>

                  {/* Course Body */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">
                        {course.name}
                      </h3>
                      {course.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {course.description}
                        </p>
                      )}
                    </div>

                    {/* Meta Footer */}
                    <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          {course.studentCount || 0}
                        </span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                          {course.materialsCount || 0} items
                        </span>
                      </div>

                      <span className="text-purple-400 font-semibold text-xs flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                        Manage <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center space-y-3 my-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                <GraduationCap className="w-6 h-6 text-purple-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No courses created yet.</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Create a structured course to share PDFs, handwritten notes, video lectures, and study materials.
                </p>
              </div>
              <button
                id="create-first-course-btn"
                onClick={onCreateCourse}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" /> Create Course
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
