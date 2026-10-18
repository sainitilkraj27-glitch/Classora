import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from './firebase';
import {
  UserProfile,
  ClassRoom,
  ClassMember,
  ClassSession,
  AttendanceRecord,
  ConnectionRequest,
  Connection,
  Conversation,
  ChatMessage,
  AIConversation,
  AIReport,
  AppNotification,
  AttendanceStatus,
  Course,
  CourseMaterial,
  CourseStudent,
  CourseMember,
  CourseJoinRequest,
  MaterialType,
  Group,
  GroupMember,
  AIStudentReport,
  AICallRecord,
  AICallSession,
  GroupSettings,
  GroupChatTheme,
  EnglishMaterial,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  // Gracefully handle database closing or hidden or offline network events in iframe
  if (
    errMsg.includes('closing') ||
    errMsg.includes('hidden') ||
    errMsg.includes('the client is offline') ||
    errMsg.includes('aborted')
  ) {
    console.warn(`Firestore [${operationType}] at ${path}: ${errMsg}`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    operationType,
    path,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// ==================== USER & PROFILE ====================

// Generate unique 8-digit Student ID (e.g., "48372915") and verify uniqueness
export async function generateUniqueStudentId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    // 8-digit number between 10000000 and 99999999
    const candidate = Math.floor(10000000 + Math.random() * 90000000).toString();
    const q = query(collection(db, 'users'), where('studentId', '==', candidate));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return candidate;
    }
  }
  // Fallback timestamp-derived 8-digit
  return (Date.now() % 100000000).toString().padStart(8, '4');
}

// Generate Teacher ID (e.g., "TCH-0042")
export async function generateTeacherId(): Promise<string> {
  const teachersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
  const nextNum = teachersSnap.size + 1;
  return `TCH-${nextNum.toString().padStart(4, '0')}`;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Error getting user profile:', err);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const cleanProfile: Record<string, any> = {
    uid: profile.uid,
    email: profile.email || '',
    name: profile.name || '',
    role: profile.role,
    photoURL: profile.photoURL || '',
    phone: profile.phone || '',
    createdAt: profile.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  if (profile.teacherId) cleanProfile.teacherId = profile.teacherId;
  if (profile.studentId) cleanProfile.studentId = profile.studentId;
  if (profile.dateOfBirth) cleanProfile.dateOfBirth = profile.dateOfBirth;
  if (profile.activationCodeUsed) cleanProfile.activationCodeUsed = profile.activationCodeUsed;

  await setDoc(doc(db, 'users', profile.uid), cleanProfile, { merge: true });

  // Maintain lookup index in specific role collection
  if (profile.role === 'teacher') {
    await setDoc(doc(db, 'teachers', profile.uid), {
      uid: profile.uid,
      teacherId: profile.teacherId || '',
      name: profile.name || '',
      email: profile.email || '',
      photoURL: profile.photoURL || '',
    }, { merge: true });
  } else if (profile.role === 'student') {
    await setDoc(doc(db, 'students', profile.uid), {
      uid: profile.uid,
      studentId: profile.studentId || '',
      name: profile.name || '',
      email: profile.email || '',
      photoURL: profile.photoURL || '',
    }, { merge: true });
  }
}

export async function searchStudentById(studentId: string): Promise<UserProfile | null> {
  const clean = studentId.trim();
  if (clean.length !== 8) return null;

  const q = query(collection(db, 'users'), where('studentId', '==', clean), where('role', '==', 'student'));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].data() as UserProfile;
  }
  return null;
}

// ==================== TEACHER-CONTROLLED GROUPS SYSTEM ====================

export async function createGroup(
  teacher: UserProfile,
  data: {
    name: string;
    description: string;
    photoURL?: string;
    theme?: GroupChatTheme;
    settings?: Partial<GroupSettings>;
  }
): Promise<string> {
  const groupRef = doc(collection(db, 'groups'));
  const newGroup: Group = {
    id: groupRef.id,
    name: data.name.trim(),
    description: (data.description || '').trim(),
    photoURL: data.photoURL || '',
    teacherUid: teacher.uid,
    teacherName: teacher.name || 'Teacher',
    teacherId: teacher.teacherId || 'TEACHER',
    studentCount: 0,
    memberCount: 0,
    isActive: true,
    theme: data.theme || 'whatsapp',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: {
      allowStudentChat: data.settings?.allowStudentChat ?? true,
      onlyAdminCanPost: data.settings?.onlyAdminCanPost ?? false,
      onlyTeachersCanSend: data.settings?.onlyTeachersCanSend ?? false,
      allowMediaSharing: data.settings?.allowMediaSharing ?? true,
      mutedStudentUids: data.settings?.mutedStudentUids ?? [],
      theme: data.theme || 'whatsapp',
    },
  };

  await setDoc(groupRef, newGroup);
  return groupRef.id;
}

export async function updateGroup(
  groupId: string,
  updates: Partial<Omit<Group, 'id' | 'createdAt' | 'teacherUid'>>
): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  const cleanUpdates: Record<string, any> = { updatedAt: Date.now() };

  if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
  if (updates.description !== undefined) cleanUpdates.description = updates.description.trim();
  if (updates.photoURL !== undefined) cleanUpdates.photoURL = updates.photoURL;
  if (updates.announcement !== undefined) cleanUpdates.announcement = updates.announcement;
  if (updates.announcementUpdatedAt !== undefined) cleanUpdates.announcementUpdatedAt = updates.announcementUpdatedAt;
  if (updates.theme !== undefined) cleanUpdates.theme = updates.theme;
  if (updates.isActive !== undefined) cleanUpdates.isActive = Boolean(updates.isActive);
  if (updates.settings !== undefined) {
    cleanUpdates.settings = {
      allowStudentChat: updates.settings.allowStudentChat ?? true,
      onlyAdminCanPost: updates.settings.onlyAdminCanPost ?? false,
      onlyTeachersCanSend: updates.settings.onlyTeachersCanSend ?? false,
      allowMediaSharing: updates.settings.allowMediaSharing ?? true,
      mutedStudentUids: updates.settings.mutedStudentUids ?? [],
      theme: updates.settings.theme || updates.theme || 'whatsapp',
    };
  }

  await updateDoc(groupRef, cleanUpdates);
}

export function subscribeGroup(groupId: string, callback: (group: Group | null) => void) {
  return onSnapshot(
    doc(db, 'groups', groupId),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Group);
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'groups');
    }
  );
}

export async function toggleMuteStudentInGroup(
  groupId: string,
  studentUid: string,
  shouldMute: boolean
): Promise<void> {
  const groupSnap = await getDoc(doc(db, 'groups', groupId));
  if (!groupSnap.exists()) return;
  const group = groupSnap.data() as Group;
  const currentMuted = group.settings?.mutedStudentUids || [];

  let nextMuted: string[];
  if (shouldMute) {
    nextMuted = Array.from(new Set([...currentMuted, studentUid]));
  } else {
    nextMuted = currentMuted.filter((id) => id !== studentUid);
  }

  await updateGroup(groupId, {
    settings: {
      ...(group.settings || { allowStudentChat: true }),
      mutedStudentUids: nextMuted,
    },
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  // Delete all group members
  const membersSnap = await getDocs(query(collection(db, 'groupMembers'), where('groupId', '==', groupId)));
  const batch = writeBatch(db);
  membersSnap.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  // Delete group doc
  await deleteDoc(doc(db, 'groups', groupId));
}

export function subscribeTeacherGroups(teacherUid: string, callback: (groups: Group[]) => void) {
  const q = query(
    collection(db, 'groups'),
    where('teacherUid', '==', teacherUid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Group);
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'groups');
    }
  );
}

export function subscribeStudentGroups(
  studentUid: string,
  callback: (groups: Group[]) => void
): () => void {
  const q = query(
    collection(db, 'groupMembers'),
    where('studentUid', '==', studentUid)
  );
  return onSnapshot(
    q,
    async (snap) => {
      if (snap.empty) {
        callback([]);
        return;
      }
      const memberships = snap.docs.map((d) => d.data() as GroupMember);
      const activeMemberships = memberships.filter((m) => m.status === 'active' || !m.status);
      const groupIds = Array.from(new Set(activeMemberships.map((d) => d.groupId).filter(Boolean))) as string[];

      const groups: Group[] = [];
      for (const gId of groupIds) {
        try {
          const gSnap = await getDoc(doc(db, 'groups', gId));
          if (gSnap.exists()) {
            groups.push(gSnap.data() as Group);
          }
        } catch (e) {
          console.warn('Error fetching group doc:', gId, e);
        }
      }
      callback(groups);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'groupMembers');
    }
  );
}

export function subscribeGroupMembers(groupId: string, callback: (members: GroupMember[]) => void) {
  const q = query(
    collection(db, 'groupMembers'),
    where('groupId', '==', groupId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as GroupMember);
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'groupMembers');
    }
  );
}

export async function getGroupDetails(groupId: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, 'groups', groupId));
  if (snap.exists()) {
    return snap.data() as Group;
  }
  return null;
}

export async function addStudentToGroupByTeacher(
  groupId: string,
  studentIdNum: string,
  teacher: UserProfile
): Promise<{ success: boolean; message: string; student?: UserProfile }> {
  const student = await searchStudentById(studentIdNum);
  if (!student) {
    return { success: false, message: `No student found with ID: ${studentIdNum}. Please verify the 8-digit ID.` };
  }

  const group = await getGroupDetails(groupId);
  if (!group) {
    return { success: false, message: 'Group not found.' };
  }

  const memberId = `${groupId}_${student.uid}`;
  const memberRef = doc(db, 'groupMembers', memberId);
  const existing = await getDoc(memberRef);

  if (existing.exists()) {
    return { success: false, message: `${student.name} is already a member of "${group.name}".` };
  }

  const member: GroupMember = {
    id: memberId,
    groupId,
    groupName: group.name,
    studentUid: student.uid,
    studentId: student.studentId || studentIdNum,
    studentName: student.name || 'Student',
    studentEmail: student.email || '',
    studentPhotoURL: student.photoURL || '',
    studentPhone: student.phone || '',
    joinedAt: Date.now(),
    role: 'member',
    status: 'active',
  };

  await setDoc(memberRef, member);
  await updateDoc(doc(db, 'groups', groupId), {
    memberCount: increment(1),
    updatedAt: Date.now(),
  });

  // Notify student
  await createNotification({
    targetUid: student.uid,
    title: `Added to Group: ${group.name}`,
    message: `Teacher ${teacher.name} added you to the group "${group.name}".`,
    type: 'class_invitation',
    linkUrl: `/groups/${groupId}`,
  });

  return { success: true, message: `Successfully added ${student.name} (ID: ${student.studentId}) to "${group.name}".`, student };
}

export async function removeStudentFromGroupByTeacher(
  groupId: string,
  studentUid: string
): Promise<{ success: boolean; message: string }> {
  const memberId = `${groupId}_${studentUid}`;
  const memberRef = doc(db, 'groupMembers', memberId);
  await deleteDoc(memberRef);

  await updateDoc(doc(db, 'groups', groupId), {
    memberCount: increment(-1),
    updatedAt: Date.now(),
  });

  return { success: true, message: 'Student removed from group successfully.' };
}

export async function postGroupAnnouncement(groupId: string, announcement: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), {
    announcement: announcement.trim(),
    updatedAt: Date.now(),
  });
}

// ==================== AI STUDENT CALL & REPORTS ====================

