import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Search,
  ChevronRight,
  Megaphone,
  Copy,
  Check,
  BookOpen,
  Info,
  GraduationCap,
  Plus,
  FileText,
  Video,
  Sparkles,
} from 'lucide-react';
import { Group, Course, CourseMember, UserProfile } from '../../types';

interface StudentGroupsViewProps {
  groups: Group[];
  courses?: Course[];
  courseMemberships?: CourseMember[];
  studentProfile?: UserProfile;
  student?: UserProfile;
  onOpenGroupDetail?: (group: Group) => void;
  onSelectGroup?: (group: Group) => void;
  onOpenCourseDetail?: (course: Course) => void;
  onOpenJoinCourseModal?: () => void;
  onNavigateToMessages?: () => void;
}

export const StudentGroupsView: React.FC<StudentGroupsViewProps> = ({
  groups = [],
  courses = [],
  courseMemberships = [],
  studentProfile,
  student,
  onOpenGroupDetail,
  onSelectGroup,
  onOpenCourseDetail,
  onOpenJoinCourseModal,
  onNavigateToMessages,
}) => {
  const profile = studentProfile || student;
  const [activeSubTab, setActiveSubTab] = useState<'groups' | 'courses'>('groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const studentId = profile?.studentId || profile?.uid.slice(0, 8).toUpperCase() || 'UNKNOWN';

  const handleCopyId = () => {
    navigator.clipboard.writeText(studentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSelectGroup = (g: Group) => {
    if (onOpenGroupDetail) onOpenGroupDetail(g);
    else if (onSelectGroup) onSelectGroup(g);
  };

  const handleSelectCourse = (c: Course) => {
    if (onOpenCourseDetail) onOpenCourseDetail(c);
  };

  const filteredGroups = groups.filter(
    (g) =>
      (g.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes((searchQuery || '').toLowerCase())) ||
      (g.teacherName && g.teacherName.toLowerCase().includes((searchQuery || '').toLowerCase()))
  );

  const filteredCourses = courses.filter(
    (c) =>
      (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (c.subject && c.subject.toLowerCase().includes((searchQuery || '').toLowerCase())) ||
      (c.courseId && c.courseId.toLowerCase().includes((searchQuery || '').toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes((searchQuery || '').toLowerCase())) ||
      (c.teacherName && c.teacherName.toLowerCase().includes((searchQuery || '').toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* 1. Header Banner with Student ID & Copy */}
      <div className="relative rounded-3xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border border-cyan-500/30 p-6 shadow-xl overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                Student Communities
              </span>
            </div>
            <h1 className="text-xl font-black text-white mt-1">My Groups & Courses</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Access your enrolled classrooms, teacher study materials, notes, and PDF chapters.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Student ID Card with Copy Button */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-3 shrink-0 shadow-lg space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Your Student ID</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-cyan-300 tracking-wider">
                  {studentId}
                </span>
                <button
                  id="student-copy-id-btn"
                  onClick={handleCopyId}
                  className="p-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition"
                  title="Copy Student ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {copied && <p className="text-[9px] text-emerald-400 font-medium">Copied!</p>}
            </div>

            {onOpenJoinCourseModal && (
              <button
                id="join-course-header-btn"
                onClick={onOpenJoinCourseModal}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-900/40"
              >
                <Plus className="w-4 h-4" />
                <span>Join Course</span>
              </button>
            )}
          </div>
        </div>

        {/* Info notice */}
        <div className="mt-5 pt-4 border-t border-cyan-500/20 flex items-center gap-2 text-xs text-cyan-200/90">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Teachers add you to Groups using your Student ID. To join a Course, tap <strong>Join Course</strong> and enter the Course Code.
          </span>
        </div>
      </div>

      {/* Sub-Tabs: Groups vs Courses */}
      <div className="flex items-center justify-between gap-3 bg-slate-900 p-1.5 border border-slate-800 rounded-2xl">
        <div className="grid grid-cols-2 gap-1.5 flex-1">
          <button
            id="student-tab-groups-btn"
            onClick={() => setActiveSubTab('groups')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeSubTab === 'groups'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Enrolled Groups ({groups.length})</span>
          </button>

          <button
            id="student-tab-courses-btn"
            onClick={() => setActiveSubTab('courses')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeSubTab === 'courses'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>My Courses ({courses.length})</span>
          </button>
        </div>

        {activeSubTab === 'courses' && onOpenJoinCourseModal && (
          <button
            onClick={onOpenJoinCourseModal}
            className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Join Course
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder={
            activeSubTab === 'groups'
              ? 'Search your enrolled groups or teachers...'
              : 'Search your courses, subjects, or Course IDs...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
        />
      </div>

      {/* SUB-TAB 1: ENROLLED GROUPS */}
      {activeSubTab === 'groups' && (
        <>
          {filteredGroups.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-3">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">
                {groups.length === 0 ? 'Not enrolled in any groups yet' : 'No groups matching your search'}
              </h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                {groups.length === 0
                  ? `Share your Student ID (${studentId}) with your teacher to be added into your class groups.`
                  : 'Try searching with a different term.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGroups.map((group) => (
                <motion.div
                  key={group.id}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSelectGroup(group)}
                  className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-5 shadow-lg transition cursor-pointer flex flex-col justify-between group space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600/20 to-indigo-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg shrink-0 overflow-hidden">
                          {group.photoURL ? (
                            <img
                              src={group.photoURL}
                              alt={group.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Users className="w-6 h-6 text-cyan-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                            {group.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            Teacher: <strong className="text-slate-300">{group.teacherName}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-950/40 transition">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {group.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-3 pl-1">
                        {group.description}
                      </p>
                    )}

                    {group.announcement && (
                      <div className="mt-3 p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-start gap-2 text-xs text-cyan-200">
                        <Megaphone className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-cyan-400 uppercase">Teacher Announcement</div>
                          <span className="line-clamp-2 text-[11px] mt-0.5">{group.announcement}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {group.memberCount || 0} Members
                    </span>
                    <span className="text-cyan-400 font-medium group-hover:underline flex items-center gap-1">
                      View Group &rarr;
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* SUB-TAB 2: MY COURSES */}
      {activeSubTab === 'courses' && (
        <>
          {filteredCourses.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-3">
              <BookOpen className="w-10 h-10 text-purple-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">
                {courses.length === 0 ? 'You have not joined any courses yet' : 'No courses matching your search'}
              </h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                {courses.length === 0
                  ? 'Join courses using the unique Course ID (e.g. CS-482719) provided by your teacher to access study materials, notes, and PDFs.'
                  : 'Try searching with a different term.'}
              </p>
              {onOpenJoinCourseModal && (
                <button
                  id="student-join-course-empty-btn"
                  onClick={onOpenJoinCourseModal}
                  className="mt-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl transition shadow-lg shadow-purple-950/50 flex items-center gap-1.5 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Join a Course with Code</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCourses.map((course) => (
                <motion.div
                  key={course.id}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSelectCourse(course)}
                  className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-5 shadow-lg transition cursor-pointer flex flex-col justify-between group space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg shrink-0 overflow-hidden">
                          {course.coverImageURL ? (
                            <img
                              src={course.coverImageURL}
                              alt={course.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <BookOpen className="w-6 h-6 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-lg border border-purple-500/30">
                              {course.courseId}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {course.subject}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition mt-1">
                            {course.name}
                          </h3>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-800 text-slate-400 group-hover:text-purple-400 group-hover:bg-purple-950/40 transition">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {course.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-3 pl-1">
                        {course.description}
                      </p>
                    )}

                    <div className="mt-2 text-[11px] text-slate-400 pl-1">
                      Teacher: <strong className="text-slate-300">{course.teacherName}</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-purple-300 font-medium">
                      <FileText className="w-3.5 h-3.5 text-purple-400" /> {course.materialCount || 0} Study Materials
                    </span>
                    <span className="text-purple-400 font-medium group-hover:underline flex items-center gap-1">
                      View Material &rarr;
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
