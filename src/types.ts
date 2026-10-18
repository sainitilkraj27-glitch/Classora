export type UserRole = 'teacher' | 'student' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  phone?: string;
  role: UserRole;
  createdAt: number;
  updatedAt?: number;
  
  // Teacher-specific fields
  teacherId?: string; // e.g. TCH-0001
  activationCodeUsed?: string;
  
  // Student-specific fields
  studentId?: string; // 8-digit unique ID e.g. 48372915
  dateOfBirth?: string;
}

// ==================== GROUP SYSTEM ====================

export type GroupChatTheme = 'whatsapp' | 'dark' | 'indigo' | 'emerald' | 'sunset' | 'midnight' | 'cyberpunk';

export interface GroupSettings {
  allowStudentChat: boolean;
  allowStudentMedia?: boolean;
  allowMediaSharing?: boolean;
  announcementsOnly?: boolean;
  onlyAdminCanPost?: boolean;
  onlyTeachersCanSend?: boolean;
  mutedStudentUids?: string[]; // student UIDs who are locked/muted by teacher
  theme?: GroupChatTheme;
  customWallpaper?: string;
}

export interface Group {
  id: string; // Document ID
  name: string;
  description: string;
  photoURL?: string;
  teacherUid: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  memberCount?: number;
  announcement?: string;
  announcementUpdatedAt?: number;
  settings?: GroupSettings;
  theme?: GroupChatTheme;
  createdAt: number;
  updatedAt?: number;
  
  // Optional and backwards-compatible fields
  subject?: string;
  joinCode?: string;
  accessType?: 'open' | 'invite_only' | 'code' | 'public' | 'private' | string;
  isActive?: boolean;
  timing?: ClassTimingSettings;
}

export interface GroupMember {
  id: string; // groupId_studentUid or doc ID
  groupId?: string;
  groupName?: string;
  classId?: string; // backwards compatibility
  studentUid: string;
  studentId: string; // 8-digit Student ID
  studentName: string;
  studentEmail?: string;
  studentPhotoURL?: string;
  studentPhone?: string;
  phoneNumber?: string;
  phone?: string;
  role?: 'admin' | 'member';
  joinedAt: number;
  status: 'active' | 'pending' | 'removed';
}

// Backward compatibility alias for existing components
export type ClassRoom = Group;
export type ClassMember = GroupMember;

export interface ClassTimingSettings {
  startTime?: string;
  endTime?: string;
  attendanceOpeningTime?: string;
  attendanceDeadline?: string;
  lateThreshold?: string;
  daysOfWeek?: number[];
  allowStudentChat: boolean;
}

