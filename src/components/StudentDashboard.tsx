import React, { useEffect, useState } from 'react';
import {
  UserProfile,
  Group,
  Course,
  CourseMember,
  AppNotification,
  Conversation,
  AICallSession,
} from '../types';
import {
  subscribeStudentGroups,
  subscribeStudentCourses,
  subscribeUserNotifications,
  subscribeUserConversations,
  subscribeIncomingStudentAICall,
} from '../lib/databaseService';

import { StudentHeader } from './student/StudentHeader';
import { StudentBottomNav, StudentTab } from './student/StudentBottomNav';
import { StudentHomeView } from './student/StudentHomeView';
import { StudentGroupsView } from './student/StudentGroupsView';
import { StudentGroupDetailView } from './student/StudentGroupDetailView';
import { StudentCourseDetailView } from './student/StudentCourseDetailView';
import { StudentMessagesView } from './student/StudentMessagesView';
import { StudentProfileView } from './student/StudentProfileView';

import { StudentSearchCourseModal } from './student/StudentSearchCourseModal';
import { StudentEditProfileModal } from './student/StudentEditProfileModal';
import { StudentSettingsModal } from './student/StudentSettingsModal';
import { StudentAICallModal } from './student/StudentAICallModal';
import { EnglishLearningHub } from './english/EnglishLearningHub';

