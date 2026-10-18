import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Plus,
  Search,
  ChevronRight,
  Megaphone,
  Sparkles,
  BookOpen,
  GraduationCap,
  FileText,
  Video,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Group, Course, UserProfile } from '../../types';

interface TeacherGroupsViewProps {
  groups: Group[];
  courses?: Course[];
  teacher?: UserProfile;
  onCreateGroup: () => void;
  onCreateCourse?: () => void;
  onOpenGroupDetail?: (group: Group) => void;
  onSelectGroup?: (group: Group) => void;
  onOpenCourseDetail?: (course: Course) => void;
  onOpenAIReports?: () => void;
  aiReportsCount?: number;
}

export const TeacherGroupsView: React.FC<TeacherGroupsViewProps> = ({
  groups = [],
  courses = [],
  teacher,
  onCreateGroup,
  onCreateCourse,
  onOpenGroupDetail,
  onSelectGroup,
  onOpenCourseDetail,
  onOpenAIReports,
  aiReportsCount = 0,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'groups' | 'courses'>('groups');
  const [searchQuery, setSearchQuery] = useState('');

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
      (g.description && g.description.toLowerCase().includes((searchQuery || '').toLowerCase()))
  );

  const filteredCourses = courses.filter(
    (c) =>
      (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (c.subject && c.subject.toLowerCase().includes((searchQuery || '').toLowerCase())) ||
      (c.courseId && c.courseId.toLowerCase().includes((searchQuery || '').toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes((searchQuery || '').toLowerCase()))
  );

  const totalMembers = groups.reduce((acc, g) => acc + (g.memberCount || 0), 0);

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 p-6 shadow-xl overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                Classora Management
              </span>
            </div>
            <h1 className="text-xl font-black text-white mt-1">Groups & Courses</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Manage private student groups and publish courses with PDFs, notes, and video materials.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {onOpenAIReports && (
              <button
                onClick={onOpenAIReports}
                className="px-3.5 py-2 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>AI Reports</span>
                {aiReportsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-cyan-500 text-slate-950 text-[10px] font-black rounded-full">
                    {aiReportsCount}
                  </span>
                )}
              </button>
            )}

            {activeSubTab === 'groups' ? (
              <button
                id="create-group-btn"
                onClick={onCreateGroup}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-900/40"
              >
                <Plus className="w-4 h-4" />
                <span>Create Group</span>
              </button>
            ) : (
              <button
                id="create-course-btn"
                onClick={onCreateCourse || onCreateGroup}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-900/40"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Create Course</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-purple-500/20">
          <div
            onClick={() => setActiveSubTab('groups')}
            className={`rounded-2xl p-3 cursor-pointer transition border ${
              activeSubTab === 'groups'
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                : 'bg-slate-950/60 border-purple-900/40 text-slate-400'
            }`}
          >
            <div className="text-[11px] font-medium flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Total Groups
            </div>
            <div className="text-lg font-black text-white mt-0.5">{groups.length}</div>
          </div>

          <div
            onClick={() => setActiveSubTab('courses')}
            className={`rounded-2xl p-3 cursor-pointer transition border ${
              activeSubTab === 'courses'
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950/60 border-purple-900/40 text-slate-400'
            }`}
          >
            <div className="text-[11px] font-medium flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Total Courses
            </div>
            <div className="text-lg font-black text-cyan-300 mt-0.5">{courses.length}</div>
          </div>

          <div className="bg-slate-950/60 border border-purple-900/40 rounded-2xl p-3">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-purple-400" /> Enrolled Students
            </div>
            <div className="text-lg font-black text-purple-300 mt-0.5">{totalMembers}</div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Toggle */}
      <div className="flex items-center justify-between gap-3 bg-slate-900 p-1.5 border border-slate-800 rounded-2xl">
        <div className="grid grid-cols-2 gap-1.5 flex-1">
          <button
            id="tab-groups-btn"
            onClick={() => setActiveSubTab('groups')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeSubTab === 'groups'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Groups ({groups.length})</span>
          </button>

          <button
            id="tab-courses-btn"
            onClick={() => setActiveSubTab('courses')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeSubTab === 'courses'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Courses & Material ({courses.length})</span>
          </button>
        </div>

        {activeSubTab === 'groups' ? (
          <button
            onClick={onCreateGroup}
            className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Create Group
          </button>
        ) : (
          <button
            onClick={onCreateCourse || onCreateGroup}
            className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Create Course
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
              ? 'Search groups by name or description...'
              : 'Search courses by name, subject, or Course ID...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition shadow-inner"
        />
      </div>

      {/* SUB-TAB 1: GROUPS */}
      {activeSubTab === 'groups' && (
        <>
          {filteredGroups.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-3">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">
                {groups.length === 0 ? 'No groups created yet' : 'No groups matching your search'}
              </h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                {groups.length === 0
                  ? 'Create your first group to organize your students, share announcements, and trigger AI check-ins.'
                  : 'Try searching with a different term.'}
              </p>
              {groups.length === 0 && (
                <button
                  onClick={onCreateGroup}
                  className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow"
                >
                  Create Your First Group
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGroups.map((group) => (
                <motion.div
                  key={group.id}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSelectGroup(group)}
                  className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-5 shadow-lg transition cursor-pointer flex flex-col justify-between group space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg shrink-0 overflow-hidden">
                          {group.photoURL ? (
                            <img
                              src={group.photoURL}
                              alt={group.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Users className="w-6 h-6 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                            {group.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3 text-purple-400" /> {group.memberCount || 0} students
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-800 text-slate-400 group-hover:text-purple-400 group-hover:bg-purple-950/40 transition">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {group.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-3 pl-1">
                        {group.description}
                      </p>
                    )}

                    {group.announcement && (
                      <div className="mt-3 p-2.5 bg-purple-950/30 border border-purple-500/20 rounded-2xl flex items-start gap-2 text-xs text-purple-200">
                        <Megaphone className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-1 italic text-[11px]">{group.announcement}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Teacher Admin</span>
                    <span className="text-purple-400 font-medium group-hover:underline flex items-center gap-1">
                      Manage Group &rarr;
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* SUB-TAB 2: COURSES */}
      {activeSubTab === 'courses' && (
        <>
          {filteredCourses.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-3">
              <BookOpen className="w-10 h-10 text-cyan-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">
                {courses.length === 0 ? 'No courses created yet' : 'No courses matching your search'}
              </h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                {courses.length === 0
                  ? 'Create a course with a unique Course ID to share notes, PDF files, lectures, and chapters with students.'
                  : 'Try searching with a different keyword or subject.'}
              </p>
              {courses.length === 0 && (
                <button
                  onClick={onCreateCourse || onCreateGroup}
                  className="mt-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition shadow"
                >
                  Create Your First Course
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
                  className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-5 shadow-lg transition cursor-pointer flex flex-col justify-between group space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg shrink-0 overflow-hidden">
                          {course.coverImageURL ? (
                            <img
                              src={course.coverImageURL}
                              alt={course.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <BookOpen className="w-6 h-6 text-cyan-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                              {course.courseId}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {course.subject}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition mt-1">
                            {course.name}
                          </h3>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-950/40 transition">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {course.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-3 pl-1">
                        {course.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-cyan-400">
                        <FileText className="w-3.5 h-3.5" /> {course.materialCount || 0} Materials
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-indigo-400">
                        <Users className="w-3.5 h-3.5" /> {course.studentCount || 0} Students
                      </span>
                    </span>
                    <span className="text-cyan-400 font-medium group-hover:underline flex items-center gap-1">
                      Manage Course &rarr;
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
