import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface VideoCallProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isCalling: boolean;
  isIncoming: boolean;
  callType: 'video' | 'voice';
  isMuted: boolean;
  isVideoOff: boolean;
  otherUserName: string;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

const VideoCall = ({
  localStream,
  remoteStream,
  isConnected,
  isCalling,
  isIncoming,
  callType,
  isMuted,
  isVideoOff,
  otherUserName,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleVideo,
}: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Incoming call UI
  if (isIncoming) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-sm mx-4">
          <div className="mb-6">
            <Avatar className="w-24 h-24 mx-auto mb-4 bg-primary/20">
              <AvatarFallback className="text-2xl text-primary font-semibold">
                {getInitials(otherUserName)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold text-foreground">{otherUserName}</h2>
            <p className="text-muted-foreground mt-2">
              Incoming {callType === 'video' ? 'video' : 'voice'} call...
            </p>
          </div>
          
          <div className="flex justify-center gap-6">
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full w-16 h-16"
              onClick={onReject}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
              onClick={onAccept}
            >
              <Phone className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calling/waiting UI
  if (isCalling) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-sm mx-4">
          <div className="mb-6">
            <Avatar className="w-24 h-24 mx-auto mb-4 bg-primary/20 animate-pulse">
              <AvatarFallback className="text-2xl text-primary font-semibold">
                {getInitials(otherUserName)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold text-foreground">{otherUserName}</h2>
            <p className="text-muted-foreground mt-2">Calling...</p>
          </div>
          
          <Button
            size="lg"
            variant="destructive"
            className="rounded-full w-16 h-16"
            onClick={onEnd}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    );
  }

  // Active call UI
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Remote video/audio - full screen */}
      <div className="flex-1 relative">
        {callType === 'video' && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
            <div className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4 bg-primary/20">
                <AvatarFallback className="text-4xl text-primary font-semibold">
                  {getInitials(otherUserName)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-semibold text-white">{otherUserName}</h2>
              {isConnected ? (
                <p className="text-green-400 mt-2">Connected</p>
              ) : (
                <p className="text-yellow-400 mt-2">Connecting...</p>
              )}
            </div>
          </div>
        )}

        {/* Local video - picture in picture */}
        {callType === 'video' && localStream && (
          <div className="absolute top-4 right-4 w-32 h-48 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            {isVideoOff && (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        )}

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 text-white hover:bg-white/20"
          onClick={onEnd}
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Connection status */}
        {!isConnected && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-black/60 rounded-lg px-4 py-2 text-white">
              Connecting...
            </div>
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="bg-black/80 backdrop-blur-sm p-6">
        <div className="flex justify-center items-center gap-6">
          <Button
            size="lg"
            variant={isMuted ? 'destructive' : 'secondary'}
            className="rounded-full w-14 h-14"
            onClick={onToggleMute}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          {callType === 'video' && (
            <Button
              size="lg"
              variant={isVideoOff ? 'destructive' : 'secondary'}
              className="rounded-full w-14 h-14"
              onClick={onToggleVideo}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Button>
          )}

          <Button
            size="lg"
            variant="destructive"
            className="rounded-full w-16 h-16"
            onClick={onEnd}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
