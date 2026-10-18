import React, { createContext, useContext, useEffect, useState } from 'react';
import { CallSession, CallType, UserProfile } from '../types';
import {
  callManager,
  subscribeIncomingCalls,
  subscribeCallSession,
} from '../lib/webrtcCallService';
import { ActiveCallModal } from '../components/common/ActiveCallModal';
import { IncomingCallNotification } from '../components/common/IncomingCallNotification';

interface CallContextType {
  activeCall: CallSession | null;
  incomingCall: CallSession | null;
  startCall: (params: {
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
  }) => Promise<void>;
  acceptCall: (call: CallSession) => Promise<void>;
  declineCall: (call: CallSession) => Promise<void>;
  endCall: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{
  currentUser: UserProfile | null;
  children: React.ReactNode;
}> = ({ currentUser, children }) => {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);

  // 1. Subscribe to incoming calls for current logged in user
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsub = subscribeIncomingCalls(currentUser.uid, (incoming) => {
      // If we are already in an active call, ignore new incoming or mark busy
      if (activeCall) return;
      setIncomingCall(incoming);
    });

    return () => unsub();
  }, [currentUser?.uid, activeCall]);

  // 2. Subscribe to active call status updates
  useEffect(() => {
    if (!activeCall?.id) return;

    const unsub = subscribeCallSession(activeCall.id, (call) => {
      if (!call || call.status === 'ended' || call.status === 'rejected') {
        setActiveCall(null);
      } else {
        setActiveCall(call);
      }
    });

    return () => unsub();
  }, [activeCall?.id]);

  const startCall = async (params: {
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
  }) => {
    if (!currentUser?.uid || !params.targetUser?.uid) {
      console.warn('Cannot initiate call: user profile or target user ID is not available.', {
        currentUser,
        targetUser: params.targetUser,
      });
      return;
    }
    try {
      const session = await callManager.startCall({
        caller: currentUser,
        targetUser: params.targetUser,
        callType: params.callType,
        groupId: params.groupId,
        groupName: params.groupName,
        conversationId: params.conversationId,
      });
      setActiveCall(session);
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  };

  const acceptCall = async (call: CallSession) => {
    try {
      setIncomingCall(null);
      await callManager.answerCall(call);
      setActiveCall({
        ...call,
        status: 'connected',
        connectedAt: Date.now(),
      });
    } catch (err) {
      console.error('Failed to answer call:', err);
    }
  };

  const declineCall = async (call: CallSession) => {
    try {
      setIncomingCall(null);
      await callManager.rejectCall(call.id);
    } catch (err) {
      console.error('Failed to decline call:', err);
    }
  };

  const endCall = async () => {
    try {
      await callManager.endCall(activeCall?.id);
      setActiveCall(null);
    } catch (err) {
      console.error('Failed to end call:', err);
    }
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        startCall,
        acceptCall,
        declineCall,
        endCall,
      }}
    >
      {children}

      {/* Floating Incoming Call Banner */}
      {incomingCall && !activeCall && (
        <IncomingCallNotification
          incomingCall={incomingCall}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {/* Full-Screen / Modal Active Call Interface */}
      {activeCall && currentUser && (
        <ActiveCallModal
          call={activeCall}
          currentUser={currentUser}
          onEndCall={endCall}
        />
      )}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