export async function saveAIStudentReport(reportData: Omit<AIStudentReport, 'id'>): Promise<string> {
  const reportRef = doc(collection(db, 'aiStudentReports'));
  const report: AIStudentReport = {
    id: reportRef.id,
    ...reportData,
    createdAt: Date.now(),
  };
  await setDoc(reportRef, report);
  return reportRef.id;
}

export function subscribeTeacherAIStudentReports(teacherUid: string, callback: (reports: AIStudentReport[]) => void) {
  const q = query(
    collection(db, 'aiStudentReports'),
    where('teacherUid', '==', teacherUid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as AIStudentReport);
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'aiStudentReports');
    }
  );
}

export async function deleteAIStudentReport(reportId: string): Promise<void> {
  await deleteDoc(doc(db, 'aiStudentReports', reportId));
}

export async function acknowledgeAIReport(reportId: string): Promise<void> {
  await updateDoc(doc(db, 'aiStudentReports', reportId), {
    isAcknowledgedByTeacher: true,
  });
}

// Real-time Automated AI Student Voice Call Orchestration
export async function initiateStudentAICall(params: {
  teacherUid: string;
  teacherName: string;
  teacherPhotoURL?: string;
  studentUid: string;
  studentName: string;
  studentId: string;
  studentPhotoURL?: string;
  studentPhone?: string;
  groupId?: string;
  groupName?: string;
  classId?: string;
  className?: string;
  customGreeting?: string;
}): Promise<string> {
  const callRef = doc(collection(db, 'aiCalls'));
  const now = Date.now();
  const branchName = params.groupName || params.className || 'FEA';
  const initialGreeting =
    params.customGreeting ||
    `Hello! Main ${branchName} branch ki AI bol rahi hoon, aaj kyu nahi aa rahe ho class me?`;

  const session: AICallSession = {
    id: callRef.id,
    callType: 'ai_attendance_call',
    status: 'ringing',
    teacherUid: params.teacherUid,
    teacherName: params.teacherName,
    teacherPhotoURL: params.teacherPhotoURL || '',
    studentUid: params.studentUid,
    studentName: params.studentName,
    studentId: params.studentId,
    studentPhotoURL: params.studentPhotoURL || '',
    studentPhone: params.studentPhone || '',
    groupId: params.groupId || '',
    groupName: params.groupName || branchName,
    classId: params.classId || '',
    className: params.className || '',
    aiInitialGreeting: initialGreeting,
    transcript: [
      {
        speaker: 'ai',
        text: initialGreeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(callRef, session);
  return callRef.id;
}

// Student listens for incoming AI attendance calls
export function subscribeIncomingStudentAICall(
  studentUid: string,
  callback: (call: AICallSession | null) => void
): () => void {
  if (!studentUid) return () => {};
  const q = query(
    collection(db, 'aiCalls'),
    where('studentUid', '==', studentUid)
  );

  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        callback(null);
      } else {
        const activeCalls = snap.docs
          .map((d) => d.data() as AICallSession)
          .filter((c) => ['calling', 'ringing', 'connected', 'in-progress'].includes(c.status))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        if (activeCalls.length > 0) {
          callback(activeCalls[0]);
        } else {
          callback(null);
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'aiCalls');
    }
  );
}

// Subscribe to a specific active AI Call Session
export function subscribeAICallSession(
  callId: string,
  callback: (call: AICallSession | null) => void
): () => void {
  if (!callId) return () => {};
  return onSnapshot(
    doc(db, 'aiCalls', callId),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as AICallSession);
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'aiCalls');
    }
  );
}

export async function updateAICallSession(
  callId: string,
  updates: Partial<AICallSession>
): Promise<void> {
  const callRef = doc(db, 'aiCalls', callId);
  await updateDoc(callRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function answerAICall(callId: string): Promise<void> {
  await updateDoc(doc(db, 'aiCalls', callId), {
    status: 'connected',
    updatedAt: Date.now(),
  });
}

export async function declineAICall(callId: string): Promise<void> {
  await updateDoc(doc(db, 'aiCalls', callId), {
    status: 'declined',
    updatedAt: Date.now(),
  });
}

export async function completeAICallWithReport(
  callId: string,
  reportData: Omit<AIStudentReport, 'id'>,
  transcript?: Array<{ speaker: 'ai' | 'student'; text: string; time?: string }>
): Promise<string> {
  // 1. Save the formal AI Report for the teacher
  const reportId = await saveAIStudentReport(reportData);

  // 2. Mark AI call session as completed and link report
  const callRef = doc(db, 'aiCalls', callId);
  const snap = await getDoc(callRef);
  if (snap.exists()) {
    await updateDoc(callRef, {
      status: 'completed',
      aiReportId: reportId,
      studentResponseText: reportData.reason || reportData.response || '',
      studentAttendingStatus: reportData.response as any,
      aiSummary: reportData.aiSummary || '',
      ...(transcript ? { transcript } : {}),
      updatedAt: Date.now(),
    });
  }

  return reportId;
}

// Initiate AI Call via backend API
export async function initiateAIStudentCall(params: {
  teacherUid: string;
  teacherName: string;
  studentUid: string;
  studentName: string;
  studentId: string;
  studentPhone?: string;
  groupId?: string;
  groupName?: string;
}): Promise<any> {
  const res = await fetch('/api/ai/initiate-call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return await res.json();
}

// Process AI Call Spoken Response via backend API
export async function processAICallResponse(params: {
  studentName: string;
  studentId: string;
  teacherName: string;
  isAttending: boolean;
  studentAnswerText?: string;
  groupName?: string;
}): Promise<any> {
  const res = await fetch('/api/ai/process-call-response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return await res.json();
}

// ==================== CLASSES & SESSIONS ====================

// Generate random 6-character alphanumeric Join Code for classes
export function generateClassJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createClass(classRoom: Omit<ClassRoom, 'id' | 'createdAt' | 'studentCount'>): Promise<string> {
  const classRef = doc(collection(db, 'classes'));
  const newClass: ClassRoom = {
    id: classRef.id,
    name: (classRoom.name || '').trim(),
    subject: typeof classRoom.subject === 'string' ? classRoom.subject.trim() : '',
    description: typeof classRoom.description === 'string' ? classRoom.description.trim() : '',
    teacherUid: classRoom.teacherUid || '',
    teacherId: classRoom.teacherId || 'TEACHER',
    teacherName: classRoom.teacherName || '',
    joinCode: classRoom.joinCode || generateClassJoinCode(),
    accessType: classRoom.accessType || 'public',
    timing: {
      startTime: classRoom.timing?.startTime || '17:00',
      endTime: classRoom.timing?.endTime || '18:00',
      attendanceOpeningTime: classRoom.timing?.attendanceOpeningTime || '16:45',
      attendanceDeadline: classRoom.timing?.attendanceDeadline || '17:10',
      lateThreshold: classRoom.timing?.lateThreshold || '17:30',
      daysOfWeek: Array.isArray(classRoom.timing?.daysOfWeek) ? classRoom.timing.daysOfWeek : [1, 2, 3, 4, 5],
      allowStudentChat: classRoom.timing?.allowStudentChat ?? true,
    },
    isActive: classRoom.isActive !== undefined ? Boolean(classRoom.isActive) : true,
    studentCount: 0,
    createdAt: Date.now(),
  };
  await setDoc(classRef, newClass);
  return classRef.id;
}

export async function updateClass(
  classId: string,
  updates: Partial<Omit<ClassRoom, 'id' | 'createdAt' | 'teacherUid'>>
): Promise<void> {
  const classRef = doc(db, 'classes', classId);
  const cleanUpdates: Record<string, any> = {};

  if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
  if (updates.subject !== undefined) cleanUpdates.subject = updates.subject.trim();
  if (updates.description !== undefined) cleanUpdates.description = updates.description.trim();
  if (updates.teacherName !== undefined) cleanUpdates.teacherName = updates.teacherName.trim();
  if (updates.accessType !== undefined) cleanUpdates.accessType = updates.accessType;
  if (updates.isActive !== undefined) cleanUpdates.isActive = Boolean(updates.isActive);
  if (updates.timing !== undefined) {
    cleanUpdates.timing = {
      startTime: updates.timing.startTime || '17:00',
      endTime: updates.timing.endTime || '18:00',
      attendanceOpeningTime: updates.timing.attendanceOpeningTime || '16:45',
      attendanceDeadline: updates.timing.attendanceDeadline || '17:10',
      lateThreshold: updates.timing.lateThreshold || '17:30',
      daysOfWeek: Array.isArray(updates.timing.daysOfWeek) ? updates.timing.daysOfWeek : [1, 2, 3, 4, 5],
      allowStudentChat: updates.timing.allowStudentChat ?? true,
    };
  }

  if (Object.keys(cleanUpdates).length > 0) {
    await updateDoc(classRef, cleanUpdates);
  }
}

export function subscribeTeacherClasses(teacherUid: string, callback: (classes: ClassRoom[]) => void) {
  const q = query(
    collection(db, 'classes'),
    where('teacherUid', '==', teacherUid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const classes = snap.docs.map((d) => d.data() as ClassRoom);
      callback(classes);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'classes');
    }
  );
}

export function subscribeStudentClasses(studentUid: string, callback: (memberships: ClassMember[]) => void) {
  const q = query(
    collection(db, 'classMembers'),
    where('studentUid', '==', studentUid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as ClassMember);
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'classMembers');
    }
  );
}

export async function getClassDetails(classId: string): Promise<ClassRoom | null> {
  const snap = await getDoc(doc(db, 'classes', classId));
  if (snap.exists()) {
    return snap.data() as ClassRoom;
  }
  return null;
}

// Search class by 6-char Join Code or exact Class ID / UID
export async function searchClassByCodeOrId(queryStr: string): Promise<ClassRoom | null> {
  const clean = queryStr.trim();
  if (!clean) return null;

  // Try direct doc ID
  const directDoc = await getDoc(doc(db, 'classes', clean));
  if (directDoc.exists() && directDoc.data()?.isActive) {
    return directDoc.data() as ClassRoom;
  }

  // Try joinCode
  const q = query(
    collection(db, 'classes'),
    where('joinCode', '==', clean.toUpperCase()),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].data() as ClassRoom;
  }
  return null;
}

export async function joinClassByCode(
  joinCodeOrId: string,
  student: UserProfile
): Promise<{ success: boolean; message: string; classId?: string; isPending?: boolean }> {
  const cleanCode = joinCodeOrId.trim();
  let classData = await searchClassByCodeOrId(cleanCode);

  if (!classData) {
    return { success: false, message: 'Invalid or inactive Class Join Code / UID.' };
  }

  const memberId = `${classData.id}_${student.uid}`;
  const memberRef = doc(db, 'classMembers', memberId);
  const existingMember = await getDoc(memberRef);

  if (existingMember.exists()) {
    const status = existingMember.data()?.status;
    if (status === 'active') {
      return { success: false, message: 'You are already an active member of this class.' };
    }
    if (status === 'pending') {
      return { success: false, message: 'You have already requested to join this class. Please wait for teacher approval.' };
    }
  }

  const isPrivate = classData.accessType === 'private';
  const newStatus = isPrivate ? 'pending' : 'active';

  const member: ClassMember = {
    id: memberId,
    classId: classData.id,
    studentUid: student.uid,
    studentId: student.studentId || 'UNKNOWN',
    studentName: student.name || '',
    studentEmail: student.email || '',
    studentPhotoURL: student.photoURL || '',
    joinedAt: Date.now(),
    status: newStatus,
  };

  await setDoc(memberRef, member);

  if (!isPrivate) {
    await updateDoc(doc(db, 'classes', classData.id), {
      studentCount: increment(1),
    });

    // Notify teacher
    await createNotification({
      targetUid: classData.teacherUid,
      title: 'New Student Joined Class',
      message: `${student.name} (ID: ${student.studentId || 'UNKNOWN'}) has joined "${classData.name}".`,
      type: 'student_joined',
      linkUrl: `/classes/${classData.id}`,
    });

    return {
      success: true,
      message: `Successfully joined ${classData.name}!`,
      classId: classData.id,
      isPending: false,
    };
  } else {
    // Notify teacher about pending request
    await createNotification({
      targetUid: classData.teacherUid,
      title: 'Private Class Join Request',
      message: `${student.name} (ID: ${student.studentId || 'UNKNOWN'}) requested to join your private class "${classData.name}".`,
      type: 'class_invitation',
      linkUrl: `/classes/${classData.id}`,
    });

    return {
      success: true,
      message: `Join request sent to teacher for "${classData.name}". You will be enrolled once approved!`,
      classId: classData.id,
      isPending: true,
    };
  }
}

