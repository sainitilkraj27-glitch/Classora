import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  Radio,
  User,
  Users,
  Activity,
} from 'lucide-react';
import { CallSession, UserProfile } from '../../types';
import { callManager } from '../../lib/webrtcCallService';

interface ActiveCallModalProps {
  call: CallSession;
  currentUser: UserProfile;
  onEndCall: () => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  call,
  currentUser,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(call.callType === 'video');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [speakingLevel, setSpeakingLevel] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const isCaller = call.callerUid === currentUser.uid;
  const otherParty = {
    name: isCaller ? call.calleeName : call.callerName,
    photoURL: isCaller ? call.calleePhotoURL : call.callerPhotoURL,
    role: isCaller ? call.calleeRole : call.callerRole,
    displayId: isCaller ? call.calleeId : call.callerId,
  };

  // Timer for connected call
  useEffect(() => {
    let timer: any = null;
    if (call.status === 'connected') {
      const startTime = call.connectedAt || Date.now();
      timer = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [call.status, call.connectedAt]);

  // Attach local and remote streams to video/audio elements
  useEffect(() => {
    if (localVideoRef.current && callManager.localStream) {
      localVideoRef.current.srcObject = callManager.localStream;
    }
    if (remoteVideoRef.current && callManager.remoteStream) {
      remoteVideoRef.current.srcObject = callManager.remoteStream;
    }
    if (remoteAudioRef.current && callManager.remoteStream) {
      remoteAudioRef.current.srcObject = callManager.remoteStream;
    }
  }, [call.status, isVideoEnabled]);

  // Audio level meter loop
  useEffect(() => {
    let animId: number;
    const updateMeter = () => {
      const level = callManager.getSpeakingVolume();
      setSpeakingLevel(level);
      animId = requestAnimationFrame(updateMeter);
    };
    animId = requestAnimationFrame(updateMeter);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleToggleMute = () => {
    const enabled = callManager.toggleMute();
    setIsMuted(!enabled);
  };

  const handleToggleVideo = () => {
    const enabled = callManager.toggleVideo();
    setIsVideoEnabled(enabled);
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerMuted((prev) => {
      const next = !prev;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = next;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.muted = next;
      }
      return next;
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        {/* Hidden Audio element for remote WebRTC audio output */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-slate-900/95 border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col items-center justify-between min-h-[520px] overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Info Bar */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-full text-[11px] font-semibold text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>
                {call.status === 'ringing'
                  ? isCaller
                    ? 'Calling...'
                    : 'Incoming Call...'
                  : 'HD Real-Time Audio'}
              </span>
            </div>

            {call.groupName && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {call.groupName}
              </span>
            )}
          </div>

          {/* Center Call Visuals */}
          <div className="my-auto flex flex-col items-center text-center space-y-4 z-10 w-full">
            {call.callType === 'video' && isVideoEnabled ? (
              /* Video Call Streams */
              <div className="relative w-full h-56 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                {/* Remote Video Stream */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Local PIP Video */}
                <div className="absolute bottom-2 right-2 w-24 h-32 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              /* Audio Call Avatar & Live Sound Waves */
              <div className="relative flex items-center justify-center my-4">
                {/* Pulsating Animated Soundwave Rings */}
                {call.status === 'connected' && (
                  <>
                    <div
                      className="absolute rounded-full bg-purple-500/10 transition-all duration-100"
                      style={{
                        width: `${120 + speakingLevel * 1.5}px`,
                        height: `${120 + speakingLevel * 1.5}px`,
                      }}
                    />
                    <div
                      className="absolute rounded-full bg-cyan-500/15 transition-all duration-100"
                      style={{
                        width: `${100 + speakingLevel * 0.8}px`,
                        height: `${100 + speakingLevel * 0.8}px`,
                      }}
                    />
                  </>
                )}

                {call.status === 'ringing' && (
                  <div className="absolute w-36 h-36 rounded-full border-2 border-purple-500/30 animate-ping opacity-30" />
                )}

                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 border-2 border-purple-400/40 flex items-center justify-center text-white font-bold text-3xl shadow-xl overflow-hidden z-10">
                  {otherParty.photoURL ? (
                    <img
                      src={otherParty.photoURL}
                      alt={otherParty.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    otherParty.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
            )}

            {/* Caller Name & ID */}
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {otherParty.name}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                {otherParty.displayId && (
                  <span className="text-xs font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded-md border border-cyan-500/30">
                    ID: {otherParty.displayId}
                  </span>
                )}
                <span className="text-xs text-slate-400 capitalize">
                  {otherParty.role || 'Member'}
                </span>
              </div>
            </div>

            {/* Live Audio Equalizer Waveform */}
            {call.status === 'connected' ? (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-center gap-1 h-6">
                  {[20, 45, 75, 90, 60, 40, 85, 30].map((h, i) => {
                    const dynamicHeight = Math.max(
                      4,
                      Math.round((h * (speakingLevel + 15)) / 100)
                    );
                    return (
                      <span
                        key={i}
                        className="w-1 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full transition-all duration-75"
                        style={{ height: `${dynamicHeight}px` }}
                      />
                    );
                  })}
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400">
                  {formatDuration(callDuration)}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 animate-pulse">
                {isCaller ? 'Ringing student / teacher...' : 'Connecting audio stream...'}
              </div>
            )}
          </div>

          {/* Bottom Call Control Buttons */}
          <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-center gap-4 z-10">
            {/* Mute Button */}
            <button
              onClick={handleToggleMute}
              className={`p-3.5 rounded-2xl border transition flex items-center justify-center shadow-lg ${
                isMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button
              id="end-call-btn"
              onClick={onEndCall}
              className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-xl shadow-rose-950/60 transition flex items-center justify-center"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Video Toggle Button (if video call) */}
            {call.callType === 'video' && (
              <button
                onClick={handleToggleVideo}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-center shadow-lg ${
                  !isVideoEnabled
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
                title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {!isVideoEnabled ? (
                  <VideoOff className="w-5 h-5" />
                ) : (
                  <Video className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Speaker Toggle Button */}
            <button
              onClick={handleToggleSpeaker}
              className={`p-3.5 rounded-2xl border transition flex items-center justify-center shadow-lg ${
                isSpeakerMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
            >
              {isSpeakerMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
