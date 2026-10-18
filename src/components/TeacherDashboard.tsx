import React, { useEffect, useState } from 'react';
import {
  UserProfile,
  Group,
  Course,
  AIStudentReport,
  AppNotification,
  Conversation,
} from '../types';
import {
  subscribeTeacherGroups,
  subscribeTeacherCourses,
  subscribeTeacherAIReports,
  subscribeUserNotifications,
  subscribeUserConversations,
} from '../lib/databaseService';
import { TeacherHeader } from './teacher/TeacherHeader';
import { TeacherBottomNav, TeacherTab } from './teacher/TeacherBottomNav';
import { TeacherHomeView } from './teacher/TeacherHomeView';
import { TeacherGroupsView } from './teacher/TeacherGroupsView';
import { TeacherGroupDetailView } from './teacher/TeacherGroupDetailView';
import { TeacherMessagesView } from './teacher/TeacherMessagesView';
import { TeacherProfileView } from './teacher/TeacherProfileView';
import { TeacherCreateGroupModal } from './teacher/TeacherCreateGroupModal';
import { TeacherAIReportsModal } from './teacher/TeacherAIReportsModal';
import { TeacherCourseDetailView } from './teacher/TeacherCourseDetailView';
import { TeacherCreateCourseModal } from './teacher/TeacherCreateCourseModal';
import { TeacherAICallModal } from './teacher/TeacherAICallModal';
import { EnglishLearningHub } from './english/EnglishLearningHub';

