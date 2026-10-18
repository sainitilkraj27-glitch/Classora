import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { CallSession, CallCandidate, CallType, UserProfile } from '../types';

// Standard Google STUN Configuration
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

// ==================== SYNTHESIZED SOUND EFFECTS ====================
// Uses Web Audio API oscillator - 100% reliable in any browser without external assets

let audioCtx: AudioContext | null = null;
let ringtoneInterval: any = null;
let ringbackInterval: any = null;

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playIncomingRingtone(): void {
  stopRingtone();
  const ctx = getAudioContext();

  const playChime = () => {
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc2.frequency.setValueAtTime(659.25, now); // E5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.9);
      osc2.stop(now + 0.9);
    } catch (e) {
      console.warn('Audio ringtone error:', e);
    }
  };

  playChime();
  ringtoneInterval = setInterval(playChime, 2500);
}

export function stopRingtone(): void {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
}

export function playOutgoingRingback(): void {
  stopRingback();
  const ctx = getAudioContext();

  const playTone = () => {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn('Ringback audio error:', e);
    }
  };

  playTone();
  ringbackInterval = setInterval(playTone, 3000);
}

export function stopRingback(): void {
  if (ringbackInterval) {
    clearInterval(ringbackInterval);
    ringbackInterval = null;
  }
}

export function playConnectSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // High pleasant beep
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    console.warn(e);
  }
}

export function playHangupSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now); // Soft low tone
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.warn(e);
  }
}

// ==================== WEBRTC CONNECTION MANAGER ====================

export class CallManager {
  private static instance: CallManager;
  public peerConnection: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  public currentCall: CallSession | null = null;
  public isCaller: boolean = false;
  private unsubCallDoc: (() => void) | null = null;
  private unsubCandidates: (() => void) | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  public static getInstance(): CallManager {
    if (!CallManager.instance) {
      CallManager.instance = new CallManager();
    }
    return CallManager.instance;
  }

