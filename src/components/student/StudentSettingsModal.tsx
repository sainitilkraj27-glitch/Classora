import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Bell,
  Shield,
  Smartphone,
  Lock,
  LogOut,
  Trash2,
  Check,
  User,
  AlertTriangle,
  Globe,
  Moon,
  ChevronRight,
  Info,
  BookOpen,
  Users,
} from 'lucide-react';
import { UserProfile, UserSettings, ClassRoom, ClassMember } from '../../types';
import {
  updateUserSettings,
  deleteUserAccountAndData,
  subscribeStudentClasses,
  getClassDetails,
  leaveClass,
} from '../../lib/databaseService';

interface StudentSettingsModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  onOpenEditProfile: () => void;
  onLogout: () => void;
}

export const StudentSettingsModal: React.FC<StudentSettingsModalProps> = ({
  userProfile,
  onClose,
  onOpenEditProfile,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState<
    'ACCOUNT' | 'BATCHES' | 'NOTIFICATIONS' | 'PRIVACY' | 'APP' | 'SECURITY' | 'ACCOUNT_MGMT'
  >('ACCOUNT');

  // Enrolled batches state for settings
  const [enrolledClasses, setEnrolledClasses] = useState<ClassRoom[]>([]);
  const [batchToLeave, setBatchToLeave] = useState<ClassRoom | null>(null);
  const [isLeavingBatch, setIsLeavingBatch] = useState(false);

  // Local settings state
  const [classReminders, setClassReminders] = useState(true);
  const [attendanceReminders, setAttendanceReminders] = useState(true);
  const [aiAttendanceMessages, setAiAttendanceMessages] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [allowRequests, setAllowRequests] = useState<'everyone' | 'classmates_only' | 'none'>('everyone');
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState<'dark' | 'system'>('dark');

  // Delete account confirmation states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    const unsub = subscribeStudentClasses(userProfile.uid, async (mems) => {
      const activeMems = mems.filter((m) => m.status === 'active');
      const loaded = await Promise.all(
        activeMems.map(async (m) => {
          const cls = await getClassDetails(m.classId);
          return cls;
        })
      );
      setEnrolledClasses(loaded.filter((c): c is ClassRoom => c !== null));
    });
    return () => unsub();
  }, [userProfile.uid]);

  const handleToggleSetting = async (setter: React.Dispatch<React.SetStateAction<boolean>>, current: boolean) => {
    setter(!current);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1500);
  };

  const handleConfirmLeaveBatch = async () => {
    if (!batchToLeave) return;
    setIsLeavingBatch(true);
    try {
      await leaveClass(batchToLeave.id, userProfile.uid, userProfile.name);
      setBatchToLeave(null);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2000);
    } catch (err) {
      console.error('Error leaving class from settings:', err);
    } finally {
      setIsLeavingBatch(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') return;
    setIsDeleting(true);
    try {
      await deleteUserAccountAndData(userProfile);
      onLogout();
    } catch (err) {
      console.error('Error deleting account:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Settings</h2>
              <p className="text-[11px] text-slate-400">Student Account & Preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveToast && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Preference updated.
          </div>
        )}

        {/* Horizontal Navigation Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
          {[
            { id: 'ACCOUNT', label: 'Account' },
            { id: 'BATCHES', label: 'My Batches' },
            { id: 'NOTIFICATIONS', label: 'Notifications' },
            { id: 'PRIVACY', label: 'Privacy' },
            { id: 'APP', label: 'App' },
            { id: 'SECURITY', label: 'Security' },
            { id: 'ACCOUNT_MGMT', label: 'Delete Account' },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                activeSection === sec.id
                  ? sec.id === 'ACCOUNT_MGMT'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
          {/* SECTION 1: ACCOUNT */}
          {activeSection === 'ACCOUNT' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{userProfile.name}</h4>
                    <p className="text-slate-400 text-[11px]">{userProfile.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenEditProfile();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">8-Digit Student ID</span>
                    <span className="font-mono text-cyan-300 font-bold">{userProfile.studentId || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Role</span>
                    <span className="capitalize font-semibold text-slate-300">Student</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Authentication</span>
                    <span className="text-slate-300">Google Account</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1.5: MY ENROLLED BATCHES & LEAVE OPTION */}
          {activeSection === 'BATCHES' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                      Enrolled Batches & Classes
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Manage your active class enrollments or leave a batch.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-[10px] font-bold">
                    {enrolledClasses.length} Active
                  </span>
                </div>

                {enrolledClasses.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {enrolledClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="font-bold text-white truncate text-xs">{cls.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            Teacher: {cls.teacherName} • Subject: {cls.subject || 'General'}
                          </p>
                        </div>

                        <button
                          onClick={() => setBatchToLeave(cls)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-bold text-[11px] flex items-center gap-1 shrink-0 transition"
                        >
                          <LogOut className="w-3 h-3" /> Leave
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/50 text-center text-slate-500 text-xs">
                    You are not currently enrolled in any class batches.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: NOTIFICATIONS */}
          {activeSection === 'NOTIFICATIONS' && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Notification Preferences
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="font-semibold text-white">Class Reminders</p>
                    <p className="text-[10px] text-slate-400">Upcoming session alerts 15 min prior</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={classReminders}
                    onChange={() => handleToggleSetting(setClassReminders, classReminders)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="font-semibold text-white">Attendance Reminders</p>
                    <p className="text-[10px] text-slate-400">Alerts when attendance code opens</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={attendanceReminders}
                    onChange={() => handleToggleSetting(setAttendanceReminders, attendanceReminders)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="font-semibold text-white">AI Attendance Assistant Messages</p>
                    <p className="text-[10px] text-slate-400">Automatic check-in if absent or late</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiAttendanceMessages}
                    onChange={() => handleToggleSetting(setAiAttendanceMessages, aiAttendanceMessages)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="font-semibold text-white">Message Notifications</p>
                    <p className="text-[10px] text-slate-400">Direct chats and class group notices</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={messageNotifications}
                    onChange={() => handleToggleSetting(setMessageNotifications, messageNotifications)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: PRIVACY */}
          {activeSection === 'PRIVACY' && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Privacy Controls
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-white mb-1">
                    Who can send you Connection Requests
                  </label>
                  <select
                    value={allowRequests}
                    onChange={(e) => {
                      setAllowRequests(e.target.value as any);
                      setSaveToast(true);
                      setTimeout(() => setSaveToast(false), 1500);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="everyone">Anyone with my 8-digit Student ID</option>
                    <option value="classmates_only">Classmates in shared enrolled classes only</option>
                    <option value="none">No one (Disable incoming requests)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <p className="font-semibold text-white mb-0.5">Class Group Chat Privacy</p>
                  <p className="text-[11px] text-slate-400">
                    Student-to-student class discussion is managed by your teacher's class settings.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <p className="font-semibold text-white mb-0.5">Data Isolation</p>
                  <p className="text-[11px] text-slate-400">
                    Your personal attendance records and AI conversations are private and only shared with your respective faculty.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: APP */}
          {activeSection === 'APP' && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Application Settings
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-white mb-1">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="English">English (US)</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                    <option value="Hindi">हिंदी (Hindi)</option>
                    <option value="German">Deutsch</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-white mb-1">Theme</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="dark">Classora Dark (Default)</option>
                    <option value="system">System Synchronized</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <p className="font-semibold text-white">About Classora</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Classora Educational Messenger &bull; Version 2.4.0
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: SECURITY */}
          {activeSection === 'SECURITY' && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Security & Authentication
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Google OAuth Authentication</p>
                    <p className="text-[10px] text-slate-400">Connected to {userProfile.email}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
                    Active
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Institutional Student ID</p>
                    <p className="text-[10px] text-slate-400">System verified & immutable</p>
                  </div>
                  <Lock className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: ACCOUNT MANAGEMENT (LOGOUT & DELETE ACCOUNT) */}
          {activeSection === 'ACCOUNT_MGMT' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Account Actions
                </h3>

                <button
                  onClick={onLogout}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-slate-400" />
                  Log Out
                </button>
              </div>

              {/* DELETE ACCOUNT WITH STRICT CONFIRMATION */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Delete Account</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Permanently delete your student profile and enrolled associations. This action cannot be undone.
                </p>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Close */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>

      {/* MODAL: LEAVE BATCH CONFIRMATION FLOW */}
      {batchToLeave && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-5 h-5" /> Leave Class / Batch
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to leave <strong>{batchToLeave.name}</strong>? You will no longer be listed in this class roster.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setBatchToLeave(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLeaveBatch}
                disabled={isLeavingBatch}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-40"
              >
                {isLeavingBatch ? 'Leaving...' : 'Confirm Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE ACCOUNT CONFIRMATION FLOW */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 w-fit">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Delete Account?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will permanently delete your Classora account and associated personal data where applicable. This action cannot be undone.
              </p>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Type <strong className="text-white">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 uppercase"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.toLowerCase() !== 'delete' || isDeleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-40"
              >
                {isDeleting ? 'Deleting...' : 'DELETE ACCOUNT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
