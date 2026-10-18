import React, { useState } from 'react';
import { Bell, Check, X, Sparkles, User, LogOut } from 'lucide-react';
import { UserProfile, AppNotification } from '../../types';
import { ClassoraLogo } from '../ClassoraLogo';
import { markNotificationAsRead } from '../../lib/databaseService';

interface StudentHeaderProps {
  userProfile: UserProfile;
  notifications?: AppNotification[];
  onOpenSettings?: () => void;
  onOpenProfile: () => void;
  onNavigateToMessages?: (convId?: string) => void;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  userProfile,
  notifications = [],
  onOpenSettings,
  onOpenProfile,
  onNavigateToMessages = () => {},
}) => {
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }
    setShowNotifPopover(false);
    if (notif.type.includes('message') || notif.type.includes('connection')) {
      onNavigateToMessages();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070913]/90 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand & Portal Identity */}
        <div className="flex items-center gap-3">
          <div className="cursor-pointer transition-transform hover:scale-105" onClick={onOpenProfile}>
            <ClassoraLogo size={36} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-white tracking-tight">Classora</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Student
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Student Workspace</p>
          </div>
        </div>

        {/* Right Actions: Notifications & Avatar */}
        <div className="flex items-center gap-2.5">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="student-notifications-btn"
              onClick={() => setShowNotifPopover(!showNotifPopover)}
              className="relative p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-[10px] font-bold text-slate-950 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifPopover && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Notifications
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {unreadCount} unread
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 mt-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-2.5 rounded-2xl transition cursor-pointer flex items-start gap-2.5 ${
                          notif.read
                            ? 'opacity-65 hover:bg-slate-800/40'
                            : 'bg-slate-800/60 hover:bg-slate-800 border-l-2 border-cyan-500'
                        }`}
                      >
                        <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 mt-0.5 shrink-0">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-white truncate">
                              {notif.title}
                            </p>
                            <span className="text-[9px] text-slate-500">
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Student Profile Avatar */}
          <button
            id="student-header-avatar-btn"
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition group"
          >
            {userProfile.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.name}
                className="w-7 h-7 rounded-xl object-cover border border-cyan-500/30"
              />
            ) : (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-slate-950">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-white leading-tight group-hover:text-cyan-300 transition truncate max-w-[100px]">
                {userProfile.name.split(' ')[0]}
              </p>
              <p className="text-[9px] font-mono text-cyan-400 leading-tight">
                {userProfile.studentId || 'STUDENT'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
