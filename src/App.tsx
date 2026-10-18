import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { RoleSelectScreen } from './components/RoleSelectScreen';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { MessengerView } from './components/MessengerView';
import { ClassoraLogo } from './components/ClassoraLogo';
import {
  MessageSquare,
  LogOut,
  GraduationCap,
  BookOpen,
  Home,
  Bell,
  Check,
} from 'lucide-react';
import { subscribeUserNotifications, markNotificationAsRead } from './lib/databaseService';
import { AppNotification } from './types';
import { CallProvider } from './context/CallContext';

export default function App() {
  const { firebaseUser, userProfile, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'MESSAGES'>('DASHBOARD');
  const [activeMessageConvId, setActiveMessageConvId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Subscribe to user notifications if logged in
  React.useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeUserNotifications(firebaseUser.uid, (data) => {
      setNotifications(data || []);
    });
    return () => unsub();
  }, [firebaseUser?.uid]);

  const unreadNotificationsCount = (notifications || []).filter((n) => !n.read).length;

  const handleNavigateToMessages = (convId?: string) => {
    if (convId) setActiveMessageConvId(convId);
    setCurrentView('MESSAGES');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider">
          Initializing Educational Portal...
        </p>
      </div>
    );
  }

  // 1. If not authenticated or profile not completed -> Show pure 2-role first screen
  if (!firebaseUser || !userProfile) {
    return <RoleSelectScreen />;
  }

  // 2. Wrap authenticated views with CallProvider for instant voice & video calls
  return (
    <CallProvider currentUser={userProfile}>
      {userProfile.role === 'teacher' ? (
        <TeacherDashboard userProfile={userProfile} onLogout={logout} />
      ) : (
        <StudentDashboard userProfile={userProfile} onLogout={logout} />
      )}
    </CallProvider>
  );
}

