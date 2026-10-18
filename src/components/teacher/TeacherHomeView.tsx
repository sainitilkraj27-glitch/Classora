import React from 'react';
import {
  Users,
  BookOpen,
  Sparkles,
  MessageSquare,
  Plus,
  ArrowRight,
  Shield,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Megaphone,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { UserProfile, Group, Course, AIStudentReport } from '../../types';

interface TeacherHomeViewProps {
  userProfile: UserProfile;
  groups: Group[];
  courses: Course[];
  aiReports: AIStudentReport[];
  onCreateGroup: () => void;
  onCreateCourse: () => void;
  onViewAllReports?: () => void;
  onOpenAIReports?: () => void;
  onOpenGroupDetail?: (group: Group) => void;
  onSelectGroup?: (group: Group) => void;
  onOpenCourseDetail?: (course: Course) => void;
  onNavigateToGroups: () => void;
  onNavigateToCourses: () => void;
  onNavigateToMessages?: () => void;
}

// Helper to get time of day greeting
function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export const TeacherHomeView: React.FC<TeacherHomeViewProps> = ({
  userProfile,
  groups = [],
  courses = [],
  aiReports = [],
  onCreateGroup,
  onCreateCourse,
  onViewAllReports,
  onOpenAIReports,
  onOpenGroupDetail,
  onSelectGroup,
  onOpenCourseDetail,
  onNavigateToGroups,
  onNavigateToCourses,
  onNavigateToMessages,
}) => {
  const totalStudents = groups.reduce((acc, g) => acc + (g.memberCount || 0), 0);
  const unacknowledgedReports = aiReports.filter((r) => !r.isAcknowledgedByTeacher);

  const handleOpenReports = () => {
    if (onViewAllReports) onViewAllReports();
    else if (onOpenAIReports) onOpenAIReports();
  };

  const handleSelectGroup = (g: Group) => {
    if (onOpenGroupDetail) onOpenGroupDetail(g);
    else if (onSelectGroup) onSelectGroup(g);
    else onNavigateToGroups();
  };

  const handleSelectCourse = (c: Course) => {
    if (onOpenCourseDetail) onOpenCourseDetail(c);
    else onNavigateToCourses();
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* 1. Header Greeting & Teacher Card */}
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/30 p-6 shadow-xl overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                Teacher Hub
              </span>
              <span className="text-xs font-mono text-purple-400 bg-purple-950/70 px-2 py-0.5 rounded-md border border-purple-800/40">
                ID: {userProfile.teacherId || userProfile.studentId || userProfile.uid.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1.5 tracking-tight">
              {getGreeting(userProfile.name.split(' ')[0] || userProfile.name)}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Create student groups, publish courses & study materials, and review AI reports.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              id="teacher-home-create-group-btn"
              onClick={onCreateGroup}
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-900/40"
            >
              <Plus className="w-4 h-4" />
              <span>Create Group</span>
            </button>

            <button
              id="teacher-home-create-course-btn"
              onClick={onCreateCourse}
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-900/40"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Create Course</span>
            </button>
          </div>
        </div>

        {/* Quick Numbers Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-purple-500/20">
          <div
            onClick={onNavigateToGroups}
            className="bg-slate-950/60 border border-purple-900/40 rounded-2xl p-3 cursor-pointer hover:border-purple-500/40 transition"
          >
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Users className="w-3 h-3 text-purple-400" /> Groups
            </div>
            <div className="text-lg font-black text-white mt-0.5">{groups.length}</div>
          </div>

          <div
            onClick={onNavigateToCourses}
            className="bg-slate-950/60 border border-purple-900/40 rounded-2xl p-3 cursor-pointer hover:border-cyan-500/40 transition"
          >
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-cyan-400" /> Courses
            </div>
            <div className="text-lg font-black text-cyan-300 mt-0.5">{courses.length}</div>
          </div>

          <div
            onClick={onNavigateToGroups}
            className="bg-slate-950/60 border border-purple-900/40 rounded-2xl p-3 cursor-pointer hover:border-purple-500/40 transition"
          >
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Users className="w-3 h-3 text-purple-400" /> Enrolled Students
            </div>
            <div className="text-lg font-black text-purple-300 mt-0.5">{totalStudents}</div>
          </div>

          <div
            onClick={handleOpenReports}
            className="bg-slate-950/60 border border-purple-900/40 rounded-2xl p-3 cursor-pointer hover:border-cyan-500/40 transition"
          >
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> AI Reports
            </div>
            <div className="text-lg font-black text-cyan-300 mt-0.5 flex items-center gap-1.5">
              {aiReports.length}
              {unacknowledgedReports.length > 0 && (
                <span className="text-[10px] font-bold bg-cyan-500 text-slate-950 px-1.5 rounded-full">
                  {unacknowledgedReports.length} new
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onNavigateToGroups}
          className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 text-left transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition">My Groups</h4>
            <p className="text-[11px] text-slate-400">Manage student groups</p>
          </div>
        </button>

        <button
          onClick={onNavigateToCourses}
          className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-left transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition">Courses & Materials</h4>
            <p className="text-[11px] text-slate-400">Notes, PDFs & videos</p>
          </div>
        </button>

        <button
          onClick={handleOpenReports}
          className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-left transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600/20 to-indigo-600/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition">AI Reports</h4>
            <p className="text-[11px] text-slate-400">Student inquiry logs</p>
          </div>
        </button>

        <button
          onClick={onNavigateToMessages || onNavigateToGroups}
          className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 text-left transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition">Messages</h4>
            <p className="text-[11px] text-slate-400">Direct student chat</p>
          </div>
        </button>
      </div>

      {/* 3. Teacher Groups Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Your Student Groups</h3>
              <p className="text-[11px] text-slate-400">Teacher-controlled classrooms and communities</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateGroup}
              className="text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" /> New Group
            </button>
            <button
              onClick={onNavigateToGroups}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              All ({groups.length}) &rarr;
            </button>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p>You have not created any groups yet.</p>
            <button
              onClick={onCreateGroup}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition"
            >
              Create Group Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groups.slice(0, 4).map((group) => (
              <div
                key={group.id}
                onClick={() => handleSelectGroup(group)}
                className="p-4 bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 rounded-2xl cursor-pointer transition flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition truncate">
                      {group.name}
                    </h4>
                    <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/40 shrink-0">
                      {group.memberCount || 0} students
                    </span>
                  </div>
                  {group.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                      {group.description}
                    </p>
                  )}
                  {group.announcement && (
                    <div className="mt-2 p-2 bg-purple-950/40 border border-purple-500/20 rounded-xl flex items-center gap-1.5 text-[10px] text-purple-300 line-clamp-1">
                      <Megaphone className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="truncate">{group.announcement}</span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-purple-400 font-medium flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span>Manage Members & AI Calls</span>
                  <span>&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Teacher Courses & Study Material Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Your Courses & Study Materials</h3>
              <p className="text-[11px] text-slate-400">PDFs, notes, chapters and video materials</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateCourse}
              className="text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" /> New Course
            </button>
            <button
              onClick={onNavigateToCourses}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              All ({courses.length}) &rarr;
            </button>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <p>You have not published any courses yet.</p>
            <button
              onClick={onCreateCourse}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition shadow"
            >
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {courses.slice(0, 4).map((course) => (
              <div
                key={course.id}
                onClick={() => handleSelectCourse(course)}
                className="p-4 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl cursor-pointer transition flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                      {course.courseId}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full">
                      {course.subject}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition mt-2 truncate">
                    {course.name}
                  </h4>
                  {course.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {course.description}
                    </p>
                  )}
                </div>

                <div className="text-[10px] text-cyan-400 font-medium flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span className="flex items-center gap-2">
                    <span>{course.materialCount || 0} Materials</span>
                    <span>•</span>
                    <span>{course.studentCount || 0} Students</span>
                  </span>
                  <span>Manage Material &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. AI Student Communications Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Recent AI Student Reports
                <span className="px-2 py-0.5 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  Confidential
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Automated student check-in insights and stated reasons</p>
            </div>
          </div>

          <button
            onClick={handleOpenReports}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            View All ({aiReports.length}) &rarr;
          </button>
        </div>

        {aiReports.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-1">
            <p>No AI student reports generated yet.</p>
            <p className="text-[11px] text-slate-600">
              Go to any Group and tap the AI Call icon next to a student to initiate an automated inquiry.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {aiReports.slice(0, 3).map((rep) => (
              <div
                key={rep.id}
                onClick={handleOpenReports}
                className="p-3.5 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/30 rounded-2xl flex items-center justify-between text-xs cursor-pointer transition"
              >
                <div className="space-y-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{rep.studentName}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        rep.response === 'Attending today'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {rep.response === 'Attending today' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-400" />
                      )}
                      {rep.response}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Reason: <span className="text-slate-200">{rep.reason || 'Confirmed via AI'}</span>
                  </p>
                </div>

                <div className="text-[10px] text-slate-500 shrink-0 text-right">
                  {new Date(rep.createdAt || rep.timestamp || Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
