import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseWebRTCProps {
  conversationId: string;
  userId: string;
  otherUserId: string;
  callType: 'video' | 'voice';
  onCallEnded?: () => void;
}

interface CallState {
  isInCall: boolean;
  isIncoming: boolean;
  isCalling: boolean;
  isConnected: boolean;
  callType: 'video' | 'voice';
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export const useWebRTC = ({
  conversationId,
  userId,
  otherUserId,
  callType: initialCallType,
  onCallEnded,
}: UseWebRTCProps) => {
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isIncoming: false,
    isCalling: false,
    isConnected: false,
    callType: initialCallType,
  });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);

  const cleanup = useCallback(async () => {
    console.log('Cleaning up WebRTC connection');
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    setRemoteStream(null);
    setCallState({
      isInCall: false,
      isIncoming: false,
      isCalling: false,
      isConnected: false,
      callType: initialCallType,
    });
    pendingCandidatesRef.current = [];

    // Clean up signals - cast to any to handle new table
    await (supabase.from('call_signals' as any) as any)
      .delete()
      .eq('conversation_id', conversationId);
  }, [localStream, conversationId, initialCallType]);

  const sendSignal = useCallback(async (signalType: string, signalData: any, callType: string) => {
    await (supabase.from('call_signals' as any) as any).insert({
      conversation_id: conversationId,
      from_user_id: userId,
      to_user_id: otherUserId,
      signal_type: signalType,
      signal_data: signalData,
      call_type: callType,
    });
  }, [conversationId, userId, otherUserId]);

  const createPeerConnection = useCallback(() => {
    console.log('Creating peer connection');
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
        await sendSignal('ice-candidate', { candidate: event.candidate.toJSON() }, callState.callType);
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track');
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState(prev => ({ ...prev, isConnected: true }));
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanup();
        onCallEnded?.();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [callState.callType, cleanup, onCallEnded, sendSignal]);

  const getMediaStream = useCallback(async (type: 'video' | 'voice') => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video',
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error getting media stream:', error);
      throw error;
    }
  }, []);

  const initiateCall = useCallback(async (type: 'video' | 'voice') => {
    console.log('Initiating call:', type);
    setCallState(prev => ({ ...prev, isCalling: true, callType: type }));

    try {
      await sendSignal('call-request', {}, type);
    } catch (error) {
      console.error('Error initiating call:', error);
      setCallState(prev => ({ ...prev, isCalling: false }));
    }
  }, [sendSignal]);

  const acceptCall = useCallback(async () => {
    console.log('Accepting call');
    
    try {
      const stream = await getMediaStream(callState.callType);
      const pc = createPeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      await sendSignal('call-accepted', {}, callState.callType);
      setCallState(prev => ({ ...prev, isIncoming: false, isInCall: true }));
    } catch (error) {
      console.error('Error accepting call:', error);
      cleanup();
    }
  }, [callState.callType, getMediaStream, createPeerConnection, sendSignal, cleanup]);

  const rejectCall = useCallback(async () => {
    console.log('Rejecting call');
    await sendSignal('call-rejected', {}, callState.callType);
    cleanup();
  }, [callState.callType, sendSignal, cleanup]);

  const endCall = useCallback(async () => {
    console.log('Ending call');
    await sendSignal('call-ended', {}, callState.callType);
    cleanup();
    onCallEnded?.();
  }, [callState.callType, sendSignal, cleanup, onCallEnded]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(prev => !prev);
    }
  }, [localStream]);

  // Listen for call signals
  useEffect(() => {
    const channel = supabase
      .channel(`call-signals-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const signal = payload.new as any;
          
          if (signal.from_user_id === userId) return; // Ignore own signals

          console.log('Received signal:', signal.signal_type);

          switch (signal.signal_type) {
            case 'call-request':
              setCallState(prev => ({
                ...prev,
                isIncoming: true,
                callType: signal.call_type,
              }));
              break;

            case 'call-accepted':
              try {
                const stream = await getMediaStream(signal.call_type);
                const pc = createPeerConnection();

                stream.getTracks().forEach(track => {
                  pc.addTrack(track, stream);
                });

                // Create offer
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                await sendSignal('offer', { sdp: offer }, signal.call_type);
                setCallState(prev => ({ ...prev, isCalling: false, isInCall: true }));
              } catch (error) {
                console.error('Error after call accepted:', error);
                cleanup();
              }
              break;

            case 'call-rejected':
              cleanup();
              break;

            case 'call-ended':
              cleanup();
              onCallEnded?.();
              break;

            case 'offer':
              if (peerConnectionRef.current && signal.signal_data?.sdp) {
                try {
                  await peerConnectionRef.current.setRemoteDescription(
                    new RTCSessionDescription(signal.signal_data.sdp)
                  );

                  // Add pending candidates
                  for (const candidate of pendingCandidatesRef.current) {
                    await peerConnectionRef.current.addIceCandidate(candidate);
                  }
                  pendingCandidatesRef.current = [];

                  const answer = await peerConnectionRef.current.createAnswer();
                  await peerConnectionRef.current.setLocalDescription(answer);

                  await sendSignal('answer', { sdp: answer }, signal.call_type);
                } catch (error) {
                  console.error('Error handling offer:', error);
                }
              }
              break;

            case 'answer':
              if (peerConnectionRef.current && signal.signal_data?.sdp) {
                try {
                  await peerConnectionRef.current.setRemoteDescription(
                    new RTCSessionDescription(signal.signal_data.sdp)
                  );

                  // Add pending candidates
                  for (const candidate of pendingCandidatesRef.current) {
                    await peerConnectionRef.current.addIceCandidate(candidate);
                  }
                  pendingCandidatesRef.current = [];
                } catch (error) {
                  console.error('Error handling answer:', error);
                }
              }
              break;

            case 'ice-candidate':
              if (signal.signal_data?.candidate) {
                const candidate = new RTCIceCandidate(signal.signal_data.candidate);
                if (peerConnectionRef.current?.remoteDescription) {
                  await peerConnectionRef.current.addIceCandidate(candidate);
                } else {
                  pendingCandidatesRef.current.push(candidate);
                }
              }
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, getMediaStream, createPeerConnection, cleanup, onCallEnded, sendSignal]);

  return {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
};