interface StudentDashboardProps {
  userProfile: UserProfile;
  onNavigateToMessages?: (convId?: string) => void;
  onLogout?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  userProfile,
  onLogout = () => {},
}) => {
  // Navigation State: Fixed 4 Primary Tabs (HOME | GROUPS | MESSAGES | PROFILE)
  const [activeTab, setActiveTab] = useState<StudentTab>('HOME');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Firestore Data State
  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseMemberships, setCourseMemberships] = useState<CourseMember[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Modals & Active Calls
  const [showJoinCourseModal, setShowJoinCourseModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [incomingAICall, setIncomingAICall] = useState<AICallSession | null>(null);

  // 1. Subscribe to student enrolled groups & incoming AI calls
  useEffect(() => {
    const unsubGroups = subscribeStudentGroups(userProfile.uid, (data) => {
      setGroups(data);
      if (selectedGroup) {
        const updated = data.find((g) => g.id === selectedGroup.id);
        if (updated) setSelectedGroup(updated);
      }
    });

    const unsubCourses = subscribeStudentCourses(userProfile.uid, (crs, mems) => {
      setCourses(crs);
      setCourseMemberships(mems);
      if (selectedCourse) {
        const updated = crs.find((c) => c.id === selectedCourse.id);
        if (updated) setSelectedCourse(updated);
      }
    });

    const unsubNotifs = subscribeUserNotifications(userProfile.uid, (data) => {
      setNotifications(data);
    });

    const unsubConvs = subscribeUserConversations(userProfile.uid, (data) => {
      setConversations(data);
    });

    // Real-time listener for incoming automated AI calls from teachers
    const unsubAICalls = subscribeIncomingStudentAICall(userProfile.uid, (call) => {
      setIncomingAICall(call);
    });

    return () => {
      unsubGroups();
      unsubCourses();
      unsubNotifs();
      unsubConvs();
      unsubAICalls();
    };
  }, [userProfile.uid, selectedCourse?.id, selectedGroup?.id]);

  // Handler to open direct teacher message or conversation
  const handleNavigateToMessages = (convId?: string) => {
    setSelectedGroup(null);
    setSelectedCourse(null);
    if (convId) {
      setActiveConversationId(convId);
    }
    setActiveTab('MESSAGES');
  };

  const unreadMessagesCount = conversations.reduce((count, c) => {
    const unread = c.unreadCount?.[userProfile.uid] || 0;
    return count + unread;
  }, 0);

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Top Header */}
      <StudentHeader
        userProfile={userProfile}
        notifications={notifications}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenProfile={() => {
          setSelectedGroup(null);
          setSelectedCourse(null);
          setActiveTab('PROFILE');
        }}
        onNavigateToMessages={handleNavigateToMessages}
      />

      {/* Main Responsive Container */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-4 pb-24">
        {/* Detail View Overlays */}
        {selectedGroup ? (
          <StudentGroupDetailView
            group={selectedGroup}
            student={userProfile}
            onBack={() => setSelectedGroup(null)}
            onNavigateToMessages={handleNavigateToMessages}
          />
        ) : selectedCourse ? (
          <StudentCourseDetailView
            course={selectedCourse}
            userProfile={userProfile}
            onBack={() => setSelectedCourse(null)}
          />
        ) : (
          <>
            {/* TAB 1: HOME */}
            {activeTab === 'HOME' && (
              <StudentHomeView
                userProfile={userProfile}
                groups={groups}
                courses={courses}
                onNavigateToGroups={() => setActiveTab('GROUPS')}
                onNavigateToCourses={() => setActiveTab('GROUPS')}
                onNavigateToMessages={() => setActiveTab('MESSAGES')}
                onSelectGroup={(g) => {
                  setSelectedCourse(null);
                  setSelectedGroup(g);
                }}
                onSelectCourse={(crs) => {
                  setSelectedGroup(null);
                  setSelectedCourse(crs);
                }}
                onOpenJoinCourseModal={() => setShowJoinCourseModal(true)}
              />
            )}

            {/* TAB 2: GROUPS & COURSES */}
            {activeTab === 'GROUPS' && (
              <StudentGroupsView
                groups={groups}
                courses={courses}
                courseMemberships={courseMemberships}
                studentProfile={userProfile}
                onOpenGroupDetail={(g) => {
                  setSelectedCourse(null);
                  setSelectedGroup(g);
                }}
                onOpenCourseDetail={(crs) => {
                  setSelectedGroup(null);
                  setSelectedCourse(crs);
                }}
                onOpenJoinCourseModal={() => setShowJoinCourseModal(true)}
              />
            )}

            {/* TAB 3: ENGLISH LEARNING HUB */}
            {activeTab === 'ENGLISH' && (
              <EnglishLearningHub userProfile={userProfile} />
            )}

            {/* TAB 4: MESSAGES */}
            {activeTab === 'MESSAGES' && (
              <StudentMessagesView
                currentUser={userProfile}
                initialConversationId={activeConversationId}
              />
            )}

            {/* TAB 4: PROFILE */}
            {activeTab === 'PROFILE' && (
              <StudentProfileView
                userProfile={userProfile}
                groups={groups}
                courses={courses}
                onOpenEditProfile={() => setShowEditProfileModal(true)}
                onOpenSettings={() => setShowSettingsModal(true)}
                onNavigateToGroups={() => setActiveTab('GROUPS')}
                onNavigateToCourses={() => setActiveTab('GROUPS')}
                onNavigateToMessages={() => setActiveTab('MESSAGES')}
                onLogout={onLogout}
              />
            )}
          </>
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <StudentBottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setSelectedGroup(null);
          setSelectedCourse(null);
          setActiveTab(tab);
        }}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* MODALS */}
      {showJoinCourseModal && (
        <StudentSearchCourseModal
          userProfile={userProfile}
          onClose={() => setShowJoinCourseModal(false)}
          onCourseSelected={(crs) => {
            setShowJoinCourseModal(false);
            setSelectedCourse(crs);
          }}
        />
      )}

      {showEditProfileModal && (
        <StudentEditProfileModal
          userProfile={userProfile}
          onClose={() => setShowEditProfileModal(false)}
        />
      )}

      {showSettingsModal && (
        <StudentSettingsModal
          userProfile={userProfile}
          onClose={() => setShowSettingsModal(false)}
          onOpenEditProfile={() => setShowEditProfileModal(true)}
          onLogout={onLogout}
        />
      )}

      {/* Real-time Incoming Automated AI Voice Call Modal */}
      {incomingAICall && (
        <StudentAICallModal
          incomingCall={incomingAICall}
          studentProfile={userProfile}
          onClose={() => setIncomingAICall(null)}
        />
      )}
    </div>
  );
};