export function subscribeClassPendingRequests(classId: string, callback: (requests: ClassMember[]) => void) {
  const q = query(
    collection(db, 'classMembers'),
    where('classId', '==', classId),
    where('status', '==', 'pending')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as ClassMember));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'classMembers');
    }
  );
}

export async function approveClassJoinRequest(
  classId: string,
  studentUid: string,
  classRoom: ClassRoom
): Promise<void> {
  const memberId = `${classId}_${studentUid}`;
  const memberRef = doc(db, 'classMembers', memberId);

  await updateDoc(memberRef, {
    status: 'active',
    joinedAt: Date.now(),
  });

  await updateDoc(doc(db, 'classes', classId), {
    studentCount: increment(1),
  });

  // Notify student
  await createNotification({
    targetUid: studentUid,
    title: 'Class Join Request Approved! 🎉',
    message: `Your request to join class "${classRoom.name}" was approved by ${classRoom.teacherName || 'Teacher'}.`,
    type: 'class_invitation',
    linkUrl: `/classes/${classId}`,
  });
}

export async function rejectClassJoinRequest(
  classId: string,
  studentUid: string
): Promise<void> {
  const memberId = `${classId}_${studentUid}`;
  const memberRef = doc(db, 'classMembers', memberId);
  await deleteDoc(memberRef);
}

export async function addStudentToClassByTeacher(classId: string, studentIdNum: string, teacher: UserProfile): Promise<{ success: boolean; message: string }> {
  const student = await searchStudentById(studentIdNum);
  if (!student) {
    return { success: false, message: `No student found with ID ${studentIdNum}.` };
  }

  const classData = await getClassDetails(classId);
  if (!classData) {
    return { success: false, message: 'Class not found.' };
  }

  const memberId = `${classId}_${student.uid}`;
  const memberRef = doc(db, 'classMembers', memberId);

  const member: ClassMember = {
    id: memberId,
    classId,
    studentUid: student.uid,
    studentId: student.studentId || studentIdNum,
    studentName: student.name || '',
    studentEmail: student.email || '',
    studentPhotoURL: student.photoURL || '',
    joinedAt: Date.now(),
    status: 'active',
  };

  await setDoc(memberRef, member);
  await updateDoc(doc(db, 'classes', classId), {
    studentCount: increment(1),
  });

  // Notify student
  await createNotification({
    targetUid: student.uid,
    title: 'Added to New Class',
    message: `Teacher ${teacher.name} added you to class "${classData.name}".`,
    type: 'class_invitation',
    linkUrl: `/classes/${classId}`,
  });

  return { success: true, message: `${student.name} (ID: ${student.studentId}) was added to the class!` };
}

export function subscribeClassMembers(classId: string, callback: (members: ClassMember[]) => void) {
  const q = query(
    collection(db, 'classMembers'),
    where('classId', '==', classId),
    where('status', '==', 'active')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as ClassMember));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'classMembers');
    }
  );
}

// Generate temporary 4-digit numeric session attendance code
export function generateAttendanceCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Create and start a class session
export async function startClassSession(
  classRoom: ClassRoom,
  customTimes?: {
    startTime?: string;
    endTime?: string;
    attendanceOpensAt?: string;
    attendanceDeadline?: string;
    lateCutoff?: string;
  }
): Promise<ClassSession> {
  const sessionRef = doc(collection(db, 'sessions'));
  const todayStr = new Date().toISOString().split('T')[0];
  const attendanceCode = generateAttendanceCode();

  const membersSnap = await getDocs(
    query(collection(db, 'classMembers'), where('classId', '==', classRoom.id), where('status', '==', 'active'))
  );
  const totalStudents = membersSnap.size;

  const session: ClassSession = {
    id: sessionRef.id,
    classId: classRoom.id,
    className: classRoom.name,
    teacherUid: classRoom.teacherUid,
    teacherId: classRoom.teacherId,
    date: todayStr,
    startTime: customTimes?.startTime || classRoom.timing.startTime,
    endTime: customTimes?.endTime || classRoom.timing.endTime,
    attendanceCode,
    attendanceOpensAt: customTimes?.attendanceOpensAt || classRoom.timing.attendanceOpeningTime,
    attendanceDeadline: customTimes?.attendanceDeadline || classRoom.timing.attendanceDeadline,
    lateCutoff: customTimes?.lateCutoff || classRoom.timing.lateThreshold,
    status: 'active',
    totalStudents,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    pendingCount: totalStudents,
    createdAt: Date.now(),
  };

  await setDoc(sessionRef, session);

  // Pre-seed PENDING attendance records for all active class members
  const batch = writeBatch(db);
  membersSnap.forEach((mDoc) => {
    const member = mDoc.data() as ClassMember;
    const attId = `${session.id}_${member.studentUid}`;
    const attRef = doc(db, 'attendance', attId);
    batch.set(attRef, {
      id: attId,
      sessionId: session.id,
      classId: classRoom.id,
      className: classRoom.name,
      studentUid: member.studentUid,
      studentId: member.studentId || 'UNKNOWN',
      studentName: member.studentName || '',
      studentPhotoURL: member.studentPhotoURL || '',
      status: 'PENDING',
      submittedAt: null,
    } as AttendanceRecord);
  });
  await batch.commit();

  return session;
}

export function subscribeActiveTeacherSession(teacherUid: string, callback: (sessions: ClassSession[]) => void) {
  const q = query(
    collection(db, 'sessions'),
    where('teacherUid', '==', teacherUid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as ClassSession));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'sessions');
    }
  );
}

export function subscribeSessionAttendance(sessionId: string, callback: (records: AttendanceRecord[]) => void) {
  const q = query(collection(db, 'attendance'), where('sessionId', '==', sessionId));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as AttendanceRecord));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'attendance');
    }
  );
}

export function subscribeStudentAttendanceHistory(studentUid: string, callback: (records: AttendanceRecord[]) => void) {
  const q = query(
    collection(db, 'attendance'),
    where('studentUid', '==', studentUid),
    orderBy('id', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as AttendanceRecord));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'attendance');
    }
  );
}

// Student submit attendance code with server verification
export async function submitStudentAttendance(
  session: ClassSession,
  student: UserProfile,
  code: string
): Promise<{ success: boolean; status?: AttendanceStatus; message: string }> {
  try {
    // 1. Verify membership
    const memberDoc = await getDoc(doc(db, 'classMembers', `${session.classId}_${student.uid}`));
    if (!memberDoc.exists() || memberDoc.data()?.status !== 'active') {
      return { success: false, message: 'You are not an authorized member of this class.' };
    }

    // 2. Call server-side verification endpoint
    const response = await fetch('/api/attendance/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session,
        enteredCode: code,
        currentTime: Date.now(),
      }),
    });

    const resData = await response.json();
    if (!response.ok || !resData.valid) {
      return { success: false, message: resData.error || 'Attendance submission failed.' };
    }

    const calculatedStatus: AttendanceStatus = resData.status || 'PRESENT';
    const attId = `${session.id}_${student.uid}`;
    const attRef = doc(db, 'attendance', attId);

    // Check if already submitted
    const existing = await getDoc(attRef);
    if (existing.exists() && existing.data()?.status !== 'PENDING' && existing.data()?.status !== undefined) {
      return { success: false, message: `You have already submitted attendance (${existing.data().status}).` };
    }

    await setDoc(attRef, {
      id: attId,
      sessionId: session.id,
      classId: session.classId,
      className: session.className,
      studentUid: student.uid,
      studentId: student.studentId || 'UNKNOWN',
      studentName: student.name || '',
      studentPhotoURL: student.photoURL || '',
      status: calculatedStatus,
      submittedCode: code,
      submittedAt: Date.now(),
      verifiedAt: Date.now(),
      verifiedBy: 'student_code',
    }, { merge: true });

    // Update Session Counters
    const updateField = calculatedStatus === 'PRESENT' ? 'presentCount' : calculatedStatus === 'LATE' ? 'lateCount' : 'absentCount';
    await updateDoc(doc(db, 'sessions', session.id), {
      [updateField]: increment(1),
      pendingCount: increment(-1),
    });

    return {
      success: true,
      status: calculatedStatus,
      message: `Checked in as ${calculatedStatus}!`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error recording attendance.' };
  }
}

// Teacher manually override student attendance status
export async function updateStudentAttendanceByTeacher(
  sessionId: string,
  studentUid: string,
  newStatus: AttendanceStatus,
  notes?: string
): Promise<void> {
  const attId = `${sessionId}_${studentUid}`;
  const attRef = doc(db, 'attendance', attId);
  const oldDoc = await getDoc(attRef);
  const oldStatus = oldDoc.data()?.status as AttendanceStatus | undefined;

  await updateDoc(attRef, {
    status: newStatus,
    notes: notes || 'Updated by teacher',
    verifiedBy: 'teacher_override',
    verifiedAt: Date.now(),
  });

  // Re-calculate session metrics
  const sessionSnap = await getDocs(query(collection(db, 'attendance'), where('sessionId', '==', sessionId)));
  let present = 0, late = 0, absent = 0, pending = 0;
  sessionSnap.forEach((d) => {
    const st = d.data().status;
    if (st === 'PRESENT') present++;
    else if (st === 'LATE') late++;
    else if (st === 'ABSENT' || st === 'EXCUSED') absent++;
    else pending++;
  });

  await updateDoc(doc(db, 'sessions', sessionId), {
    presentCount: present,
    lateCount: late,
    absentCount: absent,
    pendingCount: pending,
  });
}

// Complete session & trigger automated late/absent backend sweep
export async function closeClassSession(sessionId: string): Promise<void> {
  const attSnap = await getDocs(query(collection(db, 'attendance'), where('sessionId', '==', sessionId)));
  const batch = writeBatch(db);

  let absentIncrement = 0;
  let pendingCount = 0;

  attSnap.forEach((d) => {
    const data = d.data() as AttendanceRecord;
    if (data.status === 'PENDING') {
      // Mark unresolved pending as ABSENT
      batch.update(d.ref, {
        status: 'ABSENT',
        verifiedBy: 'backend_scheduled_job',
        verifiedAt: Date.now(),
      });
      absentIncrement++;
    }
  });

  await batch.commit();

  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'completed',
    completedAt: Date.now(),
    absentCount: increment(absentIncrement),
    pendingCount: 0,
  });
}

// ==================== CONNECTIONS SYSTEM ====================

