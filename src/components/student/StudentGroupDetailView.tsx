import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Megaphone,
  Sparkles,
  ShieldCheck,
  Search,
  BookOpen,
  User,
  Loader2,
  Phone,
  Video,
} from 'lucide-react';
import { Group, GroupMember, UserProfile } from '../../types';
import {
  subscribeGroupMembers,
  getOrCreateTeacherStudentConversation,
  getGroupDetails,
} from '../../lib/databaseService';
import { useCall } from '../../context/CallContext';

interface StudentGroupDetailViewProps {
  group: Group;
  student: UserProfile;
  onBack: () => void;
  onNavigateToMessages: (convId?: string) => void;
}

export const StudentGroupDetailView: React.FC<StudentGroupDetailViewProps> = ({
  group,
  student,
  onBack,
  onNavigateToMessages,
}) => {
  const { startCall } = useCall();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberFilter, setMemberFilter] = useState('');

  useEffect(() => {
    const unsub = subscribeGroupMembers(group.id, (list) => {
      setMembers(list);
      setLoadingMembers(false);
    });
    return () => unsub();
  }, [group.id]);

  const resolveTeacher = async () => {
    if (group.teacherUid) {
      return { uid: group.teacherUid, name: group.teacherName || 'Teacher' };
    }
    const fullGroup = await getGroupDetails(group.id);
    if (fullGroup?.teacherUid) {
      return { uid: fullGroup.teacherUid, name: fullGroup.teacherName || 'Teacher' };
    }
    return null;
  };

  const handleMessageTeacher = async () => {
    try {
      const teacher = await resolveTeacher();
      if (!teacher?.uid) {
        console.warn('Teacher details unavailable for this group.');
        return;
      }
      const convId = await getOrCreateTeacherStudentConversation(
        {
          uid: teacher.uid,
          name: teacher.name,
          email: '',
          role: 'teacher',
          createdAt: Date.now(),
        },
        student
      );
      onNavigateToMessages(convId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCallTeacher = async (callType: 'audio' | 'video') => {
    const teacher = await resolveTeacher();
    if (!teacher?.uid) {
      console.warn('Teacher details unavailable for calling.');
      return;
    }
    startCall({
      targetUser: {
        uid: teacher.uid,
        name: teacher.name,
        role: 'teacher',
      },
      callType,
      groupId: group.id,
      groupName: group.name,
    });
  };

  const filteredMembers = members.filter((m) =>
    (m.studentName || '').toLowerCase().includes((memberFilter || '').toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Back button and Call actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCallTeacher('audio')}
            className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
            title="Voice Call Teacher"
          >
            <Phone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Voice Call</span>
          </button>

          <button
            onClick={() => handleCallTeacher('video')}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
            title="Video Call Teacher"
          >
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            <span>Video Call</span>
          </button>

          <button
            onClick={handleMessageTeacher}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Message</span>
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#0b1424] border border-cyan-500/30 p-6 shadow-xl overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-indigo-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-2xl shrink-0 overflow-hidden">
              {group.photoURL ? (
                <img
                  src={group.photoURL}
                  alt={group.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Users className="w-8 h-8 text-cyan-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-white">{group.name}</h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  Student Member
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-lg">
                {group.description || 'Class group on Classora.'}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-semibold text-cyan-300">
                  <Users className="w-3.5 h-3.5" /> {members.length} Enrolled Students
                </span>
                <span>• Teacher: <strong className="text-slate-200">{group.teacherName}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Card (if available) */}
      {group.announcement && (
        <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
            <Megaphone className="w-4 h-4" />
            <span>Teacher Announcement</span>
          </div>
          <p className="text-xs text-slate-200 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            {group.announcement}
          </p>
        </div>
      )}

      {/* Group Members List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Classmates ({members.length})
            </h3>
            <p className="text-[11px] text-slate-400">Students enrolled in this group</p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search classmates..."
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-56"
            />
          </div>
        </div>

        {loadingMembers ? (
          <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            Loading classmates...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No classmates found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600/20 to-purple-600/20 border border-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                    {member.studentPhotoURL ? (
                      <img
                        src={member.studentPhotoURL}
                        alt={member.studentName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      (member.studentName || 'S').charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{member.studentName}</h4>
                    <span className="text-[10px] text-slate-400">
                      {member.studentUid === student.uid ? '(You)' : 'Student'}
                    </span>
                  </div>
                </div>

                {member.studentUid !== student.uid && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        startCall({
                          targetUser: {
                            uid: member.studentUid,
                            name: member.studentName,
                            photoURL: member.studentPhotoURL,
                            role: 'student',
                            studentId: member.studentId,
                          },
                          callType: 'audio',
                          groupId: group.id,
                          groupName: group.name,
                        })
                      }
                      className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 transition"
                      title="Voice Call Classmate"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        startCall({
                          targetUser: {
                            uid: member.studentUid,
                            name: member.studentName,
                            photoURL: member.studentPhotoURL,
                            role: 'student',
                            studentId: member.studentId,
                          },
                          callType: 'video',
                          groupId: group.id,
                          groupName: group.name,
                        })
                      }
                      className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 transition"
                      title="Video Call Classmate"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