  // Request user audio/video media with high quality audio settings
  public async getMediaStream(callType: CallType): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
        video:
          callType === 'video'
            ? {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user',
              }
            : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      this.setupAudioAnalyser(stream);
      return stream;
    } catch (err) {
      console.warn('Microphone/Camera permission error or not available:', err);
      // Fallback: Create silent audio track if device has no physical mic
      const audioCtx = getAudioContext();
      const dest = audioCtx.createMediaStreamDestination();
      this.localStream = dest.stream;
      return dest.stream;
    }
  }

  // Setup Web Audio Analyser to monitor speaking volume
  private setupAudioAnalyser(stream: MediaStream): void {
    try {
      const ctx = getAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      this.audioAnalyser = ctx.createAnalyser();
      this.audioAnalyser.fftSize = 64;
      source.connect(this.audioAnalyser);
    } catch (e) {
      console.warn('Audio analyser setup error:', e);
    }
  }

  // Get current speaking volume level from 0 to 100
  public getSpeakingVolume(): number {
    if (!this.audioAnalyser) return 0;
    const dataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
    this.audioAnalyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    return Math.min(100, Math.round((average / 128) * 100));
  }

  // Start outgoing call
  public async startCall(params: {
    caller: UserProfile;
    targetUser: {
      uid: string;
      name: string;
      photoURL?: string;
      role?: string;
      studentId?: string;
      teacherId?: string;
    };
    callType: CallType;
    groupId?: string;
    groupName?: string;
    conversationId?: string;
  }): Promise<CallSession> {
    const callerUid = params.caller?.uid ? String(params.caller.uid).trim() : '';
    const calleeUid = params.targetUser?.uid ? String(params.targetUser.uid).trim() : '';

    if (!callerUid || !calleeUid || calleeUid === 'undefined' || callerUid === 'undefined') {
      console.error('startCall failed: invalid caller or callee UID', { caller: params.caller, targetUser: params.targetUser });
      throw new Error(`Cannot start call: caller ID (${callerUid}) or callee ID (${calleeUid}) is missing.`);
    }

    this.cleanup();
    this.isCaller = true;

    // 1. Get Local Stream
    const stream = await this.getMediaStream(params.callType);

    // 2. Setup RTCPeerConnection
    this.peerConnection = new RTCPeerConnection(rtcConfig);
    this.remoteStream = new MediaStream();

    stream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, stream);
    });

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
    };

    // 3. Create Call Document in Firestore
    const callDocRef = doc(collection(db, 'calls'));
    const callId = callDocRef.id;

    // Collect ICE Candidates to Firestore
    const callerCandidatesCol = collection(db, `calls/${callId}/callerCandidates`);
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(callerCandidatesCol, event.candidate.toJSON());
      }
    };

    // 4. Create Offer
    const offerDescription = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offerDescription);

    const callSession: CallSession = {
      id: callId,
      callType: params.callType,
      status: 'ringing',
      callerUid,
      callerName: params.caller.name || 'Caller',
      callerPhotoURL: params.caller.photoURL || '',
      callerRole: params.caller.role || 'student',
      callerId: params.caller.studentId || params.caller.teacherId || '',
      calleeUid,
      calleeName: params.targetUser.name || 'Recipient',
      calleePhotoURL: params.targetUser.photoURL || '',
      calleeRole: (params.targetUser.role as any) || 'student',
      calleeId: params.targetUser.studentId || params.targetUser.teacherId || '',
      groupId: params.groupId || '',
      groupName: params.groupName || '',
      conversationId: params.conversationId || '',
      offer: {
        type: 'offer',
        sdp: offerDescription.sdp || '',
      },
      createdAt: Date.now(),
    };

    await setDoc(callDocRef, callSession);
    this.currentCall = callSession;

    playOutgoingRingback();

    // 5. Listen for remote answer
    this.unsubCallDoc = onSnapshot(callDocRef, (snap) => {
      const data = snap.data() as CallSession | undefined;
      if (!data) return;

      this.currentCall = data;

      if (data.status === 'connected' && data.answer && !this.peerConnection?.currentRemoteDescription) {
        stopRingback();
        playConnectSound();
        const answerDesc = new RTCSessionDescription(data.answer);
        this.peerConnection?.setRemoteDescription(answerDesc);
      } else if (data.status === 'rejected' || data.status === 'ended') {
        stopRingback();
        playHangupSound();
        this.cleanup();
      }
    });

    // 6. Listen for callee ICE candidates
    const calleeCandidatesCol = collection(db, `calls/${callId}/calleeCandidates`);
    this.unsubCandidates = onSnapshot(calleeCandidatesCol, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidateData = change.doc.data();
          this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidateData));
        }
      });
    });

    return callSession;
  }

  // Answer incoming call
  public async answerCall(call: CallSession): Promise<void> {
    stopRingtone();
    this.isCaller = false;

    // 1. Get Local Stream
    const stream = await this.getMediaStream(call.callType);

    // 2. Setup RTCPeerConnection
    this.peerConnection = new RTCPeerConnection(rtcConfig);
    this.remoteStream = new MediaStream();

    stream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, stream);
    });

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
    };

    // 3. Send Callee ICE Candidates
    const calleeCandidatesCol = collection(db, `calls/${call.id}/calleeCandidates`);
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(calleeCandidatesCol, event.candidate.toJSON());
      }
    };

    // 4. Set Remote Offer & Create Answer
    if (call.offer) {
      const offerDesc = new RTCSessionDescription(call.offer);
      await this.peerConnection.setRemoteDescription(offerDesc);

      const answerDesc = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answerDesc);

      const callDocRef = doc(db, 'calls', call.id);
      await updateDoc(callDocRef, {
        answer: {
          type: 'answer',
          sdp: answerDesc.sdp || '',
        },
        status: 'connected',
        connectedAt: Date.now(),
      });

      playConnectSound();

      // 5. Listen for caller candidates
      const callerCandidatesCol = collection(db, `calls/${call.id}/callerCandidates`);
      this.unsubCandidates = onSnapshot(callerCandidatesCol, (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidateData = change.doc.data();
            this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidateData));
          }
        });
      });

      // 6. Listen for call end
      this.unsubCallDoc = onSnapshot(callDocRef, (snap) => {
        const data = snap.data() as CallSession | undefined;
        if (!data) return;
        this.currentCall = data;
        if (data.status === 'ended' || data.status === 'rejected') {
          playHangupSound();
          this.cleanup();
        }
      });
    }
  }

  // Reject call
  public async rejectCall(callId: string): Promise<void> {
    stopRingtone();
    stopRingback();
    try {
      const callDocRef = doc(db, 'calls', callId);
      await updateDoc(callDocRef, {
        status: 'rejected',
        endedAt: Date.now(),
      });
    } catch (e) {
      console.warn('Reject call error:', e);
    }
    this.cleanup();
  }

  // End active call
  public async endCall(callId?: string): Promise<void> {
    const id = callId || this.currentCall?.id;
    stopRingtone();
    stopRingback();
    playHangupSound();

    if (id) {
      try {
        const callDocRef = doc(db, 'calls', id);
        const snap = await getDoc(callDocRef);
        const data = snap.data() as CallSession | undefined;
        const connectedAt = data?.connectedAt || Date.now();
        const durationSeconds = Math.max(0, Math.floor((Date.now() - connectedAt) / 1000));

        await updateDoc(callDocRef, {
          status: 'ended',
          endedAt: Date.now(),
          durationSeconds,
        });
      } catch (e) {
        console.warn('End call error:', e);
      }
    }

    this.cleanup();
  }

  // Toggle local microphone mute
  public toggleMute(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  // Toggle local camera video
  public toggleVideo(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  // Clean up streams and peer connection
  public cleanup(): void {
    stopRingtone();
    stopRingback();

    if (this.unsubCallDoc) {
      this.unsubCallDoc();
      this.unsubCallDoc = null;
    }

    if (this.unsubCandidates) {
      this.unsubCandidates();
      this.unsubCandidates = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.currentCall = null;
    this.audioAnalyser = null;
  }
}

export const callManager = CallManager.getInstance();

// ==================== FIRESTORE LISTENERS ====================

// Subscribe to incoming calls for current user
export function subscribeIncomingCalls(
  userUid: string,
  callback: (incomingCall: CallSession | null) => void
) {
  // Only calls created in last 2 minutes that are 'ringing'
  const minTime = Date.now() - 120000;
  const q = query(
    collection(db, 'calls'),
    where('calleeUid', '==', userUid),
    where('status', '==', 'ringing')
  );

  return onSnapshot(
    q,
    (snap) => {
      if (!snap.empty) {
        // Find most recent ringing call
        const docs = snap.docs.map((d) => d.data() as CallSession);
        const validCall = docs.find((c) => c.createdAt >= minTime && c.status === 'ringing');
        if (validCall) {
          playIncomingRingtone();
          callback(validCall);
          return;
        }
      }
      stopRingtone();
      callback(null);
    },
    (err) => {
      console.warn('Error subscribing to incoming calls:', err);
    }
  );
}

// Subscribe to active call session status
export function subscribeCallSession(
  callId: string,
  callback: (call: CallSession | null) => void
) {
  return onSnapshot(
    doc(db, 'calls', callId),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as CallSession);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn('Error subscribing to call session:', err);
    }
  );
}