export function subscribeConnectionRequests(studentUid: string, callback: (reqs: ConnectionRequest[]) => void) {
  const q = query(
    collection(db, 'connectionRequests'),
    where('toStudentUid', '==', studentUid),
    where('status', '==', 'pending')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as ConnectionRequest));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'connectionRequests');
    }
  );
}

export function subscribeMySentRequests(studentUid: string, callback: (reqs: ConnectionRequest[]) => void) {
  const q = query(
    collection(db, 'connectionRequests'),
    where('fromStudentUid', '==', studentUid)
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as ConnectionRequest));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'connectionRequests');
    }
  );
}

export function subscribeStudentConnections(studentUid: string, callback: (conns: Connection[]) => void) {
  const q1 = query(
    collection(db, 'connections'),
    where('user1Uid', '==', studentUid),
    where('status', '==', 'active')
  );
  const q2 = query(
    collection(db, 'connections'),
    where('user2Uid', '==', studentUid),
    where('status', '==', 'active')
  );

  let list1: Connection[] = [];
  let list2: Connection[] = [];

  const unsub1 = onSnapshot(
    q1,
    (snap) => {
      list1 = snap.docs.map((d) => d.data() as Connection);
      callback([...list1, ...list2]);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'connections');
    }
  );
  const unsub2 = onSnapshot(
    q2,
    (snap) => {
      list2 = snap.docs.map((d) => d.data() as Connection);
      callback([...list1, ...list2]);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'connections');
    }
  );

  return () => {
    unsub1();
    unsub2();
  };
}

export async function sendConnectionRequest(
  sender: UserProfile,
  targetStudent: { uid: string; studentId: string; name: string; photoURL?: string }
): Promise<{ success: boolean; message: string }> {
  if (sender.uid === targetStudent.uid) {
    return { success: false, message: 'You cannot connect with your own ID.' };
  }

  // Check if connection already exists
  const connId1 = `${sender.uid}_${targetStudent.uid}`;
  const connId2 = `${targetStudent.uid}_${sender.uid}`;
  const c1 = await getDoc(doc(db, 'connections', connId1));
  const c2 = await getDoc(doc(db, 'connections', connId2));

  if (c1.exists() || c2.exists()) {
    return { success: false, message: 'You are already connected with this student.' };
  }

  const reqId = `${sender.uid}_${targetStudent.uid}`;
  const reqRef = doc(db, 'connectionRequests', reqId);
  const existingReq = await getDoc(reqRef);

  if (existingReq.exists() && existingReq.data()?.status === 'pending') {
    return { success: false, message: 'Connection request is already pending.' };
  }

  const newReq: ConnectionRequest = {
    id: reqId,
    fromStudentUid: sender.uid,
    fromStudentId: sender.studentId || 'UNKNOWN',
    fromStudentName: sender.name || '',
    fromStudentPhoto: sender.photoURL || '',
    toStudentUid: targetStudent.uid,
    toStudentId: targetStudent.studentId || '',
    toStudentName: targetStudent.name || '',
    toStudentPhoto: targetStudent.photoURL || '',
    status: 'pending',
    createdAt: Date.now(),
  };

  await setDoc(reqRef, newReq);

  // Send notification to recipient
  await createNotification({
    targetUid: targetStudent.uid,
    title: 'New Connection Request',
    message: `${sender.name || 'A student'} (Student ID: ${sender.studentId || 'UNKNOWN'}) wants to connect with you.`,
    type: 'connection_request',
    linkUrl: '/connections',
  });

  return { success: true, message: `Connection request sent to ${targetStudent.name}!` };
}

export async function respondToConnectionRequest(
  request: ConnectionRequest,
  accept: boolean
): Promise<{ success: boolean; conversationId?: string }> {
  const reqRef = doc(db, 'connectionRequests', request.id);

  if (!accept) {
    await updateDoc(reqRef, {
      status: 'rejected',
      updatedAt: Date.now(),
    });
    return { success: true };
  }

  // Accept and establish bilateral connection
  const connId = `${request.fromStudentUid}_${request.toStudentUid}`;
  const connRef = doc(db, 'connections', connId);

  const connection: Connection = {
    id: connId,
    user1Uid: request.fromStudentUid,
    user2Uid: request.toStudentUid,
    user1Id: request.fromStudentId || 'UNKNOWN',
    user2Id: request.toStudentId || 'UNKNOWN',
    user1Name: request.fromStudentName || '',
    user2Name: request.toStudentName || '',
    user1Photo: request.fromStudentPhoto || '',
    user2Photo: request.toStudentPhoto || '',
    createdAt: Date.now(),
    status: 'active',
  };

  await setDoc(connRef, connection);
  await updateDoc(reqRef, {
    status: 'accepted',
    updatedAt: Date.now(),
  });

  // Create or retrieve 1-to-1 conversation
  const convId = getConversationId(request.fromStudentUid, request.toStudentUid);
  const convRef = doc(db, 'conversations', convId);
  const existingConv = await getDoc(convRef);

  if (!existingConv.exists()) {
    const newConv: Conversation = {
      id: convId,
      type: 'direct_student',
      participants: [request.fromStudentUid, request.toStudentUid],
      participantProfiles: {
        [request.fromStudentUid]: {
          name: request.fromStudentName || '',
          role: 'student',
          photoURL: request.fromStudentPhoto || '',
          displayId: request.fromStudentId || '',
        },
        [request.toStudentUid]: {
          name: request.toStudentName || '',
          role: 'student',
          photoURL: request.toStudentPhoto || '',
          displayId: request.toStudentId || '',
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await setDoc(convRef, newConv);
  }

  // Notify sender that request was accepted
  await createNotification({
    targetUid: request.fromStudentUid,
    title: 'Connection Accepted',
    message: `${request.toStudentName} accepted your connection request. You can now chat!`,
    type: 'connection_accepted',
    linkUrl: `/messages?conv=${convId}`,
  });

  return { success: true, conversationId: convId };
}

// Remove connection or block
export async function removeOrBlockConnection(connId: string, action: 'remove' | 'block', currentUid: string): Promise<void> {
  const connRef = doc(db, 'connections', connId);
  if (action === 'remove') {
    await deleteDoc(connRef);
  } else {
    await updateDoc(connRef, {
      status: 'blocked',
      blockedBy: currentUid,
    });
  }
}

// ==================== MESSAGING SYSTEM ====================

export function getConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_direct_');
}

export function subscribeUserConversations(userUid: string, callback: (convs: Conversation[]) => void) {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userUid),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as Conversation));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'conversations');
    }
  );
}

export function subscribeMessages(conversationId: string, callback: (messages: ChatMessage[]) => void) {
  const q = query(
    collection(db, `conversations/${conversationId}/messages`),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as ChatMessage));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `conversations/${conversationId}/messages`);
    }
  );
}

export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  const snap = await getDoc(doc(db, 'conversations', conversationId));
  if (snap.exists()) {
    return snap.data() as Conversation;
  }
  return null;
}

export async function sendMessage(
  conversationId: string,
  sender: UserProfile,
  text: string,
  attachment?: {
    url: string;
    type: 'image' | 'video' | 'file' | 'pdf';
    name: string;
    size?: number;
  }
): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText && !attachment) return;

  const msgRef = doc(collection(db, `conversations/${conversationId}/messages`));
  const msg: ChatMessage = {
    id: msgRef.id,
    conversationId,
    senderUid: sender.uid,
    senderName: sender.name || '',
    senderRole: sender.role,
    senderPhotoURL: sender.photoURL || '',
    text: cleanText,
    timestamp: Date.now(),
    readBy: [sender.uid],
  };

  if (attachment) {
    msg.attachmentUrl = attachment.url;
    msg.attachmentType = attachment.type;
    msg.attachmentName = attachment.name;
    if (attachment.size) msg.attachmentSize = attachment.size;
  }

  await setDoc(msgRef, msg);

  // Preview text for conversation list
  const previewText = cleanText || (attachment ? `📎 [${attachment.type.toUpperCase()}] ${attachment.name}` : 'Sent a message');

  // Update conversation metadata
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: {
      text: previewText,
      senderUid: sender.uid,
      timestamp: Date.now(),
    },
    updatedAt: Date.now(),
  });
}

// Teacher initiate direct chat with a student
export async function getOrCreateTeacherStudentConversation(
  teacher: Partial<UserProfile> & { uid: string; name?: string; teacherId?: string },
  student: { uid: string; name?: string; photoURL?: string; studentId?: string }
): Promise<string> {
  const teacherUid = teacher?.uid ? String(teacher.uid).trim() : '';
  const studentUid = student?.uid ? String(student.uid).trim() : '';

  if (!teacherUid || !studentUid || teacherUid === 'undefined' || studentUid === 'undefined') {
    console.error('getOrCreateTeacherStudentConversation invalid arguments:', { teacher, student });
    throw new Error(`Cannot start conversation: invalid teacher (${teacherUid}) or student (${studentUid}) ID.`);
  }

  const convId = `tch_${teacherUid}_std_${studentUid}`;
  const convRef = doc(db, 'conversations', convId);
  const snap = await getDoc(convRef);

  if (!snap.exists()) {
    const conv: Conversation = {
      id: convId,
      type: 'teacher_student',
      participants: [teacherUid, studentUid],
      participantProfiles: {
        [teacherUid]: {
          name: (teacher.name || 'Teacher').trim(),
          role: 'teacher',
          photoURL: teacher.photoURL || '',
          displayId: teacher.teacherId || 'TEACHER',
        },
        [studentUid]: {
          name: (student.name || 'Student').trim(),
          role: 'student',
          photoURL: student.photoURL || '',
          displayId: student.studentId || 'UNKNOWN',
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await setDoc(convRef, conv);
  }

  return convId;
}

// Class group conversation
export async function getOrCreateClassGroupConversation(
  classRoom: ClassRoom,
  teacher: UserProfile
): Promise<string> {
  if (!classRoom?.id || !teacher?.uid) {
    throw new Error('Cannot start class conversation: classRoom or teacher missing.');
  }
  const convId = `class_group_${classRoom.id}`;
  const convRef = doc(db, 'conversations', convId);
  const snap = await getDoc(convRef);

  if (!snap.exists()) {
    // Get all class members
    const memSnap = await getDocs(query(collection(db, 'classMembers'), where('classId', '==', classRoom.id), where('status', '==', 'active')));
    const studentUids = memSnap.docs.map(d => (d.data().studentUid || '')).filter(Boolean);
    const participants = Array.from(new Set([teacher.uid, ...studentUids]));
    const participantProfiles: Record<string, any> = {
      [teacher.uid]: {
        name: teacher.name || 'Teacher',
        role: 'teacher',
        photoURL: teacher.photoURL || '',
        displayId: teacher.teacherId || 'TEACHER',
      },
    };
    memSnap.docs.forEach(d => {
      const m = d.data() as ClassMember;
      if (m.studentUid) {
        participantProfiles[m.studentUid] = {
          name: m.studentName || 'Student',
          role: 'student',
          photoURL: m.studentPhotoURL || '',
          displayId: m.studentId || '',
        };
      }
    });

    const conv: Conversation = {
      id: convId,
      type: 'class_group',
      classId: classRoom.id,
      className: classRoom.name || '',
      participants,
      participantProfiles,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await setDoc(convRef, conv);
  }

  return convId;
}

// ==================== AI CONVERSATION & REPORTS ====================

export function subscribeStudentAIConversation(
  studentUid: string,
  sessionId: string,
  callback: (aiConv: AIConversation | null) => void
) {
  const aiId = `${studentUid}_${sessionId}`;
  return onSnapshot(
    doc(db, 'aiConversations', aiId),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as AIConversation);
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'aiConversations');
    }
  );
}

export function subscribeTeacherAIReports(teacherUid: string, callback: (reports: AIReport[]) => void) {
  const q = query(
    collection(db, 'aiReports'),
    where('teacherUid', '==', teacherUid),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as AIReport));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'aiReports');
    }
  );
}

