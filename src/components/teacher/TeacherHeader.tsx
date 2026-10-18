import React, { useState } from 'react';
import { Bell, Check, Sparkles } from 'lucide-react';
import { UserProfile, AppNotification } from '../../types';
import { ClassoraLogo } from '../ClassoraLogo';
import { markNotificationAsRead } from '../../lib/databaseService';

interface TeacherHeaderProps {
  userProfile: UserProfile;
  notifications?: AppNotification[];
  onOpenProfile: () => void;
  onNavigateToMessages?: (convId?: string) => void;
}

export const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  userProfile,
  notifications = [],
  onOpenProfile,
  onNavigateToMessages = () => {},
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-[#070913]/90 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2.5">
          <ClassoraLogo size={34} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-white tracking-tight">Classora</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Faculty
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              ID: {userProfile.teacherId || 'TEACHER'}
            </p>
          </div>
        </div>

        {/* Right: Notifications & Profile Avatar */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative">
            <button
              id="teacher-notifications-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#070913] animate-pulse" />
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl z-50 p-3 space-y-2 backdrop-blur-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">Notifications</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                      {unreadCount} unread
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1.5">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            if (notif.linkUrl?.includes('messages')) {
                              onNavigateToMessages();
                            }
                            setShowNotifications(false);
                          }}
                          className={`p-2.5 rounded-xl text-xs cursor-pointer transition flex items-start justify-between gap-2 ${
                            notif.read
                              ? 'bg-slate-950/40 text-slate-400'
                              : 'bg-purple-950/40 text-white border border-purple-500/20'
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-white">{notif.title}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{notif.message}</p>
                          </div>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-1" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Teacher Avatar Button */}
          <button
            id="teacher-header-avatar-btn"
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800/80 transition"
            title="View Profile"
          >
            {userProfile.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.name}
                className="w-8 h-8 rounded-full border border-purple-500/40 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow">
                {userProfile.name.charAt(0)}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
