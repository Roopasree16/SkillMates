import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Phone, Video, Calendar, MoreVertical, ArrowLeft, FileText, Play, Pause, GraduationCap, User, Clock, Check, CheckCheck, Smile, Pencil, Trash2, X, Paperclip, Download } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import MessageInput from "./MessageInput";
import ScheduleCallDialog from "./ScheduleCallDialog";

import EmojiPicker from "./EmojiPicker";
import MessageReactions from "./MessageReactions";
import ChatMediaPanel from "./ChatMediaPanel";
import { formatDistanceToNow, format, differenceInMinutes, isPast } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useUserPresence, formatLastSeen } from "@/hooks/usePresence";

interface ScheduledCall {
  id: string;
  scheduled_at: string;
  call_type: string;
  status: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  is_read: boolean;
  isPending?: boolean; // For optimistic UI
}

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

interface ChatWindowProps {
  userId: string;
  conversationId: string;
  otherUser: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    education: string | null;
    qualification: string | null;
  };
  onBack: () => void;
  onLeaveChat: () => void;
  onMessagesRead?: () => void;
}

const ChatWindow = ({ userId, conversationId, otherUser, onBack, onLeaveChat, onMessagesRead }: ChatWindowProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([]);
  const [myDisplayName, setMyDisplayName] = useState<string>("User");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video">("video");
  const [callDisplayName, setCallDisplayName] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate short unique room name for Jitsi
  const jitsiRoomName = `sm${conversationId.substring(0, 8)}`;

  // Track other user's presence
  const { isOnline, lastSeen } = useUserPresence(otherUser.user_id);

  // Fetch current user's profile name for calls
  useEffect(() => {
    const fetchMyProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .single();
      if (data?.full_name) {
        setMyDisplayName(data.full_name);
      }
    };
    fetchMyProfile();
  }, [userId]);

  const fetchScheduledCalls = async () => {
    const { data } = await supabase
      .from("scheduled_calls")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("status", "pending")
      .order("scheduled_at", { ascending: true });
    
    setScheduledCalls(data || []);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
    setLoading(false);

    // Fetch reactions for all messages
    if (data && data.length > 0) {
      const messageIds = data.map((m) => m.id);
      const { data: reactionsData } = await supabase
        .from("message_reactions")
        .select("*")
        .in("message_id", messageIds);
      setReactions(reactionsData || []);
    }

    // Mark messages as read using secure function
    await supabase.rpc("mark_conversation_messages_read", {
      p_conversation_id: conversationId,
    });
    // Notify parent to refresh unread counts
    onMessagesRead?.();
  };

  useEffect(() => {
    fetchMessages();
    fetchScheduledCalls();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          // Mark as read if not from self
          if ((payload.new as Message).sender_id !== userId) {
            supabase.rpc("mark_conversation_messages_read", {
              p_conversation_id: conversationId,
            }).then(() => {
              onMessagesRead?.();
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Update message in real-time (for edits and read status)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === (payload.new as Message).id
                ? { ...msg, ...(payload.new as Message) }
                : msg
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Remove deleted message
          setMessages((prev) => prev.filter((msg) => msg.id !== (payload.old as Message).id));
        }
      )
      .subscribe();

    // Subscribe to scheduled calls updates
    const callsChannel = supabase
      .channel(`calls-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scheduled_calls",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchScheduledCalls();
        }
      )
      .subscribe();

    // Subscribe to reactions updates
    const reactionsChannel = supabase
      .channel(`reactions-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReactions((prev) => [...prev, payload.new as Reaction]);
          } else if (payload.eventType === "DELETE") {
            setReactions((prev) => prev.filter((r) => r.id !== (payload.old as Reaction).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(callsChannel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [conversationId, userId]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (content: string, type: string, fileUrl?: string, fileName?: string, fileType?: string) => {
    // For text messages, show optimistic UI with clock icon
    const tempId = `pending-${Date.now()}`;
    
    if (type === "text") {
      const pendingMessage: Message = {
        id: tempId,
        sender_id: userId,
        content: content,
        message_type: type,
        file_url: null,
        file_name: null,
        file_type: null,
        created_at: new Date().toISOString(),
        is_read: false,
        isPending: true,
      };
      setMessages((prev) => [...prev, pendingMessage]);
    }

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: type === "text" ? content : null,
        message_type: type,
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_type: fileType || null,
      });

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
      
      // Remove pending message (realtime will add the real one)
      if (type === "text") {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch (error: any) {
      // Remove pending message and show error
      if (type === "text") {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePlayVoice = (url: string) => {
    if (playingAudio === url) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(url);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingAudio(null);
      setPlayingAudio(url);
    }
  };

  const handleCall = (type: "voice" | "video") => {
    setCallType(type);
    setCallDisplayName(myDisplayName);
    setShowCallDialog(true);
  };

  const startCall = () => {
    const name = callDisplayName.trim() || "Guest";
    const jitsiUrl = `https://meet.jit.si/${jitsiRoomName}#userInfo.displayName="${encodeURIComponent(name)}"`;
    
    window.open(jitsiUrl, '_blank', 'noopener,noreferrer');
    setShowCallDialog(false);
    
    toast({
      title: `${callType.charAt(0).toUpperCase() + callType.slice(1)} call started`,
      description: "Call opened in new tab.",
    });
  };

  // Toggle reaction on a message
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    const existingReaction = reactions.find(
      (r) => r.message_id === messageId && r.user_id === userId && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      await supabase.from("message_reactions").delete().eq("id", existingReaction.id);
    } else {
      // Add reaction
      await supabase.from("message_reactions").insert({
        message_id: messageId,
        user_id: userId,
        emoji: emoji,
      });
    }
  };

  // Edit message
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;
    
    await supabase
      .from("messages")
      .update({ content: newContent.trim() })
      .eq("id", messageId)
      .eq("sender_id", userId);
    
    setEditingMessageId(null);
    setEditContent("");
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)
      .eq("sender_id", userId);
    
    setDeleteMessageId(null);
    toast({
      title: "Message deleted",
      description: "Your message has been removed.",
    });
  };

  // Get aggregated reactions for a message
  const getMessageReactions = (messageId: string) => {
    const messageReactions = reactions.filter((r) => r.message_id === messageId);
    const emojiMap = new Map<string, { count: number; hasReacted: boolean }>();

    messageReactions.forEach((r) => {
      const existing = emojiMap.get(r.emoji) || { count: 0, hasReacted: false };
      emojiMap.set(r.emoji, {
        count: existing.count + 1,
        hasReacted: existing.hasReacted || r.user_id === userId,
      });
    });

    return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      hasReacted: data.hasReacted,
    }));
  };

  // Render text with clickable links
  const renderTextWithLinks = (text: string, isOwn: boolean) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline hover:opacity-80 ${isOwn ? "text-primary-foreground" : "text-primary"}`}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.sender_id === userId;
    const messageReactions = getMessageReactions(message.id);
    
    // Read receipt component for own messages (WhatsApp style)
    const ReadReceipt = () => {
      if (!isOwn) return null;
      
      return (
        <span className="ml-1 inline-flex items-center">
          {message.isPending ? (
            <Clock className="w-3.5 h-3.5 text-primary-foreground/60" />
          ) : message.is_read ? (
            <CheckCheck className="w-4 h-4 text-sky-400" />
          ) : (
            <Check className="w-4 h-4 text-primary-foreground/70" />
          )}
        </span>
      );
    };
    
    const isEditing = editingMessageId === message.id;

    return (
      <div
        key={message.id}
        className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3 group`}
      >
        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          <div className="flex items-end gap-1">
            {!isOwn && (
              <EmojiPicker
                onSelect={(emoji) => handleToggleReaction(message.id, emoji)}
                trigger={
                  <button className="p-1 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    <Smile className="w-4 h-4 text-muted-foreground" />
                  </button>
                }
              />
            )}
            
            {/* Edit/Delete dropdown for own messages */}
            {isOwn && message.message_type === "text" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setEditingMessageId(message.id);
                    setEditContent(message.content || "");
                  }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setDeleteMessageId(message.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                isOwn
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {message.message_type === "text" && (
                isEditing ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="bg-background text-foreground min-w-[200px]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleEditMessage(message.id, editContent);
                        }
                        if (e.key === "Escape") {
                          setEditingMessageId(null);
                          setEditContent("");
                        }
                      }}
                    />
                    <div className="flex gap-1 justify-end">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          setEditingMessageId(null);
                          setEditContent("");
                        }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={() => handleEditMessage(message.id, editContent)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{renderTextWithLinks(message.content || "", isOwn)}</p>
                )
              )}
              
              {message.message_type === "voice" && message.file_url && (
                <button
                  onClick={() => handlePlayVoice(message.file_url!)}
                  className="flex items-center gap-2 text-sm"
                >
                  {playingAudio === message.file_url ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Voice note
                </button>
              )}
              
              {message.message_type === "file" && message.file_url && (
                <>
                  {/* Image preview */}
                  {message.file_type?.startsWith("image/") ? (
                    <a
                      href={message.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block max-w-xs overflow-hidden rounded-lg"
                    >
                      <img 
                        src={message.file_url} 
                        alt={message.file_name || "Image"} 
                        className="max-w-full h-auto max-h-64 object-contain rounded-lg hover:opacity-90 transition-opacity"
                        loading="lazy"
                      />
                      {message.file_name && (
                        <p className="text-xs mt-1 opacity-70 truncate">{message.file_name}</p>
                      )}
                    </a>
                  ) : (
                    /* Document/file preview */
                    <a
                      href={message.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:opacity-80 ${
                        isOwn 
                          ? "bg-primary-foreground/10 border-primary-foreground/20" 
                          : "bg-muted/50 border-border"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isOwn ? "bg-primary-foreground/20" : "bg-primary/10"
                      }`}>
                        <FileText className={`w-5 h-5 ${isOwn ? "text-primary-foreground" : "text-primary"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isOwn ? "text-primary-foreground" : "text-foreground"}`}>
                          {message.file_name || "Download file"}
                        </p>
                        <p className={`text-xs ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {message.file_type?.split("/")[1]?.toUpperCase() || "FILE"}
                        </p>
                      </div>
                      <Download className={`w-4 h-4 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
                    </a>
                  )}
                </>
              )}
              
              {!isEditing && (
                <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  <span className="text-xs">
                    {format(new Date(message.created_at), "h:mm a")}
                  </span>
                  <ReadReceipt />
                </div>
              )}
            </div>
            {isOwn && (
              <EmojiPicker
                onSelect={(emoji) => handleToggleReaction(message.id, emoji)}
                trigger={
                  <button className="p-1 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    <Smile className="w-4 h-4 text-muted-foreground" />
                  </button>
                }
              />
            )}
          </div>
          <MessageReactions
            reactions={messageReactions}
            onToggleReaction={(emoji) => handleToggleReaction(message.id, emoji)}
            isOwn={isOwn}
          />
        </div>
      </div>
    );
  };

  return (
    <>

      <div className="flex h-full">
      <div className="flex flex-col flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser.avatar_url || undefined} />
                  <AvatarFallback>{otherUser.full_name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">{otherUser.full_name || "Unknown"}</h3>
                  <p className="text-xs flex items-center gap-1">
                    {isOnline ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-green-600 dark:text-green-400">online</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        last seen {formatLastSeen(lastSeen)}
                      </span>
                    )}
                  </p>
                </div>
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" align="start">
              <div className="flex gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={otherUser.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">{otherUser.full_name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="space-y-2 flex-1">
                  <div>
                    <h4 className="font-semibold text-foreground">{otherUser.full_name || "Unknown"}</h4>
                    {otherUser.qualification && (
                      <p className="text-sm text-muted-foreground">{otherUser.qualification}</p>
                    )}
                  </div>
                  {otherUser.education && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="w-4 h-4" />
                      <span>{otherUser.education}</span>
                    </div>
                  )}
                  {otherUser.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{otherUser.bio}</p>
                  )}
                  <Badge variant="secondary" className="mt-2">
                    <User className="w-3 h-3 mr-1" />
                    Connection
                  </Badge>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleCall("voice")}>
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleCall("video")}>
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowScheduleDialog(true)}>
            <Calendar className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowMediaPanel(!showMediaPanel)} title="Shared media">
            <Paperclip className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onLeaveChat} className="text-destructive">
                Leave Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scheduled Calls Reminder */}
      {scheduledCalls.length > 0 && (
        <div className="px-4 py-2 border-b border-border bg-primary/5">
          {scheduledCalls.filter(call => !isPast(new Date(call.scheduled_at)) || differenceInMinutes(new Date(call.scheduled_at), new Date()) > -5).map(call => {
            const scheduledDate = new Date(call.scheduled_at);
            const minutesUntil = differenceInMinutes(scheduledDate, new Date());
            const isUpcoming = minutesUntil <= 60 && minutesUntil > 0;
            
            return (
              <div key={call.id} className={`flex items-center gap-2 text-sm py-1 ${isUpcoming ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                <Clock className="w-4 h-4" />
                <span>
                  {call.call_type === 'video' ? '📹' : '📞'} {call.call_type.charAt(0).toUpperCase() + call.call_type.slice(1)} call scheduled for{' '}
                  {format(scheduledDate, 'MMM d, h:mm a')}
                  {isUpcoming && ` (in ${minutesUntil} min)`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="text-center text-muted-foreground">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No messages yet</p>
            <p className="text-sm">Say hello to start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={scrollRef} />
          </>
        )}
      </ScrollArea>

      {/* Message Input */}
      <MessageInput userId={userId} onSendMessage={handleSendMessage} />

      {/* Schedule Call Dialog */}
      <ScheduleCallDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        conversationId={conversationId}
        userId={userId}
        otherUserName={otherUser.full_name || "User"}
      />
      {/* Delete Message Confirmation */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={(open) => !open && setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMessageId && handleDeleteMessage(deleteMessageId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Join Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join {callType === "video" ? "Video" : "Voice"} Call</DialogTitle>
            <DialogDescription>
              Enter your name to display in the call.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="callName">Display Name</Label>
              <Input
                id="callName"
                value={callDisplayName}
                onChange={(e) => setCallDisplayName(e.target.value)}
                placeholder="Enter your name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    startCall();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallDialog(false)}>
              Cancel
            </Button>
            <Button onClick={startCall}>
              {callType === "video" ? <Video className="w-4 h-4 mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
              Join Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      
      {/* Shared Media Panel */}
      {showMediaPanel && (
        <ChatMediaPanel
          messages={messages}
          onClose={() => setShowMediaPanel(false)}
        />
      )}
      </div>
    </>
  );
};

export default ChatWindow;
