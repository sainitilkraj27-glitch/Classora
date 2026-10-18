import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Video, Users, Sparkles, Volume2 } from 'lucide-react';
import { CallSession } from '../../types';
import { ringtoneService } from '../../lib/ringtoneService';

interface IncomingCallNotificationProps {
  incomingCall: CallSession;
  onAccept: (call: CallSession) => void;
  onDecline: (call: CallSession) => void;
}

export const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({
  incomingCall,
  onAccept,
  onDecline,
}) => {
  // Start mast ringtone and show system notification when call arrives
  useEffect(() => {
    ringtoneService.start();

    // Native Web Notification API
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`📞 Incoming ${incomingCall.callType === 'video' ? 'Video' : 'Voice'} Call`, {
            body: `${incomingCall.callerName} is calling you on Classora...`,
            icon: incomingCall.callerPhotoURL || '/icon.png',
            tag: `call-${incomingCall.id}`,
            requireInteraction: true,
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    } catch (e) {}

    return () => {
      ringtoneService.stop();
    };
  }, [incomingCall.id, incomingCall.callerName, incomingCall.callType, incomingCall.callerPhotoURL]);

  const handleAccept = () => {
    ringtoneService.stop();
    onAccept(incomingCall);
  };

  const handleDecline = () => {
    ringtoneService.stop();
    onDecline(incomingCall);
  };

  return (
    <AnimatePresence>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[999999] w-[95%] max-w-md px-2">
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.92 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative bg-[#0c0f1e]/95 border-2 border-purple-500/50 rounded-3xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-slate-100 overflow-hidden"
        >
          {/* Ambient Pulsing Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/30 rounded-full blur-2xl animate-pulse pointer-events-none" />

          <div className="flex items-center justify-between gap-3">
            {/* Caller Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/40 flex items-center justify-center text-white font-bold text-base shadow-lg overflow-hidden shrink-0">
                  {incomingCall.callerPhotoURL ? (
                    <img
                      src={incomingCall.callerPhotoURL}
                      alt={incomingCall.callerName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    incomingCall.callerName.charAt(0).toUpperCase()
                  )}
                </div>
                {/* Active Ping ring */}
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                    {incomingCall.callType === 'video' ? (
                      <Video className="w-3 h-3 text-purple-400" />
                    ) : (
                      <Phone className="w-3 h-3 text-purple-400" />
                    )}
                    Incoming {incomingCall.callType === 'video' ? 'Video' : 'Voice'} Call
                  </span>
                </div>
                <h4 className="text-sm font-black text-white truncate">
                  {incomingCall.callerName}
                </h4>
                {incomingCall.groupName ? (
                  <p className="text-[11px] text-purple-300 truncate">
                    Group: {incomingCall.groupName}
                  </p>
                ) : incomingCall.callerId ? (
                  <p className="text-[10px] font-mono text-cyan-300">
                    ID: {incomingCall.callerId}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Decline Button */}
              <button
                id="decline-call-btn"
                onClick={() => onDecline(incomingCall)}
                className="p-3 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-300 hover:text-white rounded-2xl transition shadow-lg flex items-center justify-center"
                title="Decline"
              >
                <PhoneOff className="w-4 h-4" />
              </button>

              {/* Accept Button */}
              <button
                id="accept-call-btn"
                onClick={() => onAccept(incomingCall)}
                className="p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-bold transition shadow-lg shadow-emerald-950/40 flex items-center justify-center animate-bounce"
                title="Accept Call"
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
