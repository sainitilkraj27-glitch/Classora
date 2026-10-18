import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  ArrowRight,
  Shield,
  FileText,
  Clock,
  Megaphone,
  Plus,
  GraduationCap,
} from 'lucide-react';
import { UserProfile, Group, Course } from '../../types';

interface StudentHomeViewProps {
  userProfile: UserProfile;
  groups: Group[];
  courses: Course[];
  onNavigateToGroups: () => void;
  onNavigateToCourses: () => void;
  onNavigateToMessages: () => void;
  onSelectGroup: (group: Group) => void;
  onSelectCourse?: (course: Course) => void;
  onOpenJoinCourseModal?: () => void;
  onOpenAIChat?: () => void;
}

// Helper to get time of day greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const StudentHomeView: React.FC<StudentHomeViewProps> = ({
  userProfile,
  groups = [],
  courses = [],
  onNavigateToGroups,
  onNavigateToCourses,
  onNavigateToMessages,
  onSelectGroup,
  onSelectCourse,
  onOpenJoinCourseModal,
  onOpenAIChat,
}) => {
  const [copied, setCopied] = useState(false);
  const studentId = userProfile.studentId || userProfile.uid.slice(0, 8).toUpperCase();

  const handleCopyId = () => {
    navigator.clipboard.writeText(studentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCourseClick = (course: Course) => {
    if (onSelectCourse) {
      onSelectCourse(course);
    } else {
      onNavigateToCourses();
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* 1. Header Card with 8-digit Student ID */}
      <div className="relative rounded-3xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/30 p-6 shadow-xl overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                Student Portal
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1.5 tracking-tight">
              {getGreeting()},{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {userProfile.name.split(' ')[0] || userProfile.name}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Welcome to Classora. Access your enrolled groups, courses, and study materials.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Student ID Card */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-3 shrink-0 shadow-lg space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Your Student ID</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-cyan-300 tracking-wider">
                  {studentId}
                </span>
                <button
                  id="student-home-copy-id-btn"
                  onClick={handleCopyId}
                  className="p-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition"
                  title="Copy Student ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {copied ? (
                <p className="text-[9px] text-emerald-400 font-medium">Copied to clipboard!</p>
              ) : (
                <p className="text-[9px] text-slate-500">Share with teacher for groups</p>
              )}
            </div>

            {onOpenJoinCourseModal && (
              <button
                id="student-home-join-course-btn"
                onClick={onOpenJoinCourseModal}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-900/40"
              >
                <Plus className="w-4 h-4" />
                <span>Join Course</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Numbers Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-cyan-500/20">
          <div
            onClick={onNavigateToGroups}
            className="bg-slate-950/60 border border-cyan-900/40 rounded-2xl p-3 cursor-pointer hover:border-cyan-500/40 transition"
          >
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Users className="w-3 h-3 text-cyan-400" /> Enrolled Groups
            </div>
            <div className="text-lg font-black text-white mt-0.5">{groups.length}</div>
          </div>

          <div
            onClick={onNavigateToCourses}
            className="bg-slate-950/60 border border-cyan-900/40 rounded-2xl p-3 cursor-pointer hover:border-cyan-500/40 transition"
          >
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-cyan-400" /> Courses & Materials
            </div>
            <div className="text-lg font-black text-cyan-300 mt-0.5">{courses.length}</div>
          </div>

          <div
            onClick={onNavigateToMessages}
            className="col-span-2 sm:col-span-1 bg-slate-950/60 border border-cyan-900/40 rounded-2xl p-3 cursor-pointer hover:border-cyan-500/40 transition"
          >
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-cyan-400" /> Direct Chat
            </div>
            <div className="text-xs font-bold text-cyan-300 mt-1">Teacher & Peers</div>
          </div>
        </div>
      </div>

      {/* 2. Quick Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onNavigateToGroups}
          className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-left transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition">My Groups</h4>
            <p className="text-[11px] text-slate-400">Classrooms & peers</p>
          </div>
        </button>

        <button
          onClick={onNavigateToCourses}
          className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 text-left transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition">My Courses</h4>
            <p className="text-[11px] text-slate-400">Notes, PDFs & videos</p>
          </div>
        </button>

        <button
          onClick={onNavigateToMessages}
          className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 text-left transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition">Messages</h4>
            <p className="text-[11px] text-slate-400">Ask teachers</p>
          </div>
        </button>

        {onOpenJoinCourseModal ? (
          <button
            onClick={onOpenJoinCourseModal}
            className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 text-left transition space-y-2 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-cyan-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition">Join Course</h4>
              <p className="text-[11px] text-slate-400">Enter Course ID</p>
            </div>
          </button>
        ) : (
          <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 text-left space-y-2 opacity-60">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Verified Student</h4>
              <p className="text-[11px] text-slate-400">Classora Account</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Enrolled Groups Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">My Enrolled Groups</h3>
              <p className="text-[11px] text-slate-400">Groups you were added into by teachers</p>
            </div>
          </div>

          <button
            onClick={onNavigateToGroups}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            All Groups ({groups.length}) &rarr;
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p>You have not been added to any class groups yet.</p>
            <p className="text-[11px] text-slate-500">
              Give your Student ID <strong className="text-cyan-300">({studentId})</strong> to your teacher to get added.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groups.slice(0, 4).map((group) => (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className="p-4 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl cursor-pointer transition flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate">
                      {group.name}
                    </h4>
                    <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40 shrink-0">
                      {group.memberCount || 0} members
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Teacher: <strong className="text-slate-300">{group.teacherName}</strong>
                  </p>
                  {group.announcement && (
                    <div className="mt-2 p-2 bg-cyan-950/30 border border-cyan-500/20 rounded-xl flex items-center gap-1.5 text-[10px] text-cyan-300 line-clamp-1">
                      <Megaphone className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{group.announcement}</span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-cyan-400 font-medium flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span>View Group</span>
                  <span>&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Enrolled Courses Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Courses & Study Material</h3>
              <p className="text-[11px] text-slate-400">Study materials, notes, and lessons</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenJoinCourseModal && (
              <button
                onClick={onOpenJoinCourseModal}
                className="text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Join Course
              </button>
            )}
            <button
              onClick={onNavigateToCourses}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              All Courses ({courses.length}) &rarr;
            </button>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-3">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <p>You have not joined any courses yet.</p>
            {onOpenJoinCourseModal && (
              <button
                onClick={onOpenJoinCourseModal}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow"
              >
                Join Course with Code
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {courses.slice(0, 4).map((course) => (
              <div
                key={course.id}
                onClick={() => handleCourseClick(course)}
                className="p-4 bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 rounded-2xl cursor-pointer transition flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                      {course.courseId}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {course.subject}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition truncate mt-1.5">
                    {course.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {course.description || 'Course material'}
                  </p>
                </div>
                <div className="text-[10px] text-purple-400 font-medium flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span>{course.materialCount || 0} Materials</span>
                  <span>View Material &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