interface TeacherDashboardProps {
  userProfile: UserProfile;
  onLogout?: () => void;
  onNavigateToMessages?: (convId?: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  userProfile,
  onLogout,
  onNavigateToMessages,
}) => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<TeacherTab>('HOME');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  // Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showAIReportsModal, setShowAIReportsModal] = useState(false);
  const [aiCallTarget, setAiCallTarget] = useState<{
    groupId: string;
    groupName: string;
    studentUid: string;
    studentName: string;
    studentPhone?: string;
  } | null>(null);

  // Firestore Subscribed Data
  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [aiReports, setAiReports] = useState<AIStudentReport[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // 1. Subscribe to Teacher Groups
  useEffect(() => {
    const unsub = subscribeTeacherGroups(userProfile.uid, (data) => {
      setGroups(data);
      if (selectedGroup) {
        const updated = data.find((g) => g.id === selectedGroup.id);
        if (updated) setSelectedGroup(updated);
      }
    });
    return () => unsub();
  }, [userProfile.uid, selectedGroup?.id]);

  // 2. Subscribe to Teacher Courses
  useEffect(() => {
    const unsub = subscribeTeacherCourses(userProfile.uid, (data) => {
      setCourses(data);
      if (selectedCourse) {
        const updated = data.find((c) => c.id === selectedCourse.id);
        if (updated) setSelectedCourse(updated);
      }
    });
    return () => unsub();
  }, [userProfile.uid, selectedCourse?.id]);

  // 3. Subscribe to AI Student Reports
  useEffect(() => {
    const unsub = subscribeTeacherAIReports(userProfile.uid, (data) => {
      setAiReports(data);
    });
    return () => unsub();
  }, [userProfile.uid]);

  // 4. Subscribe to Notifications
  useEffect(() => {
    const unsub = subscribeUserNotifications(userProfile.uid, (data) => {
      setNotifications(data);
    });
    return () => unsub();
  }, [userProfile.uid]);

  // 5. Subscribe to Conversations (for unread count badge)
  useEffect(() => {
    const unsub = subscribeUserConversations(userProfile.uid, (data) => {
      setConversations(data);
    });
    return () => unsub();
  }, [userProfile.uid]);

  // Unread messages count for teacher
  const unreadMessagesCount = conversations.reduce((count, c) => {
    const unread = c.unreadCount?.[userProfile.uid] || 0;
    return count + unread;
  }, 0);

  // Handlers
  const handleOpenGroupDetail = (group: Group) => {
    setSelectedGroup(group);
    setSelectedCourse(null);
    setActiveTab('GROUPS');
  };

  const handleOpenCourseDetail = (course: Course) => {
    setSelectedCourse(course);
    setSelectedGroup(null);
    setActiveTab('GROUPS');
  };

  const handleNavigateToMessages = (convId?: string) => {
    if (convId) setSelectedConvId(convId);
    setActiveTab('MESSAGES');
    if (onNavigateToMessages) {
      onNavigateToMessages(convId);
    }
  };

  const handleTabChange = (tab: TeacherTab) => {
    setActiveTab(tab);
    if (tab !== 'GROUPS') {
      setSelectedGroup(null);
      setSelectedCourse(null);
    }
  };

  const handleStartAICall = (student: {
    groupId: string;
    groupName: string;
    studentUid: string;
    studentName: string;
    studentPhone?: string;
  }) => {
    setAiCallTarget(student);
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col selection:bg-purple-500/30 selection:text-purple-200">
      {/* 1. Sleek Top Header */}
      <TeacherHeader
        userProfile={userProfile}
        notifications={notifications}
        onOpenProfile={() => handleTabChange('PROFILE')}
        onNavigateToMessages={handleNavigateToMessages}
      />

      {/* 2. Main Tabbed Content Container */}
      <main className="flex-1 max-w-2xl lg:max-w-4xl w-full mx-auto px-4 pt-4 pb-28">
        {activeTab === 'HOME' && (
          <TeacherHomeView
            userProfile={userProfile}
            groups={groups}
            courses={courses}
            aiReports={aiReports}
            onCreateGroup={() => setShowCreateGroupModal(true)}
            onCreateCourse={() => setShowCreateCourseModal(true)}
            onViewAllReports={() => setShowAIReportsModal(true)}
            onOpenGroupDetail={handleOpenGroupDetail}
            onOpenCourseDetail={handleOpenCourseDetail}
            onNavigateToGroups={() => handleTabChange('GROUPS')}
            onNavigateToCourses={() => handleTabChange('GROUPS')}
          />
        )}

        {activeTab === 'GROUPS' && (
          selectedGroup ? (
            <TeacherGroupDetailView
              group={selectedGroup}
              teacher={userProfile}
              onBack={() => setSelectedGroup(null)}
              onNavigateToMessages={handleNavigateToMessages}
              onStartAICall={(s) => handleStartAICall({
                groupId: selectedGroup.id,
                groupName: selectedGroup.name,
                studentUid: s.studentUid,
                studentName: s.studentName,
                studentPhone: s.studentPhone,
              })}
              onGroupDeleted={() => setSelectedGroup(null)}
            />
          ) : selectedCourse ? (
            <TeacherCourseDetailView
              course={selectedCourse}
              userProfile={userProfile}
              onBack={() => setSelectedCourse(null)}
              onCourseDeleted={() => setSelectedCourse(null)}
            />
          ) : (
            <TeacherGroupsView
              groups={groups}
              courses={courses}
              onCreateGroup={() => setShowCreateGroupModal(true)}
              onCreateCourse={() => setShowCreateCourseModal(true)}
              onOpenGroupDetail={handleOpenGroupDetail}
              onOpenCourseDetail={handleOpenCourseDetail}
            />
          )
        )}

        {activeTab === 'ENGLISH' && (
          <EnglishLearningHub userProfile={userProfile} />
        )}

        {activeTab === 'MESSAGES' && (
          <TeacherMessagesView
            currentUser={userProfile}
            initialConversationId={selectedConvId}
          />
        )}

        {activeTab === 'PROFILE' && (
          <TeacherProfileView
            userProfile={userProfile}
            classes={[]}
            onLogout={onLogout || (() => {})}
            onNavigateToClasses={() => handleTabChange('GROUPS')}
          />
        )}
      </main>

      {/* 3. Fixed Mobile-First Bottom Navigation Bar */}
      <TeacherBottomNav
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* 4. Modals */}
      {showCreateGroupModal && (
        <TeacherCreateGroupModal
          teacher={userProfile}
          onClose={() => setShowCreateGroupModal(false)}
          onGroupCreated={(groupId) => {
            const created = groups.find((g) => g.id === groupId);
            if (created) setSelectedGroup(created);
          }}
        />
      )}

      {showCreateCourseModal && (
        <TeacherCreateCourseModal
          userProfile={userProfile}
          onClose={() => setShowCreateCourseModal(false)}
          onCourseCreated={(res: any) => {
            if (res && typeof res === 'object' && res.id) {
              setSelectedCourse(res);
            } else if (typeof res === 'string') {
              const created = courses.find((c) => c.id === res);
              if (created) setSelectedCourse(created);
            }
          }}
        />
      )}

      {showAIReportsModal && (
        <TeacherAIReportsModal
          reports={aiReports}
          userProfile={userProfile}
          onClose={() => setShowAIReportsModal(false)}
          onNavigateToMessages={handleNavigateToMessages}
        />
      )}

      {aiCallTarget && (
        <TeacherAICallModal
          teacher={userProfile}
          studentUid={aiCallTarget.studentUid}
          studentName={aiCallTarget.studentName}
          studentPhone={aiCallTarget.studentPhone}
          groupId={aiCallTarget.groupId}
          groupName={aiCallTarget.groupName}
          onClose={() => setAiCallTarget(null)}
          onReportGenerated={() => {
            // Refreshes automatically via Firestore listener
          }}
        />
      )}
    </div>
  );
};
