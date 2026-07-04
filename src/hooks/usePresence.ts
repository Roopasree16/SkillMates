import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PresenceState {
  isOnline: boolean;
  lastSeen: Date | null;
}

export const usePresence = (userId: string | null) => {
  const lastUpdateRef = useRef<number>(0);
  const throttleMs = 30000; // Only update every 30 seconds max

  useEffect(() => {
    if (!userId) return;

    const updateLastSeen = async () => {
      const now = Date.now();
      // Throttle: only update if 30 seconds have passed since last update
      if (now - lastUpdateRef.current < throttleMs) return;
      lastUpdateRef.current = now;

      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('user_id', userId);
    };

    // Update immediately on mount
    updateLastSeen();

    // Update every 30 seconds while active
    const interval = setInterval(updateLastSeen, throttleMs);

    // Throttled activity handler
    const handleActivity = () => updateLastSeen();
    
    // Only listen to a few key events, not all activity
    window.addEventListener('focus', handleActivity);
    window.addEventListener('click', handleActivity, { passive: true });

    // Update on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastUpdateRef.current = 0; // Reset throttle on visibility change
        updateLastSeen();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Update before leaving
    const handleBeforeUnload = () => {
      lastUpdateRef.current = 0; // Force update before leaving
      updateLastSeen();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('click', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId]);
};

export const useUserPresence = (targetUserId: string | null): PresenceState => {
  const [presenceState, setPresenceState] = useState<PresenceState>({
    isOnline: false,
    lastSeen: null,
  });

  const checkPresence = useCallback(async () => {
    if (!targetUserId) return;

    const { data } = await supabase
      .from('profiles')
      .select('last_seen')
      .eq('user_id', targetUserId)
      .single();

    if (data?.last_seen) {
      const lastSeenDate = new Date(data.last_seen);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / 1000 / 60;
      
      // Consider online if active in last 2 minutes
      setPresenceState({
        isOnline: diffMinutes < 2,
        lastSeen: lastSeenDate,
      });
    }
  }, [targetUserId]);

  useEffect(() => {
    if (!targetUserId) return;

    // Check immediately
    checkPresence();

    // Check every 30 seconds
    const interval = setInterval(checkPresence, 30000);

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`presence-${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload) => {
          const lastSeen = payload.new.last_seen;
          if (lastSeen) {
            const lastSeenDate = new Date(lastSeen);
            const now = new Date();
            const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / 1000 / 60;
            
            setPresenceState({
              isOnline: diffMinutes < 2,
              lastSeen: lastSeenDate,
            });
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [targetUserId, checkPresence]);

  return presenceState;
};

export const formatLastSeen = (lastSeen: Date | null): string => {
  if (!lastSeen) return '';

  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return lastSeen.toLocaleDateString();
};
