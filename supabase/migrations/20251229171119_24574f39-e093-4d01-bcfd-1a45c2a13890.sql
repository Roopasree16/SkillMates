-- Create a table to track passed profiles
CREATE TABLE public.passed_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  passed_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, passed_user_id)
);

-- Enable RLS
ALTER TABLE public.passed_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own passed profiles"
ON public.passed_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own passed profiles"
ON public.passed_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passed profiles"
ON public.passed_profiles FOR DELETE
USING (auth.uid() = user_id);