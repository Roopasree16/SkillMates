-- Create table for WebRTC signaling
CREATE TABLE public.call_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  signal_type TEXT NOT NULL, -- 'offer', 'answer', 'ice-candidate', 'call-request', 'call-accepted', 'call-rejected', 'call-ended'
  signal_data JSONB,
  call_type TEXT NOT NULL DEFAULT 'video', -- 'video' or 'voice'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- Users can view signals in their conversations
CREATE POLICY "Users can view their call signals"
ON public.call_signals
FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can insert their own signals
CREATE POLICY "Users can insert call signals"
ON public.call_signals
FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- Users can delete signals they're part of
CREATE POLICY "Users can delete their call signals"
ON public.call_signals
FOR DELETE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Enable realtime for call signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;