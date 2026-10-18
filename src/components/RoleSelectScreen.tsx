import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  GraduationCap,
  ChevronRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Lock,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ClassoraLogo } from './ClassoraLogo';
import confetti from 'canvas-confetti';

export const RoleSelectScreen: React.FC = () => {
  const {
    firebaseUser,
    selectedRoleForOnboarding,
    setSelectedRoleForOnboarding,
    signInWithGoogle,
    completeTeacherRegistration,
    completeStudentRegistration,
  } = useAuth();

  const [step, setStep] = useState<'SELECT_ROLE' | 'GOOGLE_AUTH' | 'TEACHER_CODE' | 'STUDENT_SETUP' | 'SUCCESS'>('SELECT_ROLE');
  const [activationCode, setActivationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [generatedStudentId, setGeneratedStudentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChooseRole = (role: UserRole) => {
    setSelectedRoleForOnboarding(role);
    setErrorMessage(null);
    if (!firebaseUser) {
      setStep('GOOGLE_AUTH');
    } else {
      if (role === 'teacher') {
        setStep('TEACHER_CODE');
      } else {
        setStep('STUDENT_SETUP');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        if (selectedRoleForOnboarding === 'teacher') {
          setStep('TEACHER_CODE');
        } else {
          setStep('STUDENT_SETUP');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) {
      setErrorMessage('Please enter the Teacher Activation Code.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await completeTeacherRegistration(activationCode.trim(), phoneNumber.trim());
      if (res.success) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setStep('SUCCESS');
      } else {
        setErrorMessage(res.error || 'Invalid Teacher Activation Code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await completeStudentRegistration(phoneNumber.trim(), dateOfBirth);
      if (res.success && res.studentId) {
        setGeneratedStudentId(res.studentId);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setStep('SUCCESS');
      } else {
        setErrorMessage(res.error || 'Failed to complete profile.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize student account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Subtle ambient light glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-cyan-600/10 via-blue-600/15 to-indigo-900/20 rounded-full blur-[90px] pointer-events-none -z-10" />

      {/* Main Flow Card */}
      <div className="w-full max-w-md mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP 1: CLEAN MINIMAL OPENING/WELCOME SCREEN */}
          {step === 'SELECT_ROLE' && (
            <motion.div
              key="role-select"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center text-center w-full px-2 sm:px-4"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="mb-5 cursor-pointer"
              >
                <ClassoraLogo size={76} />
              </motion.div>

              {/* Title & Welcome */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="space-y-1 mb-8"
              >
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Classora
                </h1>
                <h2 className="text-lg sm:text-xl font-medium text-slate-400">
                  Welcome
                </h2>
              </motion.div>

              {/* Exactly Two Large Modern Buttons */}
              <div className="w-full space-y-4 max-w-sm">
                {/* 1. TEACHER BUTTON */}
                <motion.button
                  id="role-select-teacher-btn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChooseRole('teacher')}
                  className="w-full group relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900/80 border border-purple-500/30 hover:border-purple-400/60 shadow-[0_8px_30px_rgba(139,92,246,0.15)] hover:shadow-[0_12px_40px_rgba(139,92,246,0.3)] transition-all flex items-center justify-between text-left backdrop-blur-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <span className="text-base sm:text-lg font-bold tracking-wide text-white group-hover:text-purple-200 transition-colors">
                      TEACHER
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 group-hover:bg-purple-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.button>

                {/* 2. STUDENT BUTTON */}
                <motion.button
                  id="role-select-student-btn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.22 }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChooseRole('student')}
                  className="w-full group relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-cyan-950/50 to-slate-900/80 border border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_8px_30px_rgba(6,182,212,0.15)] hover:shadow-[0_12px_40px_rgba(6,182,212,0.3)] transition-all flex items-center justify-between text-left backdrop-blur-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <span className="text-base sm:text-lg font-bold tracking-wide text-white group-hover:text-cyan-200 transition-colors">
                      STUDENT
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300 group-hover:bg-cyan-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: GOOGLE SIGN-IN */}
          {step === 'GOOGLE_AUTH' && (
            <motion.div
              key="google-auth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-6"
            >
              <button
                onClick={() => setStep('SELECT_ROLE')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Back to role selection
              </button>

              <div className="space-y-2 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-white shadow-md">
                  {selectedRoleForOnboarding === 'teacher' ? (
                    <User className="w-7 h-7 text-purple-400" />
                  ) : (
                    <GraduationCap className="w-7 h-7 text-cyan-400" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">
                  Continue as {selectedRoleForOnboarding === 'teacher' ? 'Teacher' : 'Student'}
                </h2>
                <p className="text-xs text-slate-400">
                  Authenticate securely using your Google account to proceed with setup.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                id="google-signin-btn"
                disabled={isLoading}
                onClick={handleGoogleLogin}
                className="w-full py-3.5 px-4 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {isLoading ? 'Connecting Google Account...' : 'Continue with Google'}
              </button>
            </motion.div>
          )}

          {/* STEP 3: TEACHER ACTIVATION CODE VERIFICATION */}
          {step === 'TEACHER_CODE' && (
            <motion.div
              key="teacher-code"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Teacher Authorization</h2>
                  <p className="text-xs text-slate-400">
                    Administrator authorization is required to create a Teacher account.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
                {firebaseUser?.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt="Google Profile"
                    className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">
                    {firebaseUser?.displayName?.charAt(0) || 'T'}
                  </div>
                )}
                <div className="text-xs">
                  <p className="font-semibold text-white">{firebaseUser?.displayName}</p>
                  <p className="text-slate-400">{firebaseUser?.email}</p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleTeacherCodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Teacher Activation Code <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="teacher-activation-code-input"
                      type="text"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                      placeholder="Enter Teacher Activation Code"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono tracking-wider"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter the authorized Teacher Activation Code provided by your institution.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contact Phone Number (Optional)
                  </label>
                  <input
                    id="teacher-phone-input"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  id="submit-teacher-activation-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition shadow-lg shadow-purple-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Verifying Authorization...' : 'Authorize & Complete Setup'}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 4: STUDENT SETUP (GENERATE UNIQUE 8-DIGIT ID) */}
          {step === 'STUDENT_SETUP' && (
            <motion.div
              key="student-setup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Student Profile Setup</h2>
                  <p className="text-xs text-slate-400">
                    A unique 8-digit Student ID will be generated for your verified identity.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
                {firebaseUser?.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt="Google Profile"
                    className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white">
                    {firebaseUser?.displayName?.charAt(0) || 'S'}
                  </div>
                )}
                <div className="text-xs">
                  <p className="font-semibold text-white">{firebaseUser?.displayName}</p>
                  <p className="text-slate-400">{firebaseUser?.email}</p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleStudentSetupSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="student-phone-input"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Date of Birth (Optional)
                  </label>
                  <input
                    id="student-dob-input"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
                  ⚡ Note: You will receive your personal 8-digit Student ID (e.g. <code>48372915</code>) which can be shared with teachers to join classes.
                </div>

                <button
                  id="submit-student-setup-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition shadow-lg shadow-cyan-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Generating Student ID...' : 'Generate 8-Digit ID & Start'}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 5: SUCCESS STATE */}
          {step === 'SUCCESS' && (
            <motion.div
              key="success-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl text-center space-y-5"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Account Ready!</h2>
                <p className="text-xs text-slate-400">
                  Your identity has been authenticated and initialized.
                </p>
              </div>

              {generatedStudentId && (
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30">
                  <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-semibold">
                    Your Unique 8-Digit Student ID
                  </span>
                  <p className="text-3xl font-extrabold font-mono tracking-widest text-white mt-1">
                    {generatedStudentId}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Share this ID with teachers or peers to connect.
                  </p>
                </div>
              )}

              <button
                id="enter-dashboard-btn"
                onClick={() => window.location.reload()}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
