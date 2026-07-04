import { JitsiMeeting } from '@jitsi/react-sdk';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface JitsiCallProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
  isAudioOnly?: boolean;
}

const JitsiCall = ({ roomName, displayName, onClose, isAudioOnly = false }: JitsiCallProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Close button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="destructive"
          size="icon"
          onClick={onClose}
          className="rounded-full"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: isAudioOnly,
          disableModeratorIndicator: true,
          enableEmailInStats: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        }}
        interfaceConfigOverwrite={{
          DISABLE_DOMINANT_SPEAKER_INDICATOR: true,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'chat',
            'settings',
            'raisehand',
            'videoquality',
            'tileview',
          ],
        }}
        userInfo={{
          displayName: displayName,
          email: '',
        }}
        onApiReady={(externalApi) => {
          console.log('Jitsi API ready');
          
          // Listen for hangup event
          externalApi.addListener('videoConferenceLeft', () => {
            console.log('User left the conference');
            onClose();
          });
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
        }}
      />
    </div>
  );
};

export default JitsiCall;
