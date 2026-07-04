import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Mic, MicOff, X, Play, Pause, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface MessageInputProps {
  userId: string;
  onSendMessage: (content: string, type: string, fileUrl?: string, fileName?: string, fileType?: string) => void;
}

const MessageInput = ({ userId, onSendMessage }: MessageInputProps) => {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [recordedUrl]);

  const handleSend = async () => {
    if (recordedBlob) {
      await uploadVoiceNote(recordedBlob);
      return;
    }
    
    if (selectedFile) {
      await handleFileUpload(selectedFile);
      return;
    }
    
    if (!message.trim()) return;
    
    onSendMessage(message.trim(), "text");
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 50MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chat-files")
        .getPublicUrl(filePath);

      onSendMessage("", "file", urlData.publicUrl, file.name, file.type);
      setSelectedFile(null);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordingDuration(0);

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        stream.getTracks().forEach((track) => track.stop());
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record voice notes",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setIsPlayingPreview(false);
    setRecordingDuration(0);
  };

  const togglePreviewPlayback = () => {
    if (!recordedUrl) return;
    
    if (isPlayingPreview) {
      audioPreviewRef.current?.pause();
      setIsPlayingPreview(false);
    } else {
      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio(recordedUrl);
        audioPreviewRef.current.onended = () => setIsPlayingPreview(false);
      }
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const uploadVoiceNote = async (blob: Blob) => {
    setUploading(true);
    try {
      const filePath = `${userId}/${Date.now()}.webm`;

      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chat-files")
        .getPublicUrl(filePath);

      onSendMessage("", "voice", urlData.publicUrl, "Voice note", "audio/webm");
      cancelRecording();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 border-t border-border">
      {/* Uploading indicator */}
      {uploading && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <div className="flex-1">
            <p className="text-sm font-medium text-primary">Sending...</p>
            <p className="text-xs text-muted-foreground">
              {selectedFile ? `Uploading ${selectedFile.name}` : "Uploading voice note"}
            </p>
          </div>
          <Progress value={undefined} className="w-20 h-1.5" />
        </div>
      )}

      {selectedFile && !uploading && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setSelectedFile(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {recordedBlob && recordedUrl && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={togglePreviewPlayback}
          >
            {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <div className="flex-1">
            <span className="text-sm text-foreground">Voice note</span>
            <span className="text-xs text-muted-foreground ml-2">{formatDuration(recordingDuration)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={cancelRecording}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {isRecording && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-destructive/10 rounded-lg">
          <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm text-destructive">Recording... {formatDuration(recordingDuration)}</span>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || isRecording || !!recordedBlob}
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <Button
          variant={isRecording ? "destructive" : "ghost"}
          size="icon"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={uploading || !!recordedBlob}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 min-h-[44px] max-h-32 resize-none"
          disabled={isRecording || uploading || !!recordedBlob}
        />

        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile && !recordedBlob) || uploading || isRecording}
          size="icon"
          className="relative"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;