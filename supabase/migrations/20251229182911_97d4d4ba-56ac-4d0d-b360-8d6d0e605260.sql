-- Add last_seen column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen);

-- Enable realtime for profiles table to track presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;