export async function sendStudentAIMessage(
  session: ClassSession,
  student: UserProfile,
  studentMessageText: string
): Promise<{ reply: string; extractedInfo?: any }> {
  const aiId = `${student.uid}_${session.id}`;
  const aiRef = doc(db, 'aiConversations', aiId);
  const snap = await getDoc(aiRef);

  let currentMessages: { role: 'assistant' | 'user'; text: string; timestamp: number }[] = [];

  if (snap.exists()) {
    currentMessages = snap.data().messages || [];
  } else {
    // Initial opening from AI
    currentMessages.push({
      role: 'assistant',
      text: `Hello ${student.name}, your class "${session.className}" has started and we haven't received your attendance yet. Are you joining us today?`,
      timestamp: Date.now() - 1000,
    });
  }

  // Add user message
  const userMsg = {
    role: 'user' as const,
    text: studentMessageText.trim(),
    timestamp: Date.now(),
  };
  currentMessages.push(userMsg);

  // Call Server-Side Gemini AI Endpoint
  const response = await fetch('/api/ai/attendance-reason', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentName: student.name,
      className: session.className,
      sessionDate: session.date,
      sessionTime: `${session.startTime} - ${session.endTime}`,
      messages: currentMessages,
      studentMessage: studentMessageText.trim(),
    }),
  });

  const data = await response.json();
  const aiReplyText = data.replyMessage || data.fallbackReply || "Thank you for the update. I've recorded this for your teacher.";
  const extracted = data.extractedInfo;

  currentMessages.push({
    role: 'assistant',
    text: aiReplyText,
    timestamp: Date.now(),
  });

  // Save AI Conversation
  const aiConv: AIConversation = {
    id: aiId,
    studentUid: student.uid,
    studentId: student.studentId || 'UNKNOWN',
    studentName: student.name,
    sessionId: session.id,
    classId: session.classId,
    className: session.className,
    teacherUid: session.teacherUid,
    messages: currentMessages,
    status: 'resolved',
    extractedInfo: extracted,
    createdAt: snap.exists() ? snap.data().createdAt : Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(aiRef, aiConv);

  // Save Structured AI Report for Teacher's Dashboard
  if (extracted) {
    const reportRef = doc(db, 'aiReports', aiId);
    const report: AIReport = {
      id: aiId,
      sessionId: session.id,
      classId: session.classId,
      className: session.className,
      teacherUid: session.teacherUid,
      studentUid: student.uid,
      studentId: student.studentId || 'UNKNOWN',
      studentName: student.name,
      status: (extracted.status as any) || 'LATE',
      reason: extracted.reason || 'Late notice submitted',
      eta: extracted.eta || 'N/A',
      aiSummary: extracted.summary || 'Student provided attendance reason via AI chat.',
      conversationSnippet: studentMessageText.trim(),
      timestamp: Date.now(),
      isAcknowledgedByTeacher: false,
    };
    await setDoc(reportRef, report);

    // Update Student Attendance Record if appropriate
    const attId = `${session.id}_${student.uid}`;
    const attRef = doc(db, 'attendance', attId);
    await setDoc(attRef, {
      id: attId,
      sessionId: session.id,
      classId: session.classId,
      className: session.className,
      studentUid: student.uid,
      studentId: student.studentId || 'UNKNOWN',
      studentName: student.name || '',
      studentPhotoURL: student.photoURL || '',
      status: extracted.status === 'ABSENT' ? 'ABSENT' : 'LATE',
      reason: extracted.reason || '',
      eta: extracted.eta || '',
      verifiedBy: 'ai_assistant',
      verifiedAt: Date.now(),
      notes: extracted.summary || '',
    }, { merge: true });

    // Notify Teacher
    await createNotification({
      targetUid: session.teacherUid,
      title: `AI Attendance Update: ${student.name}`,
      message: `${student.name} (${extracted.status}): ${extracted.reason} (ETA: ${extracted.eta || 'N/A'})`,
      type: 'ai_attendance_message',
      linkUrl: `/attendance?session=${session.id}`,
    });
  }

  return { reply: aiReplyText, extractedInfo: extracted };
}

// ==================== NOTIFICATIONS ====================

export async function createNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<void> {
  const notifRef = doc(collection(db, 'notifications'));
  const newNotif: AppNotification = {
    ...notif,
    id: notifRef.id,
    read: false,
    createdAt: Date.now(),
  };
  await setDoc(notifRef, newNotif);
}

export function subscribeUserNotifications(userUid: string, callback: (notifs: AppNotification[]) => void) {
  const q = query(
    collection(db, 'notifications'),
    where('targetUid', '==', userUid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as AppNotification));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    }
  );
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', notifId), { read: true });
}

// ==================== PROFILE & SETTINGS & ACCOUNT MANAGEMENT ====================

export async function updateUserProfile(
  uid: string,
  updates: { name?: string; photoURL?: string; phone?: string; dateOfBirth?: string }
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const cleanUpdates: Record<string, any> = {
    updatedAt: Date.now(),
  };

  if (updates.name !== undefined) {
    cleanUpdates.name = updates.name.trim();
  }
  if (updates.photoURL !== undefined) {
    cleanUpdates.photoURL = updates.photoURL.trim();
  }
  if (updates.phone !== undefined) {
    cleanUpdates.phone = updates.phone.trim();
  }
  if (updates.dateOfBirth !== undefined) {
    cleanUpdates.dateOfBirth = updates.dateOfBirth;
  }

  await updateDoc(userRef, cleanUpdates);

  // Sync to role collection & fetch fresh role info
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    const newName = cleanUpdates.name ?? data.name ?? '';
    const newPhoto = cleanUpdates.photoURL ?? data.photoURL ?? '';

    if (data.role === 'student') {
      await updateDoc(doc(db, 'students', uid), {
        name: newName,
        photoURL: newPhoto,
        updatedAt: Date.now(),
      }).catch(() => {});

      // 1. Cascade to all group memberships
      try {
        const groupMembersSnap = await getDocs(
          query(collection(db, 'groupMembers'), where('studentUid', '==', uid))
        );
        const batch = writeBatch(db);
        groupMembersSnap.docs.forEach((d) => {
          batch.update(d.ref, {
            studentName: newName,
            studentPhotoURL: newPhoto,
            updatedAt: Date.now(),
          });
        });
        if (!groupMembersSnap.empty) {
          await batch.commit();
        }
      } catch (err) {
        console.warn('Error syncing group members DP:', err);
      }

      // 2. Cascade to all class memberships
      try {
        const classMembersSnap = await getDocs(
          query(collection(db, 'classMembers'), where('studentUid', '==', uid))
        );
        const batch = writeBatch(db);
        classMembersSnap.docs.forEach((d) => {
          batch.update(d.ref, {
            studentName: newName,
            studentPhotoURL: newPhoto,
            updatedAt: Date.now(),
          });
        });
        if (!classMembersSnap.empty) {
          await batch.commit();
        }
      } catch (err) {
        console.warn('Error syncing class members DP:', err);
      }

      // 3. Cascade to all course memberships
      try {
        const courseMembersSnap = await getDocs(
          query(collection(db, 'courseMembers'), where('studentUid', '==', uid))
        );
        const batch = writeBatch(db);
        courseMembersSnap.docs.forEach((d) => {
          batch.update(d.ref, {
            studentName: newName,
            studentPhotoURL: newPhoto,
          });
        });
        if (!courseMembersSnap.empty) {
          await batch.commit();
        }
      } catch (err) {
        console.warn('Error syncing course members DP:', err);
      }

      // 4. Cascade to student-to-student connections
      try {
        const [conn1Snap, conn2Snap] = await Promise.all([
          getDocs(query(collection(db, 'connections'), where('user1Uid', '==', uid))),
          getDocs(query(collection(db, 'connections'), where('user2Uid', '==', uid))),
        ]);
        const batch = writeBatch(db);
        conn1Snap.docs.forEach((d) => {
          batch.update(d.ref, { user1Name: newName, user1Photo: newPhoto });
        });
        conn2Snap.docs.forEach((d) => {
          batch.update(d.ref, { user2Name: newName, user2Photo: newPhoto });
        });
        if (!conn1Snap.empty || !conn2Snap.empty) {
          await batch.commit();
        }
      } catch (err) {
        console.warn('Error syncing connections DP:', err);
      }

      // 5. Cascade to pending connection requests
      try {
        const [reqSentSnap, reqRecvSnap] = await Promise.all([
          getDocs(query(collection(db, 'connectionRequests'), where('fromStudentUid', '==', uid))),
          getDocs(query(collection(db, 'connectionRequests'), where('toStudentUid', '==', uid))),
        ]);
        const batch = writeBatch(db);
        reqSentSnap.docs.forEach((d) => {
          batch.update(d.ref, { fromStudentName: newName, fromStudentPhoto: newPhoto });
        });
        reqRecvSnap.docs.forEach((d) => {
          batch.update(d.ref, { toStudentName: newName, toStudentPhoto: newPhoto });
        });
        if (!reqSentSnap.empty || !reqRecvSnap.empty) {
          await batch.commit();
        }
      } catch (err) {
        console.warn('Error syncing connection requests DP:', err);
      }
    } else if (data.role === 'teacher') {
      await updateDoc(doc(db, 'teachers', uid), {
        name: newName,
        photoURL: newPhoto,
        updatedAt: Date.now(),
      }).catch(() => {});

      // Cascade to teacher's classes, groups, and courses
      try {
        const [groupsSnap, classesSnap, coursesSnap] = await Promise.all([
          getDocs(query(collection(db, 'groups'), where('teacherUid', '==', uid))),
          getDocs(query(collection(db, 'classes'), where('teacherUid', '==', uid))),
          getDocs(query(collection(db, 'courses'), where('teacherUid', '==', uid))),
        ]);

        const batch = writeBatch(db);
        groupsSnap.docs.forEach((d) => {
          batch.update(d.ref, { teacherName: newName, teacherPhotoURL: newPhoto });
        });
        classesSnap.docs.forEach((d) => {
          batch.update(d.ref, { teacherName: newName, teacherPhotoURL: newPhoto });
        });
        coursesSnap.docs.forEach((d) => {
          batch.update(d.ref, { teacherName: newName, teacherPhotoURL: newPhoto });
        });
        await batch.commit();
      } catch (err) {
        console.warn('Error syncing teacher entities DP:', err);
      }
    }

    // Cascade to active Conversations participantProfiles
    try {
      const convsSnap = await getDocs(
        query(collection(db, 'conversations'), where('participants', 'array-contains', uid))
      );
      if (!convsSnap.empty) {
        const batch = writeBatch(db);
        convsSnap.docs.forEach((d) => {
          const convData = d.data() as Conversation;
          const participantProfiles = { ...(convData.participantProfiles || {}) };
          if (participantProfiles[uid]) {
            participantProfiles[uid] = {
              ...participantProfiles[uid],
              name: newName,
              photoURL: newPhoto,
            };
            batch.update(d.ref, {
              participantProfiles,
              updatedAt: Date.now(),
            });
          }
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('Error syncing conversation DP:', err);
    }
  }
}

export async function updateUserSettings(uid: string, settings: Partial<any>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    settings,
    updatedAt: Date.now(),
  });
}

