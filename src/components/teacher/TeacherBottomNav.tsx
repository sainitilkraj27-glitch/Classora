import React from 'react';
import { motion } from 'motion/react';
import { Home, Users, MessageSquare, User, BookOpen } from 'lucide-react';

export type TeacherTab = 'HOME' | 'GROUPS' | 'CLASSES' | 'ENGLISH' | 'MESSAGES' | 'PROFILE';

interface TeacherBottomNavProps {
  activeTab: TeacherTab;
  onChangeTab: (tab: TeacherTab) => void;
  unreadMessagesCount?: number;
}

export const TeacherBottomNav: React.FC<TeacherBottomNavProps> = ({
  activeTab,
  onChangeTab,
  unreadMessagesCount = 0,
}) => {
  const normalizedActive = activeTab === 'CLASSES' ? 'GROUPS' : activeTab;

  const navItems = [
    { id: 'HOME' as TeacherTab, label: 'Home', icon: Home },
    { id: 'GROUPS' as TeacherTab, label: 'Groups', icon: Users },
    { id: 'ENGLISH' as TeacherTab, label: 'English', icon: BookOpen },
    { id: 'MESSAGES' as TeacherTab, label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
    { id: 'PROFILE' as TeacherTab, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070913]/95 backdrop-blur-2xl border-t border-slate-800/80 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-md md:max-w-lg mx-auto px-2 sm:px-4 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = normalizedActive === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id.toLowerCase()}-btn`}
              onClick={() => onChangeTab(item.id)}
              className="relative flex flex-col items-center justify-center py-1.5 px-1.5 sm:px-2.5 rounded-2xl transition-all duration-200 group min-w-[56px]"
            >
              {/* Active Background Pill Glow */}
              {isActive && (
                <motion.div
                  layoutId="teacher-nav-pill"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-cyan-500/20 rounded-xl border border-purple-500/30"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}

              {/* Icon Container with Badge */}
              <div className="relative z-10 flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? 'text-purple-400 scale-110'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-rose-500 text-white font-bold text-[9px] rounded-full min-w-[16px] text-center shadow">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-semibold mt-1 transition-colors z-10 ${
                  isActive
                    ? 'text-purple-300 font-bold'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
