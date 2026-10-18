import React from 'react';
import { Home, Users, MessageSquare, User, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

export type StudentTab = 'HOME' | 'GROUPS' | 'CLASSES' | 'ENGLISH' | 'MESSAGES' | 'PROFILE';

interface StudentBottomNavProps {
  activeTab: StudentTab;
  onChangeTab: (tab: StudentTab) => void;
  unreadMessagesCount?: number;
}

export const StudentBottomNav: React.FC<StudentBottomNavProps> = ({
  activeTab,
  onChangeTab,
  unreadMessagesCount = 0,
}) => {
  const normalizedActive = activeTab === 'CLASSES' ? 'GROUPS' : activeTab;

  const tabs: { id: StudentTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'HOME', label: 'Home', icon: Home },
    { id: 'GROUPS', label: 'Groups', icon: Users },
    { id: 'ENGLISH', label: 'English', icon: BookOpen },
    { id: 'MESSAGES', label: 'Messages', icon: MessageSquare },
    { id: 'PROFILE', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070913]/95 backdrop-blur-2xl border-t border-slate-800/80 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-md mx-auto px-2 sm:px-4 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = normalizedActive === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              id={`student-nav-${tab.id.toLowerCase()}`}
              onClick={() => onChangeTab(tab.id)}
              className="relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 transition group select-none min-w-[56px]"
            >
              {/* Active Background Glow Pill */}
              {isActive && (
                <motion.div
                  layoutId="student-bottom-nav-indicator"
                  className="absolute inset-0 bg-cyan-500/15 border border-cyan-500/30 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? 'text-cyan-400 scale-110'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {/* Unread message badge */}
                {tab.id === 'MESSAGES' && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-lg shadow-cyan-500/40">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] font-semibold tracking-tight transition-colors duration-150 mt-1 ${
                  isActive
                    ? 'text-cyan-300 font-bold'
                    : 'text-slate-400 group-hover:text-slate-300'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