export async function deleteUserAccountData(uid: string): Promise<void> {
  // 1. Delete student / teacher role doc
  await deleteDoc(doc(db, 'students', uid)).catch(() => {});
  await deleteDoc(doc(db, 'teachers', uid)).catch(() => {});

  // 2. TEACHER DATA PURGE: Classes created by this user
  try {
    const teacherClassesSnap = await getDocs(
      query(collection(db, 'classes'), where('teacherUid', '==', uid))
    );
    for (const cDoc of teacherClassesSnap.docs) {
      const cId = cDoc.id;
      // Delete all classMembers
      const memSnap = await getDocs(query(collection(db, 'classMembers'), where('classId', '==', cId)));
      for (const m of memSnap.docs) await deleteDoc(m.ref).catch(() => {});

      // Delete all joinRequests
      const reqSnap = await getDocs(query(collection(db, 'joinRequests'), where('classId', '==', cId)));
      for (const r of reqSnap.docs) await deleteDoc(r.ref).catch(() => {});

      // Delete all sessions
      const sessSnap = await getDocs(query(collection(db, 'sessions'), where('classId', '==', cId)));
      for (const s of sessSnap.docs) await deleteDoc(s.ref).catch(() => {});

      // Delete all attendance records
      const attSnap = await getDocs(query(collection(db, 'attendance'), where('classId', '==', cId)));
      for (const a of attSnap.docs) await deleteDoc(a.ref).catch(() => {});

      // Delete class doc
      await deleteDoc(cDoc.ref).catch(() => {});
    }
  } catch (e) {
    console.warn('Error purging teacher classes on account delete:', e);
  }

  // 3. TEACHER DATA PURGE: Courses created by this user
  try {
    const teacherCoursesSnap = await getDocs(
      query(collection(db, 'courses'), where('teacherUid', '==', uid))
    );
    for (const courseDoc of teacherCoursesSnap.docs) {
      const courseDocId = courseDoc.id;
      // Delete subcollection materials
      const matSnap = await getDocs(collection(db, `courses/${courseDocId}/materials`));
      for (const m of matSnap.docs) await deleteDoc(m.ref).catch(() => {});

      // Delete subcollection students
      const stuSnap = await getDocs(collection(db, `courses/${courseDocId}/students`));
      for (const s of stuSnap.docs) await deleteDoc(s.ref).catch(() => {});

      // Delete subcollection joinRequests
      const jrSnap = await getDocs(collection(db, `courses/${courseDocId}/joinRequests`));
      for (const jr of jrSnap.docs) await deleteDoc(jr.ref).catch(() => {});

      // Delete global courseMembers
      const cmSnap = await getDocs(query(collection(db, 'courseMembers'), where('courseId', '==', courseDocId)));
      for (const cm of cmSnap.docs) await deleteDoc(cm.ref).catch(() => {});

      // Delete global courseJoinRequests
      const cjrSnap = await getDocs(query(collection(db, 'courseJoinRequests'), where('courseDocId', '==', courseDocId)));
      for (const cjr of cjrSnap.docs) await deleteDoc(cjr.ref).catch(() => {});

      // Delete course doc
      await deleteDoc(courseDoc.ref).catch(() => {});
    }
  } catch (e) {
    console.warn('Error purging teacher courses on account delete:', e);
  }

  // 4. TEACHER DATA PURGE: Sessions & AI Reports
  try {
    const sessSnap = await getDocs(query(collection(db, 'sessions'), where('teacherUid', '==', uid)));
    for (const s of sessSnap.docs) await deleteDoc(s.ref).catch(() => {});

    const reportsSnap = await getDocs(query(collection(db, 'aiReports'), where('teacherUid', '==', uid)));
    for (const rep of reportsSnap.docs) await deleteDoc(rep.ref).catch(() => {});

    const userReportsSnap = await getDocs(query(collection(db, 'aiReports'), where('userId', '==', uid)));
    for (const rep of userReportsSnap.docs) await deleteDoc(rep.ref).catch(() => {});
  } catch (e) {
    console.warn('Error purging sessions/reports on account delete:', e);
  }

  // 5. STUDENT DATA PURGE: Class memberships & decrement class student counts
  try {
    const memSnap = await getDocs(
      query(collection(db, 'classMembers'), where('studentUid', '==', uid))
    );
    for (const d of memSnap.docs) {
      const data = d.data();
      await deleteDoc(d.ref).catch(() => {});
      if (data.classId) {
        await updateDoc(doc(db, 'classes', data.classId), {
          studentCount: increment(-1),
        }).catch(() => {});
      }
    }
  } catch (e) {
    console.warn('Error clearing class memberships on account delete:', e);
  }

  // 6. STUDENT DATA PURGE: Course memberships & decrement course student counts
  try {
    const courseMemSnap = await getDocs(
      query(collection(db, 'courseMembers'), where('studentUid', '==', uid))
    );
    for (const d of courseMemSnap.docs) {
      const data = d.data();
      await deleteDoc(d.ref).catch(() => {});
      if (data.courseId) {
        await updateDoc(doc(db, 'courses', data.courseId), {
          studentCount: increment(-1),
        }).catch(() => {});
        await deleteDoc(doc(db, `courses/${data.courseId}/students`, uid)).catch(() => {});
      }
    }
  } catch (e) {
    console.warn('Error clearing course memberships on account delete:', e);
  }

  // 7. STUDENT DATA PURGE: Join requests & Attendance records
  try {
    const reqSnap = await getDocs(
      query(collection(db, 'joinRequests'), where('studentUid', '==', uid))
    );
    for (const d of reqSnap.docs) await deleteDoc(d.ref).catch(() => {});

    const cReqSnap = await getDocs(
      query(collection(db, 'courseJoinRequests'), where('studentUid', '==', uid))
    );
    for (const d of cReqSnap.docs) {
      const cData = d.data();
      await deleteDoc(d.ref).catch(() => {});
      if (cData.courseDocId) {
        await deleteDoc(doc(db, `courses/${cData.courseDocId}/joinRequests`, uid)).catch(() => {});
      }
    }

    const attSnap = await getDocs(
      query(collection(db, 'attendance'), where('studentUid', '==', uid))
    );
    for (const d of attSnap.docs) await deleteDoc(d.ref).catch(() => {});
  } catch (e) {
    console.warn('Error clearing join requests and attendance on account delete:', e);
  }

  // 8. COMMON PURGE: Connections & Connection Requests
  try {
    const con1 = await getDocs(query(collection(db, 'connections'), where('user1Id', '==', uid)));
    for (const d of con1.docs) await deleteDoc(d.ref).catch(() => {});

    const con2 = await getDocs(query(collection(db, 'connections'), where('user2Id', '==', uid)));
    for (const d of con2.docs) await deleteDoc(d.ref).catch(() => {});

    const cr1 = await getDocs(query(collection(db, 'connectionRequests'), where('fromUid', '==', uid)));
    for (const d of cr1.docs) await deleteDoc(d.ref).catch(() => {});

    const cr2 = await getDocs(query(collection(db, 'connectionRequests'), where('toUid', '==', uid)));
    for (const d of cr2.docs) await deleteDoc(d.ref).catch(() => {});
  } catch (e) {
    console.warn('Error clearing connections on account delete:', e);
  }

  // 9. COMMON PURGE: Conversations & Messages
  try {
    const convSnap = await getDocs(query(collection(db, 'conversations'), where('participants', 'array-contains', uid)));
    for (const c of convSnap.docs) {
      const msgSnap = await getDocs(collection(db, `conversations/${c.id}/messages`));
      for (const m of msgSnap.docs) await deleteDoc(m.ref).catch(() => {});
      await deleteDoc(c.ref).catch(() => {});
    }

    const msg1 = await getDocs(query(collection(db, 'messages'), where('senderId', '==', uid)));
    for (const d of msg1.docs) await deleteDoc(d.ref).catch(() => {});

    const msg2 = await getDocs(query(collection(db, 'messages'), where('recipientId', '==', uid)));
    for (const d of msg2.docs) await deleteDoc(d.ref).catch(() => {});
  } catch (e) {
    console.warn('Error clearing conversations on account delete:', e);
  }

  // 10. COMMON PURGE: AI Conversations
  try {
    const ai1 = await getDocs(query(collection(db, 'aiConversations'), where('userId', '==', uid)));
    for (const d of ai1.docs) await deleteDoc(d.ref).catch(() => {});

    const ai2 = await getDocs(query(collection(db, 'aiConversations'), where('studentUid', '==', uid)));
    for (const d of ai2.docs) await deleteDoc(d.ref).catch(() => {});

    await deleteDoc(doc(db, 'aiConversations', uid)).catch(() => {});
  } catch (e) {
    console.warn('Error clearing AI conversations on account delete:', e);
  }

  // 11. COMMON PURGE: Notifications
  try {
    const notif1 = await getDocs(query(collection(db, 'notifications'), where('targetUid', '==', uid)));
    for (const d of notif1.docs) await deleteDoc(d.ref).catch(() => {});

    const notif2 = await getDocs(query(collection(db, 'notifications'), where('senderUid', '==', uid)));
    for (const d of notif2.docs) await deleteDoc(d.ref).catch(() => {});
  } catch (e) {
    console.warn('Error clearing notifications on account delete:', e);
  }

  // 12. Delete primary user document
  await deleteDoc(doc(db, 'users', uid)).catch(() => {});

  // 13. Client Storage Purge
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }
  } catch (e) {
    console.warn('Local storage clear warning:', e);
  }
}

// ==================== BATCH / CLASS LEAVE, REMOVE & DELETE ====================

// Student leaves a class/batch
export async function leaveClass(
  classId: string,
  studentUid: string,
  studentName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const memberId = `${classId}_${studentUid}`;
    const memberRef = doc(db, 'classMembers', memberId);
    await deleteDoc(memberRef).catch(() => {});

    // Decrement student count on class
    await updateDoc(doc(db, 'classes', classId), {
      studentCount: increment(-1),
    }).catch(() => {});

    // Notify teacher
    const classSnap = await getDoc(doc(db, 'classes', classId));
    if (classSnap.exists()) {
      const cls = classSnap.data() as ClassRoom;
      await createNotification({
        targetUid: cls.teacherUid,
        title: 'Student Left Class',
        message: `${studentName || 'A student'} has left the class "${cls.name}".`,
        type: 'student_joined',
        linkUrl: `/classes/${classId}`,
      });
    }

    return { success: true, message: 'You have successfully left the class.' };
  } catch (err: any) {
    console.error('Error leaving class:', err);
    return { success: false, message: err.message || 'Failed to leave class.' };
  }
}

// Teacher removes/kicks a student from class/batch
export async function removeStudentFromClass(
  classId: string,
  studentUid: string,
  studentName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const memberId = `${classId}_${studentUid}`;
    const memberRef = doc(db, 'classMembers', memberId);
    await deleteDoc(memberRef).catch(() => {});

    // Decrement student count on class
    await updateDoc(doc(db, 'classes', classId), {
      studentCount: increment(-1),
    }).catch(() => {});

    // Notify student
    const classSnap = await getDoc(doc(db, 'classes', classId));
    if (classSnap.exists()) {
      const cls = classSnap.data() as ClassRoom;
      await createNotification({
        targetUid: studentUid,
        title: 'Removed from Class',
        message: `You were removed from the class "${cls.name}" by the teacher.`,
        type: 'class_invitation',
      });
    }

    return { success: true, message: `${studentName || 'Student'} has been removed from the class.` };
  } catch (err: any) {
    console.error('Error removing student from class:', err);
    return { success: false, message: err.message || 'Failed to remove student.' };
  }
}

