import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChatListSkeleton from "@/components/skeletons/ChatListSkeleton";
interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string | null;
  otherUser: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    education: string | null;
    qualification: string | null;
  };
  unreadCount: number;
  lastMessage: string | null;
}

interface ChatListProps {
  userId: string;
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId: string | null;
}

const ChatList = ({ userId, onSelectConversation, selectedConversationId }: ChatListProps) => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const previousUnreadRef = useRef<Map<string, number>>(new Map());
  const isInitialLoadRef = useRef(true);
  const fetchConversations = async () => {
    // Get all conversations for this user
    const { data: convData } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (!convData || convData.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Get other user profiles and unread counts
    const conversationsWithData = await Promise.all(
      convData.map(async (conv) => {
        const otherUserId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, bio, education, qualification")
          .eq("user_id", otherUserId)
          .maybeSingle();

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .neq("sender_id", userId);

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, message_type")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...conv,
          otherUser: profile || { user_id: otherUserId, full_name: "Unknown", avatar_url: null, bio: null, education: null, qualification: null },
          unreadCount: unreadCount || 0,
          lastMessage: lastMsg?.message_type === "text" ? lastMsg?.content : lastMsg?.message_type === "file" ? "📎 File" : lastMsg?.message_type === "voice" ? "🎤 Voice note" : null,
        };
      })
    );

    // Check for new messages and show notification
    if (!isInitialLoadRef.current) {
      conversationsWithData.forEach((conv) => {
        const prevUnread = previousUnreadRef.current.get(conv.id) || 0;
        // Only notify if unread count increased and it's not the selected conversation
        if (conv.unreadCount > prevUnread && conv.id !== selectedConversationId) {
          toast({
            title: `New message from ${conv.otherUser.full_name || "Someone"}`,
            description: conv.lastMessage || "Sent you a message",
          });
        }
      });
    }
    isInitialLoadRef.current = false;

    // Update the previous unread counts
    const newUnreadMap = new Map<string, number>();
    conversationsWithData.forEach((conv) => {
      newUnreadMap.set(conv.id, conv.unreadCount);
    });
    previousUnreadRef.current = newUnreadMap;

    setConversations(conversationsWithData);
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel("chat-list-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    // Subscribe to new conversations
    const conversationsChannel = supabase
      .channel("chat-list-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationsChannel);
    };
  }, [userId]);

  if (loading) {
    return <ChatListSkeleton />;
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 dark:from-primary/20 dark:to-primary/5 flex items-center justify-center border border-border/50 dark:border-primary/10 shadow-card dark:shadow-none">
            <Users className="w-8 h-8 text-primary/60 dark:text-primary/50" />
          </div>
          <p className="text-foreground font-medium mb-1">No conversations yet</p>
          <p className="text-sm text-muted-foreground">Connect with others to start chatting!</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group hover:scale-[1.01] active:scale-[0.99] ${
              selectedConversationId === conv.id
                ? "bg-gradient-to-r from-secondary to-secondary/50 dark:from-primary/15 dark:to-primary/5 border border-accent/30 dark:border-primary/20 shadow-card dark:shadow-lg dark:shadow-primary/5"
                : "hover:bg-gradient-to-r hover:from-secondary/60 dark:hover:from-muted/50 hover:to-transparent border border-transparent hover:border-border/50"
            }`}
          >
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-border/50 shadow-md">
                <AvatarImage src={conv.otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/50 dark:from-primary/20 dark:to-primary/5 text-primary font-semibold">
                  {conv.otherUser.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              {conv.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-background">
                  {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`font-medium truncate ${conv.unreadCount > 0 ? "text-foreground" : "text-foreground/80"}`}>
                  {conv.otherUser.full_name || "Unknown"}
                </span>
                {conv.last_message_at && (
                  <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                  </span>
                )}
              </div>
              <p className={`text-sm truncate ${conv.unreadCount > 0 ? "text-foreground/70 font-medium" : "text-muted-foreground"}`}>
                {conv.lastMessage || "Start a conversation"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ChatList;