export interface ClassSession {
  id: string;
  classId: string;
  className: string;
  teacherUid: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
  attendanceCode?: string;
  attendanceOpensAt?: string;
  attendanceDeadline?: string;
  lateCutoff?: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  pendingCount: number;
  createdAt: number;
  completedAt?: number;
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'PENDING';

export interface AttendanceRecord {
  id: string;
  sessionId?: string;
  classId?: string;
  className?: string;
  studentUid: string;
  studentId: string;
  studentName: string;
  studentPhotoURL?: string;
  status?: AttendanceStatus;
  submittedAt?: number;
  verifiedAt?: number;
  notes?: string;
  reason?: string;
}

// ==================== AI CALL & REPORT SYSTEM ====================

export interface AICallSession {
  id: string;
  callType: 'ai_attendance_call';
  status: 'ringing' | 'connected' | 'completed' | 'declined' | 'missed';
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
  aiInitialGreeting?: string;
  studentResponseText?: string;
  studentAttendingStatus?: 'Attending today' | 'Not attending today';
  aiSummary?: string;
  aiReportId?: string;
  transcript: Array<{ speaker: 'ai' | 'student'; text: string; time?: string }>;
  createdAt: number;
  updatedAt: number;
}

export interface AIStudentReport {
  id: string;
  studentUid: string;
  studentId: string; // 8-digit ID
  studentName: string;
  studentPhotoURL?: string;
  studentPhone?: string;
  teacherUid: string;
  teacherName?: string;
  groupId?: string;
  groupName?: string;
  sessionId?: string;
  classId?: string;
  className?: string;
  status?: string;
  response?: 'Attending today' | 'Not attending today' | 'Late / Delayed' | 'Unreachable' | string;
  reason?: string;
  exactStudentReply?: string;
  aiSummary?: string;
  callStatus?: 'Completed' | 'Missed' | 'Failed' | 'In-Progress' | string;
  eta?: string;
  conversationSnippet?: string;
  transcript?: Array<{ speaker: 'ai' | 'student'; text: string; time?: string }>;
  timestamp?: number;
  createdAt?: number;
  completedAt?: number;
  isAcknowledgedByTeacher?: boolean;
}

export interface AICallRecord {
  id: string;
  studentId: string;
  studentUid: string;
  studentName: string;
  teacherId: string;
  teacherUid: string;
  initiatedAt: number;
  status: 'initiated' | 'connected' | 'completed' | 'failed';
  result?: string;
  reason?: string;
  summary?: string;
  completedAt?: number;
}

export type AIReport = AIStudentReport;

export interface ConnectionRequest {
  id: string;
  fromStudentUid: string;
  fromStudentId: string;
  fromStudentName: string;
  fromStudentPhoto?: string;
  toStudentUid: string;
  toStudentId: string;
  toStudentName: string;
  toStudentPhoto?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  updatedAt?: number;
}

export interface Connection {
  id: string;
  user1Uid: string;
  user2Uid: string;
  user1Id: string;
  user2Id: string;
  user1Name: string;
  user2Name: string;
  user1Photo?: string;
  user2Photo?: string;
  createdAt: number;
  status: 'active' | 'blocked';
  blockedBy?: string;
}

export interface Conversation {
  id: string;
  type: 'direct_student' | 'teacher_student' | 'class_group';
  classId?: string;
  className?: string;
  participants: string[]; // array of UIDs
  participantProfiles: {
    [uid: string]: {
      name: string;
      role: UserRole;
      photoURL?: string;
      displayId: string;
    };
  };
  lastMessage?: {
    text: string;
    senderUid: string;
    timestamp: number;
  };
  unreadCount?: {
    [uid: string]: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUid: string;
  senderName: string;
  senderRole: UserRole;
  senderPhotoURL?: string;
  text: string;
  timestamp: number;
  readBy?: string[];
  isDeleted?: boolean;
  // Attachments: photos, videos, files, pdfs
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'file' | 'pdf';
  attachmentName?: string;
  attachmentSize?: number;
}

export interface AIConversationMessage {
  role: 'assistant' | 'user';
  text: string;
  timestamp: number;
}

export interface AIConversation {
  id: string; // studentUid_sessionId
  studentUid: string;
  studentId: string;
  studentName: string;
  sessionId: string;
  classId: string;
  className: string;
  teacherUid: string;
  messages: AIConversationMessage[];
  status: 'active' | 'resolved' | 'pending_teacher_review';
  extractedInfo?: {
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
    reason: string;
    eta?: string;
    lateMinutesEstimate?: number;
    summary: string;
    confidence: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface AppNotification {
  id: string;
  targetUid: string;
  title: string;
  message: string;
  type: 'class_reminder' | 'attendance_opening' | 'attendance_deadline' | 'ai_attendance_message' | 'teacher_message' | 'connection_request' | 'connection_accepted' | 'class_invitation' | 'student_joined';
  linkUrl?: string;
  read: boolean;
  createdAt: number;
  data?: Record<string, any>;
}

export interface UserSettings {
  notifications: {
    classReminders: boolean;
    attendanceReminders: boolean;
    aiAttendanceMessages: boolean;
    messageNotifications: boolean;
    newStudentRequests?: boolean;
    attendanceAlerts?: boolean;
    aiReports?: boolean;
  };
  privacy: {
    allowConnectionRequests: 'everyone' | 'classmates_only' | 'none';
    blockedUids: string[];
    classChatEnabled?: boolean;
  };
  classSettings?: {
    defaultStartTime: string;
    defaultEndTime: string;
    defaultAttendanceOpening: string;
    defaultAttendanceDeadline: string;
    defaultLateThreshold: string;
    allowStudentChatDefault: boolean;
  };
  app: {
    language: string;
    theme: 'dark' | 'system';
  };
}

// ==================== COURSES & STUDY MATERIAL ====================

export interface Course {
  id: string; // Document ID
  courseId: string; // Unique human-readable code e.g. "CS-482719"
  teacherUid: string;
  teacherId: string;
  teacherName: string;
  teacherPhotoURL?: string;
  name: string;
  subject: string;
  description: string;
  coverImageURL?: string;
  category?: string;
  studentCount: number;
  materialCount: number;
  createdAt: number;
  updatedAt: number;
  visibility?: 'public' | 'private';
}

export type MaterialType = 'pdf' | 'image' | 'video' | 'notes' | 'link';

export interface CourseMaterial {
  id: string; // Document ID / materialId
  materialId: string;
  courseId: string;
  title: string;
  description?: string;
  type: MaterialType;
  storagePath?: string;
  downloadURL?: string;
  externalLink?: string;
  textContent?: string;
  uploadedBy: string; // teacherUid
  uploadedByName?: string;
  uploadedAt: number;
  fileSize?: number; // bytes
  fileSizeFormatted?: string;
  fileName?: string;
  chapter?: string; // Chapter or topic name
}

export interface CourseStudent {
  id: string; // doc ID or studentUid
  courseId: string;
  studentUid: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhotoURL?: string;
  joinedAt: number;
  status: 'active' | 'pending' | 'rejected' | 'removed';
}

export type CourseMember = CourseStudent;

export interface CourseJoinRequest {
  id: string;
  courseId: string;
  courseDocId: string;
  courseName: string;
  courseSubject?: string;
  teacherUid: string;
  teacherName: string;
  studentUid: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhotoURL?: string;
  requestedAt: number;
  status: 'pending' | 'accepted' | 'rejected';
}

// ==================== REAL-TIME WEBRTC CALLING SYSTEM ====================

export type CallType = 'audio' | 'video';
export type CallStatus = 'ringing' | 'connected' | 'rejected' | 'ended' | 'busy' | 'missed';

export interface CallSession {
  id: string; // doc ID in calls collection
  callType: CallType;
  status: CallStatus;
  
  // Caller details
  callerUid: string;
  callerName: string;
  callerPhotoURL?: string;
  callerRole?: UserRole;
  callerId?: string; // studentId or teacherId
  
  // Callee / Recipient details
  calleeUid: string;
  calleeName: string;
  calleePhotoURL?: string;
  calleeRole?: UserRole;
  calleeId?: string;
  
  // Context (Optional 1-on-1 or Group)
  groupId?: string;
  groupName?: string;
  conversationId?: string;
  
  // WebRTC SDP Signalling
  offer?: {
    type: 'offer';
    sdp: string;
  };
  answer?: {
    type: 'answer';
    sdp: string;
  };
  
  createdAt: number;
  connectedAt?: number;
  endedAt?: number;
  durationSeconds?: number;
}

export interface CallCandidate {
  id?: string;
  candidate: RTCIceCandidateInit;
  senderUid: string;
  createdAt: number;
}

// ==================== ENGLISH LEARNING SYSTEM ====================

export type EnglishMaterialCategory = 'verb' | 'tense' | 'sentence' | 'grammar' | 'vocab';

export interface EnglishMaterial {
  id: string;
  category: EnglishMaterialCategory;
  title: string;
  hindiMeaning: string;
  englishText?: string;
  hindiText?: string;
  // Verb forms
  v1?: string;
  v2?: string;
  v3?: string;
  v4_ing?: string;
  v5_s_es?: string;
  // Tenses
  tenseType?: string;
  tenseFormula?: string;
  negativeFormula?: string;
  interrogativeFormula?: string;
  identificationHindi?: string;
  // Examples & Explanations
  exampleSentence?: string;
  exampleHindi?: string;
  explanation?: string;
  mistakeToAvoid?: string;
  tip?: string;
  tags?: string[];
  // Teacher metadata if custom uploaded
  addedByTeacherUid?: string;
  addedByTeacherName?: string;
  isTeacherCustom?: boolean;
  createdAt: number;
  updatedAt?: number;
}