// Teacher deletes their class/batch
export async function deleteClass(classId: string): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Delete class doc
    await deleteDoc(doc(db, 'classes', classId)).catch(async () => {
      await updateDoc(doc(db, 'classes', classId), { isActive: false });
    });

    // 2. Clean up members
    const membersSnap = await getDocs(query(collection(db, 'classMembers'), where('classId', '==', classId)));
    for (const d of membersSnap.docs) await deleteDoc(d.ref).catch(() => {});

    // 3. Clean up join requests
    const reqSnap = await getDocs(query(collection(db, 'joinRequests'), where('classId', '==', classId)));
    for (const d of reqSnap.docs) await deleteDoc(d.ref).catch(() => {});

    // 4. Clean up sessions & attendance for this class
    const sessSnap = await getDocs(query(collection(db, 'sessions'), where('classId', '==', classId)));
    for (const s of sessSnap.docs) await deleteDoc(s.ref).catch(() => {});

    const attSnap = await getDocs(query(collection(db, 'attendance'), where('classId', '==', classId)));
    for (const a of attSnap.docs) await deleteDoc(a.ref).catch(() => {});

    return { success: true, message: 'Class deleted successfully.' };
  } catch (err: any) {
    console.error('Error deleting class:', err);
    return { success: false, message: err.message || 'Failed to delete class.' };
  }
}

// ==================== COURSES & STUDY MATERIAL ====================

