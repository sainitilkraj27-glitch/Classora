import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Clock,
  User,
  Users,
  ChevronRight,
  Search,
  CheckCircle2,
  Calendar,
  Hourglass,
  Lock,
  GraduationCap,
  Sparkles,
  FileText,
} from 'lucide-react';
import {
  ClassRoom,
  ClassMember,
  ClassSession,
  Course,
  CourseMember,
} from '../../types';

interface StudentClassesViewProps {
  classes: ClassRoom[];
  memberships: ClassMember[];
  courses?: Course[];
  courseMemberships?: CourseMember[];
  activeSessions: ClassSession[];
  onOpenClassDetail: (cls: ClassRoom) => void;
  onOpenCourseDetail?: (course: Course) => void;
  onOpenJoinClassModal: () => void;
  onOpenJoinCourseModal?: () => void;
}

export const StudentClassesView: React.FC<StudentClassesViewProps> = ({
  classes = [],
  memberships = [],
  courses = [],
  courseMemberships = [],
  activeSessions = [],
  onOpenClassDetail,
  onOpenCourseDetail,
  onOpenJoinClassModal,
  onOpenJoinCourseModal,
}) => {
  const [activeSection, setActiveSection] = useState<'CLASSES' | 'COURSES'>('CLASSES');
  const [searchQuery, setSearchQuery] = useState('');

  const safeMemberships = memberships || [];
  const safeClasses = classes || [];
  const safeCourses = courses || [];
  const safeCourseMemberships = courseMemberships || [];

  // Split active and pending class memberships
  const activeClassIds = new Set(
    safeMemberships.filter((m) => m.status !== 'pending').map((m) => m.classId)
  );
  const pendingClassIds = new Set(
    safeMemberships.filter((m) => m.status === 'pending').map((m) => m.classId)
  );

  const myActiveClasses = safeClasses.filter((c) => activeClassIds.has(c.id));
  const myPendingClasses = safeClasses.filter((c) => pendingClassIds.has(c.id));

  // Split active and pending course memberships
  const activeCourseIds = new Set(
    safeCourseMemberships.filter((m) => m.status === 'active').map((m) => m.courseId)
  );
  const pendingCourseIds = new Set(
    safeCourseMemberships.filter((m) => m.status === 'pending').map((m) => m.courseId)
  );

  const myActiveCourses = safeCourses.filter((c) => activeCourseIds.has(c.id));
  const myPendingCourses = safeCourses.filter((c) => pendingCourseIds.has(c.id));

  const filteredClasses = myActiveClasses.filter(
    (c) =>
      (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (c.subject && c.subject.toLowerCase().includes((searchQuery || '').toLowerCase())) ||
      (c.teacherName && c.teacherName.toLowerCase().includes((searchQuery || '').toLowerCase()))
  );

  const filteredCourses = myActiveCourses.filter(
    (c) =>
      (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (c.subject && c.subject.toLowerCase().includes((searchQuery || '').toLowerCase())) ||
      (c.teacherName && c.teacherName.toLowerCase().includes((searchQuery || '').toLowerCase())) ||
      (c.courseId && c.courseId.toLowerCase().includes((searchQuery || '').toLowerCase()))
  );

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {activeSection === 'CLASSES' ? 'My Classes' : 'Courses & Materials'}
          </h1>
          <p className="text-xs text-slate-400">
            {activeSection === 'CLASSES'
              ? `${myActiveClasses.length} ${myActiveClasses.length === 1 ? 'Class' : 'Classes'} enrolled`
              : `${myActiveCourses.length} ${myActiveCourses.length === 1 ? 'Course' : 'Courses'} joined`}
          </p>
        </div>

        {activeSection === 'CLASSES' ? (
          <button
            onClick={onOpenJoinClassModal}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-cyan-950/40"
          >
            <Plus className="w-4 h-4" />
            Join Class
          </button>
        ) : (
          <button
            onClick={onOpenJoinCourseModal}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-950/40"
          >
            <Plus className="w-4 h-4" />
            Join Course
          </button>
        )}
      </div>

      {/* Segmented Navigation Tab Switcher */}
      <div className="flex p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveSection('CLASSES')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeSection === 'CLASSES'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Live Classes ({myActiveClasses.length})</span>
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
          <span>Courses & Notes ({myActiveCourses.length})</span>
        </button>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeSection === 'CLASSES'
              ? 'Search classes, subjects, or teachers...'
              : 'Search courses, subjects, or course codes...'
          }
          className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* ================= SECTION 1: LIVE CLASSES ================= */}
      {activeSection === 'CLASSES' && (
        <div className="space-y-3">
          {/* Pending Join Requests Banner if any */}
          {myPendingClasses.length > 0 && (
            <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300">
                <Hourglass className="w-4 h-4 animate-spin text-amber-400" />
                <h3 className="text-xs font-bold">
                  Pending Join Requests ({myPendingClasses.length})
                </h3>
              </div>
              <p className="text-[11px] text-amber-200/80">
                You have requested to join these private classes. Awaiting teacher approval:
              </p>
              <div className="space-y-1.5 pt-1">
                {myPendingClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{cls.name}</span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        Teacher: {cls.teacherName}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Awaiting Approval
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Classes List */}
          {filteredClasses.length > 0 ? (
            <div className="space-y-3">
              {filteredClasses.map((cls) => {
                const isLiveNow = activeSessions.some(
                  (s) => s.classId === cls.id && s.status === 'active'
                );

                return (
                  <div
                    key={cls.id}
                    onClick={() => onOpenClassDetail(cls)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer space-y-3 shadow-md ${
                      isLiveNow
                        ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/50 hover:border-emerald-400 shadow-emerald-950/20'
                        : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{cls.name}</h3>
                          {isLiveNow && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                              Live Session
                            </span>
                          )}
                        </div>
                        {cls.subject && (
                          <span className="text-xs text-cyan-400 font-medium">
                            {cls.subject}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenClassDetail(cls);
                        }}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Teacher: {cls.teacherName}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>
                          {cls.timing.startTime} – {cls.timing.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3 my-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                <BookOpen className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No classes found</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {myActiveClasses.length === 0
                    ? 'You have not joined any classes yet. Click "Join Class" to enter your teacher\'s join code.'
                    : 'No classes match your search query.'}
                </p>
              </div>
              {myActiveClasses.length === 0 && (
                <button
                  onClick={onOpenJoinClassModal}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" /> Join Class
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION 2: COURSES & STUDY MATERIAL ================= */}
      {activeSection === 'COURSES' && (
        <div className="space-y-3">
          {/* Pending Course Join Requests */}
          {myPendingCourses.length > 0 && (
            <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300">
                <Hourglass className="w-4 h-4 animate-spin text-amber-400" />
                <h3 className="text-xs font-bold">
                  Pending Course Approvals ({myPendingCourses.length})
                </h3>
              </div>
              <p className="text-[11px] text-amber-200/80">
                You have requested to join these courses. Awaiting instructor approval:
              </p>
              <div className="space-y-1.5 pt-1">
                {myPendingCourses.map((crs) => (
                  <div
                    key={crs.id}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{crs.name}</span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        Instructor: {crs.teacherName}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Awaiting Approval
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Courses List */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => onOpenCourseDetail && onOpenCourseDetail(course)}
                  className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition cursor-pointer overflow-hidden flex flex-col justify-between group shadow-md"
                >
                  {/* Cover */}
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

                  {/* Body */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Instructor: <strong>{course.teacherName}</strong>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                        {course.materialsCount || 0} items
                      </span>

                      <span className="text-purple-300 font-semibold text-xs flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                        View Material <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3 my-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                <GraduationCap className="w-6 h-6 text-purple-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No courses joined yet</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Search courses with a 8-character Course ID (e.g. <code>CS-482719</code>) or Course Name to access PDFs, notes, formulas, and videos.
                </p>
              </div>
              <button
                onClick={onOpenJoinCourseModal}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" /> Find & Join Course
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
