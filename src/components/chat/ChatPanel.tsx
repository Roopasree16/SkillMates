import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

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

interface ChatPanelProps {
  userId: string;
  onBack: () => void;
  onMessagesRead?: () => void;
  initialChatUserId?: string | null;
}

const ChatPanel = ({ userId, onBack, onMessagesRead, initialChatUserId }: ChatPanelProps) => {
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);

  const fetchTotalUnread = async () => {
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

    if (!conversations || conversations.length === 0) {
      setTotalUnread(0);
      return;
    }

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", conversations.map(c => c.id))
      .eq("is_read", false)
      .neq("sender_id", userId);

    setTotalUnread(count || 0);
  };

  // Initialize conversation with a specific user if provided
  useEffect(() => {
    const initializeConversation = async () => {
      if (!initialChatUserId || isInitializing) return;
      setIsInitializing(true);

      try {
        // First check if conversation exists
        const { data: existingConv } = await supabase
          .from("conversations")
          .select("*")
          .or(`and(participant_1.eq.${userId},participant_2.eq.${initialChatUserId}),and(participant_1.eq.${initialChatUserId},participant_2.eq.${userId})`)
          .single();

        let conversationId = existingConv?.id;

        // If no conversation exists, create one
        if (!existingConv) {
          const { data: newConv, error } = await supabase
            .from("conversations")
            .insert({
              participant_1: userId,
              participant_2: initialChatUserId,
            })
            .select()
            .single();

          if (error) {
            console.error("Failed to create conversation:", error);
            setIsInitializing(false);
            return;
          }
          conversationId = newConv?.id;
        }

        // Fetch other user's profile
        const { data: otherProfile } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, bio, education, qualification")
          .eq("user_id", initialChatUserId)
          .single();

        if (conversationId && otherProfile) {
          setSelectedConversation({
            id: conversationId,
            participant_1: existingConv?.participant_1 || userId,
            participant_2: existingConv?.participant_2 || initialChatUserId,
            last_message_at: existingConv?.last_message_at || null,
            otherUser: otherProfile,
            unreadCount: 0,
            lastMessage: null,
          });
        }
      } catch (error) {
        console.error("Error initializing conversation:", error);
      }
      setIsInitializing(false);
    };

    initializeConversation();
  }, [initialChatUserId, userId]);

  useEffect(() => {
    fetchTotalUnread();

    // Subscribe to message updates
    const channel = supabase
      .channel("unread-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchTotalUnread();
          // Notify parent that messages may have been read
          onMessagesRead?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onMessagesRead]);

  const handleLeaveChat = async () => {
    if (!selectedConversation) return;

    try {
      // Delete the conversation (messages will cascade delete)
      await supabase
        .from("conversations")
        .delete()
        .eq("id", selectedConversation.id);

      toast({
        title: "Chat ended",
        description: "You have left the conversation",
      });

      setSelectedConversation(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl h-[calc(100vh-12rem)] bg-gradient-to-br from-card via-card to-secondary/20 dark:to-primary/5 border border-border/60 dark:border-border/50 shadow-elevated dark:shadow-2xl dark:shadow-primary/5">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-secondary/30 dark:from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/10 dark:from-primary/5 to-transparent rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex h-full relative z-10">
        {/* Chat List - hidden on mobile when conversation selected */}
        <div className={`w-full md:w-80 border-r border-border/50 flex flex-col bg-card/50 dark:bg-background/30 backdrop-blur-sm ${selectedConversation ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-gradient-to-r from-secondary/40 dark:from-primary/5 to-transparent">
            <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-primary/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                <MessageCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-lg text-foreground">Messages</h2>
                <p className="text-xs text-muted-foreground">Stay connected</p>
              </div>
              {totalUnread > 0 && (
                <span className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs px-2.5 py-1 rounded-full font-medium shadow-lg shadow-primary/30 animate-pulse">
                  {totalUnread}
                </span>
              )}
            </div>
          </div>
          <ChatList
            userId={userId}
            onSelectConversation={setSelectedConversation}
            selectedConversationId={selectedConversation?.id || null}
          />
        </div>

        {/* Chat Window */}
        <div className={`flex-1 flex flex-col ${selectedConversation ? "flex" : "hidden md:flex"}`}>
          {selectedConversation ? (
            <ChatWindow
              userId={userId}
              conversationId={selectedConversation.id}
              otherUser={selectedConversation.otherUser}
              onBack={() => setSelectedConversation(null)}
              onLeaveChat={handleLeaveChat}
              onMessagesRead={fetchTotalUnread}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-transparent via-secondary/20 dark:via-primary/5 to-transparent">
              <div className="text-center p-8">
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 dark:from-primary/20 dark:to-primary/5 flex items-center justify-center border border-border/50 dark:border-primary/20 shadow-card dark:shadow-xl dark:shadow-primary/10">
                    <MessageCircle className="w-12 h-12 text-primary/60" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Start a Conversation</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  Select a chat from the list to connect with your skill partners
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