// Generate unique Course ID e.g. "CS-482719"
export function generateCourseId(subject?: string): string {
  let prefix = 'CS';
  if (subject) {
    const cleanSub = subject.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (cleanSub.length >= 2) {
      prefix = cleanSub.substring(0, 3);
    }
  }
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${digits}`;
}

// Format bytes to human readable string
export function formatBytes(bytes?: number, decimals: number = 2): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Teacher creates a course
export async function createCourse(
  courseData: {
    name: string;
    subject: string;
    description: string;
    coverImageURL?: string;
    category?: string;
    teacherProfile: UserProfile;
  }
): Promise<Course> {
  const courseDocRef = doc(collection(db, 'courses'));
  const uniqueCode = generateCourseId(courseData.subject);

  const course: Course = {
    id: courseDocRef.id,
    courseId: uniqueCode,
    teacherUid: courseData.teacherProfile.uid,
    teacherId: courseData.teacherProfile.teacherId || 'TCH',
    teacherName: courseData.teacherProfile.name,
    teacherPhotoURL: courseData.teacherProfile.photoURL || '',
    name: courseData.name.trim(),
    subject: courseData.subject.trim(),
    description: courseData.description.trim(),
    coverImageURL: courseData.coverImageURL || '',
    category: courseData.category?.trim() || 'General',
    studentCount: 0,
    materialCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    visibility: 'public',
  };

  await setDoc(courseDocRef, course);
  return course;
}

// Update course details
export async function updateCourse(
  courseId: string,
  updates: Partial<Course>
): Promise<void> {
  const courseRef = doc(db, 'courses', courseId);
  const cleanUpdates: Record<string, any> = {
    updatedAt: Date.now(),
  };

  if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
  if (updates.subject !== undefined) cleanUpdates.subject = updates.subject.trim();
  if (updates.description !== undefined) cleanUpdates.description = updates.description.trim();
  if (updates.coverImageURL !== undefined) cleanUpdates.coverImageURL = updates.coverImageURL;
  if (updates.category !== undefined) cleanUpdates.category = updates.category.trim();

  await updateDoc(courseRef, cleanUpdates);
}

// Delete course and its subcollections
export async function deleteCourse(courseId: string): Promise<void> {
  // 1. Clean subcollection materials
  try {
    const matSnap = await getDocs(collection(db, `courses/${courseId}/materials`));
    for (const m of matSnap.docs) await deleteDoc(m.ref).catch(() => {});
  } catch (e) {}

  // 2. Clean subcollection students
  try {
    const stuSnap = await getDocs(collection(db, `courses/${courseId}/students`));
    for (const s of stuSnap.docs) await deleteDoc(s.ref).catch(() => {});
  } catch (e) {}

  // 3. Clean subcollection joinRequests
  try {
    const jrSnap = await getDocs(collection(db, `courses/${courseId}/joinRequests`));
    for (const jr of jrSnap.docs) await deleteDoc(jr.ref).catch(() => {});
  } catch (e) {}

  // 4. Clean global courseMembers
  const membersSnap = await getDocs(
    query(collection(db, 'courseMembers'), where('courseId', '==', courseId))
  );
  for (const d of membersSnap.docs) await deleteDoc(d.ref).catch(() => {});

  // 5. Clean global courseJoinRequests
  const reqsSnap = await getDocs(
    query(collection(db, 'courseJoinRequests'), where('courseDocId', '==', courseId))
  );
  for (const d of reqsSnap.docs) await deleteDoc(d.ref).catch(() => {});

  // 6. Delete course doc
  await deleteDoc(doc(db, 'courses', courseId)).catch(() => {});
}

// Search course by unique Course ID or Doc ID
export async function searchCourseById(queryStr: string): Promise<Course | null> {
  const clean = queryStr.trim();
  if (!clean) return null;

  // 1. Try search by human-readable courseId e.g. "CS-482719"
  const q = query(collection(db, 'courses'), where('courseId', '==', clean.toUpperCase()));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].data() as Course;
  }

  // 2. Try direct doc ID
  const directDoc = await getDoc(doc(db, 'courses', clean));
  if (directDoc.exists()) {
    return directDoc.data() as Course;
  }

  return null;
}

// Subscribe to Teacher Courses
export function subscribeTeacherCourses(
  teacherUid: string,
  callback: (courses: Course[]) => void
): () => void {
  const q = query(
    collection(db, 'courses'),
    where('teacherUid', '==', teacherUid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as Course));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'courses');
    }
  );
}

// Subscribe to Student Enrolled Courses
export function subscribeStudentCourses(
  studentUid: string,
  callback: (courses: Course[], memberships: CourseMember[]) => void
): () => void {
  const qMembers = query(
    collection(db, 'courseMembers'),
    where('studentUid', '==', studentUid)
  );

  return onSnapshot(
    qMembers,
    async (snap) => {
      const memberships = snap.docs.map((d) => d.data() as CourseMember);
      if (snap.empty) {
        callback([], []);
        return;
      }
      const activeMemberships = memberships.filter((m) => m.status === 'active');
      const courseIds = activeMemberships.map((d) => d.courseId);
      // Fetch each course
      const courses: Course[] = [];
      for (const cId of courseIds) {
        try {
          const cSnap = await getDoc(doc(db, 'courses', cId));
          if (cSnap.exists()) {
            courses.push(cSnap.data() as Course);
          }
        } catch (e) {
          console.warn('Error fetching course doc:', cId, e);
        }
      }
      callback(courses, memberships);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'courseMembers');
    }
  );
}

// Subscribe to Materials for a Course
export function subscribeCourseMaterials(
  courseId: string,
  callback: (materials: CourseMaterial[]) => void
): () => void {
  const q = query(
    collection(db, `courses/${courseId}/materials`),
    orderBy('uploadedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as CourseMaterial));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `courses/${courseId}/materials`);
    }
  );
}

// Upload Course Material with Firebase Storage & fallback
export async function uploadCourseMaterial(
  courseId: string,
  materialData: {
    title: string;
    description?: string;
    type: MaterialType;
    chapter?: string;
    textContent?: string;
    externalLink?: string;
    uploadedBy: string;
    uploadedByName: string;
  },
  file?: File
): Promise<CourseMaterial> {
  const materialDocRef = doc(collection(db, `courses/${courseId}/materials`));
  const materialId = materialDocRef.id;

  let downloadURL = materialData.externalLink || '';
  let storagePath = '';
  let fileSize = 0;
  let fileName = file?.name || '';

  if (file) {
    fileSize = file.size;
    fileName = file.name;
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    storagePath = `courses/${courseId}/materials/${Date.now()}_${cleanFileName}`;

    try {
      if (storage) {
        const storageRef = ref(storage, storagePath);
        const uploadResult = await uploadBytes(storageRef, file);
        downloadURL = await getDownloadURL(uploadResult.ref);
      }
    } catch (storageErr) {
      console.warn('Firebase Storage direct upload notice, using Data URL fallback:', storageErr);
      // Fallback: Read file to base64 Data URL so user can view/preview immediately
      downloadURL = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
  }

  const material: CourseMaterial = {
    id: materialId,
    materialId,
    courseId,
    title: materialData.title.trim(),
    description: materialData.description?.trim() || '',
    type: materialData.type,
    storagePath,
    downloadURL,
    externalLink: materialData.externalLink?.trim() || '',
    textContent: materialData.textContent?.trim() || '',
    uploadedBy: materialData.uploadedBy,
    uploadedByName: materialData.uploadedByName,
    uploadedAt: Date.now(),
    fileSize,
    fileSizeFormatted: formatBytes(fileSize),
    fileName,
    chapter: materialData.chapter?.trim() || 'General',
  };

  await setDoc(materialDocRef, material);

  // Increment materialCount on course
  await updateDoc(doc(db, 'courses', courseId), {
    materialCount: increment(1),
    updatedAt: Date.now(),
  }).catch(() => {});

  return material;
}

// Delete Course Material
export async function deleteCourseMaterial(
  courseId: string,
  materialId: string,
  storagePath?: string
): Promise<void> {
  // 1. Delete from Firestore
  await deleteDoc(doc(db, `courses/${courseId}/materials`, materialId));

  // 2. Delete from Storage if exists
  if (storage && storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Could not delete storage file:', err);
    }
  }

  // 3. Decrement materialCount
  await updateDoc(doc(db, 'courses', courseId), {
    materialCount: increment(-1),
    updatedAt: Date.now(),
  }).catch(() => {});
}

// Student Request to Join Course
export async function requestJoinCourse(
  course: Course,
  student: UserProfile
): Promise<{ success: boolean; message: string; isPending?: boolean }> {
  // 1. Check if already active in courseMembers
  const memberId = `${course.id}_${student.uid}`;
  const memberRef = doc(db, 'courseMembers', memberId);
  const memberSnap = await getDoc(memberRef);

  if (memberSnap.exists() && memberSnap.data()?.status === 'active') {
    return { success: false, message: 'You are already enrolled in this course.' };
  }

  // 2. Check if already requested
  const reqId = `${course.id}_${student.uid}`;
  const reqRef = doc(db, 'courseJoinRequests', reqId);
  const reqSnap = await getDoc(reqRef);

  if (reqSnap.exists() && reqSnap.data()?.status === 'pending') {
    return { success: false, message: 'You have already sent a join request for this course. Please wait for teacher approval.' };
  }

  const joinRequest: CourseJoinRequest = {
    id: reqId,
    courseId: course.courseId,
    courseDocId: course.id,
    courseName: course.name,
    courseSubject: course.subject,
    teacherUid: course.teacherUid,
    teacherName: course.teacherName,
    studentUid: student.uid,
    studentId: student.studentId || 'UNKNOWN',
    studentName: student.name,
    studentEmail: student.email || '',
    studentPhotoURL: student.photoURL || '',
    requestedAt: Date.now(),
    status: 'pending',
  };

  // Save to global requests collection and course subcollection
  await setDoc(reqRef, joinRequest);
  await setDoc(doc(db, `courses/${course.id}/joinRequests`, student.uid), joinRequest);

  // Notify Teacher
  await createNotification({
    targetUid: course.teacherUid,
    title: 'New Course Join Request',
    message: `${student.name} (ID: ${student.studentId || 'UNKNOWN'}) requested to join course "${course.name}" (${course.courseId}).`,
    type: 'class_invitation',
    linkUrl: `/courses/${course.id}`,
  });

  return {
    success: true,
    message: `Join request sent to ${course.teacherName} for "${course.name}". You will be enrolled upon approval!`,
    isPending: true,
  };
}

// Subscribe to Pending Join Requests for a Course
export function subscribeCourseJoinRequests(
  courseId: string,
  callback: (requests: CourseJoinRequest[]) => void
): () => void {
  const q = query(
    collection(db, 'courseJoinRequests'),
    where('courseDocId', '==', courseId),
    where('status', '==', 'pending'),
    orderBy('requestedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as CourseJoinRequest));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'courseJoinRequests');
    }
  );
}

// Subscribe to Enrolled Students for a Course
export function subscribeCourseStudents(
  courseId: string,
  callback: (students: CourseStudent[]) => void
): () => void {
  const q = query(
    collection(db, 'courseMembers'),
    where('courseId', '==', courseId),
    where('status', '==', 'active')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as CourseStudent));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'courseMembers');
    }
  );
}

// Teacher Accepts Course Join Request
export async function acceptCourseJoinRequest(request: CourseJoinRequest): Promise<void> {
  const memberId = `${request.courseDocId}_${request.studentUid}`;
  const memberRef = doc(db, 'courseMembers', memberId);

  const courseStudent: CourseStudent = {
    id: memberId,
    courseId: request.courseDocId,
    studentUid: request.studentUid,
    studentId: request.studentId,
    studentName: request.studentName,
    studentEmail: request.studentEmail || '',
    studentPhotoURL: request.studentPhotoURL || '',
    joinedAt: Date.now(),
    status: 'active',
  };

  // 1. Add to courseMembers
  await setDoc(memberRef, courseStudent);
  await setDoc(doc(db, `courses/${request.courseDocId}/students`, request.studentUid), courseStudent);

  // 2. Mark request accepted or delete
  await updateDoc(doc(db, 'courseJoinRequests', request.id), { status: 'accepted' }).catch(() => {});
  await deleteDoc(doc(db, `courses/${request.courseDocId}/joinRequests`, request.studentUid)).catch(() => {});

  // 3. Increment studentCount on Course
  await updateDoc(doc(db, 'courses', request.courseDocId), {
    studentCount: increment(1),
    updatedAt: Date.now(),
  }).catch(() => {});

  // 4. Notify Student
  await createNotification({
    targetUid: request.studentUid,
    title: 'Course Enrollment Approved! 🎉',
    message: `You are now enrolled in "${request.courseName}". Access study materials now!`,
    type: 'class_invitation',
    linkUrl: `/courses/${request.courseDocId}`,
  });
}

// Teacher Rejects Course Join Request
export async function rejectCourseJoinRequest(requestId: string, courseDocId: string, studentUid: string): Promise<void> {
  await updateDoc(doc(db, 'courseJoinRequests', requestId), { status: 'rejected' }).catch(() => {});
  await deleteDoc(doc(db, `courses/${courseDocId}/joinRequests`, studentUid)).catch(() => {});
}

// Teacher Removes Student from Course
export async function removeStudentFromCourse(
  courseId: string,
  studentUid: string,
  studentName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const memberId = `${courseId}_${studentUid}`;
    await deleteDoc(doc(db, 'courseMembers', memberId)).catch(() => {});
    await deleteDoc(doc(db, `courses/${courseId}/students`, studentUid)).catch(() => {});

    // Decrement studentCount
    await updateDoc(doc(db, 'courses', courseId), {
      studentCount: increment(-1),
      updatedAt: Date.now(),
    }).catch(() => {});

    // Notify student
    const courseSnap = await getDoc(doc(db, 'courses', courseId));
    if (courseSnap.exists()) {
      const c = courseSnap.data() as Course;
      await createNotification({
        targetUid: studentUid,
        title: 'Removed from Course',
        message: `You were removed from the course "${c.name}" by the instructor.`,
        type: 'class_invitation',
      });
    }

    return { success: true, message: `${studentName || 'Student'} has been removed from the course.` };
  } catch (err: any) {
    console.error('Error removing student from course:', err);
    return { success: false, message: err.message || 'Failed to remove student.' };
  }
}

// Student Leaves Course
export async function leaveCourse(
  courseId: string,
  studentUid: string,
  studentName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const memberId = `${courseId}_${studentUid}`;
    await deleteDoc(doc(db, 'courseMembers', memberId)).catch(() => {});
    await deleteDoc(doc(db, `courses/${courseId}/students`, studentUid)).catch(() => {});

    // Decrement studentCount
    await updateDoc(doc(db, 'courses', courseId), {
      studentCount: increment(-1),
      updatedAt: Date.now(),
    }).catch(() => {});

    return { success: true, message: 'You have left the course.' };
  } catch (err: any) {
    console.error('Error leaving course:', err);
    return { success: false, message: err.message || 'Failed to leave course.' };
  }
}

// ==========================================
// COMPLETE USER ACCOUNT & DATA DELETION
// ==========================================

export async function deleteUserAccountAndData(profile: UserProfile): Promise<{ success: boolean; message?: string }> {
  const uid = profile.uid;
  const isTeacher = profile.role === 'teacher';

  try {
    // 1. If Teacher: Clean up Groups, Courses, AI Reports created by Teacher
    if (isTeacher) {
      // Clean Groups
      const groupsQ = query(collection(db, 'groups'), where('teacherUid', '==', uid));
      const groupSnaps = await getDocs(groupsQ);
      for (const gDoc of groupSnaps.docs) {
        const gid = gDoc.id;
        // Clean members
        const memQ = query(collection(db, 'groupMembers'), where('groupId', '==', gid));
        const memSnaps = await getDocs(memQ);
        for (const mDoc of memSnaps.docs) {
          await deleteDoc(mDoc.ref).catch(() => {});
        }
        await deleteDoc(gDoc.ref).catch(() => {});
      }

      // Clean Courses
      const coursesQ = query(collection(db, 'courses'), where('teacherUid', '==', uid));
      const courseSnaps = await getDocs(coursesQ);
      for (const cDoc of courseSnaps.docs) {
        const cid = cDoc.id;
        const matQ = query(collection(db, 'courseMaterials'), where('courseId', '==', cid));
        const matSnaps = await getDocs(matQ);
        for (const mDoc of matSnaps.docs) {
          await deleteDoc(mDoc.ref).catch(() => {});
        }

        const cmQ = query(collection(db, 'courseMembers'), where('courseId', '==', cid));
        const cmSnaps = await getDocs(cmQ);
        for (const cmDoc of cmSnaps.docs) {
          await deleteDoc(cmDoc.ref).catch(() => {});
        }

        await deleteDoc(cDoc.ref).catch(() => {});
      }

      // Clean AI Student Reports
      const repQ = query(collection(db, 'aiStudentReports'), where('teacherUid', '==', uid));
      const repSnaps = await getDocs(repQ);
      for (const rDoc of repSnaps.docs) {
        await deleteDoc(rDoc.ref).catch(() => {});
      }
    } else {
      // 2. If Student: Clean Group Memberships, Course Enrollments, Requests
      const memQ = query(collection(db, 'groupMembers'), where('studentUid', '==', uid));
      const memSnaps = await getDocs(memQ);
      for (const mDoc of memSnaps.docs) {
        const gid = mDoc.data()?.groupId;
        if (gid) {
          await updateDoc(doc(db, 'groups', gid), {
            memberCount: increment(-1),
            updatedAt: Date.now(),
          }).catch(() => {});
        }
        await deleteDoc(mDoc.ref).catch(() => {});
      }

      const cmQ = query(collection(db, 'courseMembers'), where('studentUid', '==', uid));
      const cmSnaps = await getDocs(cmQ);
      for (const cmDoc of cmSnaps.docs) {
        const cid = cmDoc.data()?.courseId;
        if (cid) {
          await updateDoc(doc(db, 'courses', cid), {
            studentCount: increment(-1),
            updatedAt: Date.now(),
          }).catch(() => {});
        }
        await deleteDoc(cmDoc.ref).catch(() => {});
      }

      const reqQ = query(collection(db, 'courseJoinRequests'), where('studentUid', '==', uid));
      const reqSnaps = await getDocs(reqQ);
      for (const rDoc of reqSnaps.docs) {
        await deleteDoc(rDoc.ref).catch(() => {});
      }
    }

    // 3. Clean user's conversations
    const convQ = query(collection(db, 'conversations'), where('participantUids', 'array-contains', uid));
    const convSnaps = await getDocs(convQ);
    for (const cDoc of convSnaps.docs) {
      await deleteDoc(cDoc.ref).catch(() => {});
    }

    // 4. Clean Notifications
    const notifQ = query(collection(db, 'notifications'), where('targetUid', '==', uid));
    const notifSnaps = await getDocs(notifQ);
    for (const nDoc of notifSnaps.docs) {
      await deleteDoc(nDoc.ref).catch(() => {});
    }

    // 5. Delete User Profile document
    await deleteDoc(doc(db, 'users', uid)).catch(() => {});

    // 6. Delete Firebase Auth User if active
    if (auth.currentUser && auth.currentUser.uid === uid) {
      try {
        await auth.currentUser.delete();
      } catch (authErr: any) {
        console.warn('Firebase Auth user deletion requires recent login:', authErr);
        await auth.signOut();
      }
    }

    return { success: true, message: 'Your account and all associated data have been permanently deleted.' };
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return { success: false, message: error.message || 'Failed to complete full account deletion.' };
  }
}

// ==================== ENGLISH LEARNING MATERIALS (FIRESTORE) ====================

/**
 * Real-time subscription to all teacher-uploaded English learning materials
 */
export function subscribeEnglishMaterials(
  callback: (materials: EnglishMaterial[]) => void
): () => void {
  const q = query(
    collection(db, 'englishMaterials'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snap) => {
      const items: EnglishMaterial[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<EnglishMaterial, 'id'>),
      }));
      callback(items);
    },
    (err) => {
      console.warn('subscribeEnglishMaterials error:', err);
      callback([]);
    }
  );
}

/**
 * Teacher adds a new English learning material (verb, tense, sentence, grammar, vocab)
 */
export async function addEnglishMaterial(
  material: Omit<EnglishMaterial, 'id'>
): Promise<string> {
  const docRef = doc(collection(db, 'englishMaterials'));
  const payload: EnglishMaterial = {
    ...material,
    id: docRef.id,
    isTeacherCustom: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(docRef, payload);
  return docRef.id;
}

/**
 * Teacher updates an existing English learning material
 */
export async function updateEnglishMaterial(
  id: string,
  updates: Partial<EnglishMaterial>
): Promise<void> {
  const docRef = doc(db, 'englishMaterials', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

/**
 * Teacher deletes an English learning material
 */
export async function deleteEnglishMaterial(id: string): Promise<void> {
  const docRef = doc(db, 'englishMaterials', id);
  await deleteDoc(docRef);
}




