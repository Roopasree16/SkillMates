import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Check, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_user_id: string | null;
  related_request_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsDropdownProps {
  userId: string;
  onUpdate?: () => void;
  onAcceptConnection?: (connectedUserId: string) => void;
}

const NotificationsDropdown = ({ userId, onUpdate, onAcceptConnection }: NotificationsDropdownProps) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime notification updates
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleAcceptRequest = async (notification: Notification) => {
    if (!notification.related_request_id) return;
    setLoading(true);

    try {
      // Update the connection request status
      const { error: updateError } = await supabase
        .from("connection_requests")
        .update({ status: "accepted" })
        .eq("id", notification.related_request_id);

      if (updateError) throw updateError;

      // Get the requester's name
      const { data: requesterProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", notification.related_user_id)
        .single();

      // Get my name
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .single();

      // Notify the requester that their request was accepted
      await supabase.from("notifications").insert({
        user_id: notification.related_user_id,
        type: "request_accepted",
        title: "Connection Accepted!",
        message: `${myProfile?.full_name || "Someone"} accepted your connection request.`,
        related_user_id: userId,
      });

      // Mark this notification as read
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);

      toast({
        title: "Connection accepted!",
        description: `You are now connected with ${requesterProfile?.full_name || "this user"}.`,
      });

      fetchNotifications();
      onUpdate?.();
      
      // Open chat with the newly connected user
      if (notification.related_user_id) {
        onAcceptConnection?.(notification.related_user_id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (notification: Notification) => {
    if (!notification.related_request_id) return;
    setLoading(true);

    try {
      // Update the connection request status
      const { error: updateError } = await supabase
        .from("connection_requests")
        .update({ status: "rejected" })
        .eq("id", notification.related_request_id);

      if (updateError) throw updateError;

      // Get my name
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .single();

      // Notify the requester that their request was rejected
      await supabase.from("notifications").insert({
        user_id: notification.related_user_id,
        type: "request_rejected",
        title: "Connection Request",
        message: `${myProfile?.full_name || "Someone"} declined your connection request.`,
        related_user_id: userId,
      });

      // Mark this notification as read
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);

      toast({
        title: "Request declined",
        description: "The connection request has been declined.",
      });

      fetchNotifications();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hidden sm:flex">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-popover max-h-[400px] overflow-y-auto" align="end">
        <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "p-3 border-b border-border last:border-b-0",
                !notification.is_read && "bg-muted/30"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{getTimeAgo(notification.created_at)}</p>
                  
                  {notification.type === "connection_request" && !notification.is_read && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleAcceptRequest(notification)}
                        disabled={loading}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleRejectRequest(notification)}
                        disabled={loading}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {notification.type !== "connection_request" && !notification.is_read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs mt-1 p-0"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;