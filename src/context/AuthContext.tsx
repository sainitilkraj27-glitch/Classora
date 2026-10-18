import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { getUserProfile, saveUserProfile, generateUniqueStudentId, generateTeacherId } from '../lib/databaseService';

interface AuthContextType {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  selectedRoleForOnboarding: UserRole | null;
  setSelectedRoleForOnboarding: (role: UserRole | null) => void;
  signInWithGoogle: () => Promise<User | null>;
  completeTeacherRegistration: (activationCode: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  completeStudentRegistration: (phone?: string, dateOfBirth?: string) => Promise<{ success: boolean; studentId?: string; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRoleForOnboarding, setSelectedRoleForOnboarding] = useState<UserRole | null>(null);

  const fetchProfile = async (uid: string) => {
    try {
      const prof = await getUserProfile(uid);
      setUserProfile(prof);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (user) {
        // Initial fetch + real-time profile listener
        await fetchProfile(user.uid);
        profileUnsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          }
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const signInWithGoogle = async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setFirebaseUser(user);
      await fetchProfile(user.uid);
      return user;
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  const completeTeacherRegistration = async (
    activationCode: string,
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseUser) return { success: false, error: 'No authenticated user found.' };

    try {
      // 1. Server-side validation of Teacher Activation Code
      const res = await fetch('/api/auth/verify-teacher-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activationCode,
          email: firebaseUser.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        return { success: false, error: data.error || 'Invalid Teacher Activation Code.' };
      }

      // 2. Generate teacher ID e.g. TCH-0001
      const teacherId = await generateTeacherId();

      // 3. Save profile to Firestore
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Teacher',
        photoURL: firebaseUser.photoURL || undefined,
        phone: phone || undefined,
        role: 'teacher',
        teacherId,
        activationCodeUsed: activationCode.toUpperCase(),
        createdAt: Date.now(),
      };

      await saveUserProfile(newProfile);
      setUserProfile(newProfile);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const completeStudentRegistration = async (
    phone?: string,
    dateOfBirth?: string
  ): Promise<{ success: boolean; studentId?: string; error?: string }> => {
    if (!firebaseUser) return { success: false, error: 'No authenticated user found.' };

    try {
      // Generate unique verified 8-digit Student ID
      const studentId = await generateUniqueStudentId();

      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Student',
        photoURL: firebaseUser.photoURL || undefined,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        role: 'student',
        studentId,
        createdAt: Date.now(),
      };

      await saveUserProfile(newProfile);
      setUserProfile(newProfile);
      return { success: true, studentId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to setup student profile.' };
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
    setFirebaseUser(null);
    setUserProfile(null);
    setSelectedRoleForOnboarding(null);
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      await fetchProfile(firebaseUser.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        loading,
        selectedRoleForOnboarding,
        setSelectedRoleForOnboarding,
        signInWithGoogle,
        completeTeacherRegistration,
        completeStudentRegistration,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
