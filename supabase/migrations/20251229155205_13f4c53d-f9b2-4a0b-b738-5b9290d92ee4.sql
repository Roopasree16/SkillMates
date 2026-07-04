-- Add more profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS qualification text,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Create user_skills table to track skills users have and want to learn
CREATE TABLE public.user_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  skill_type text NOT NULL CHECK (skill_type IN ('have', 'learn')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id, skill_type)
);

-- Enable RLS
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_skills
CREATE POLICY "Users can view all user skills" 
ON public.user_skills 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own skills" 
ON public.user_skills 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills" 
ON public.user_skills 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills" 
ON public.user_skills 
FOR DELETE 
USING (auth.uid() = user_id);