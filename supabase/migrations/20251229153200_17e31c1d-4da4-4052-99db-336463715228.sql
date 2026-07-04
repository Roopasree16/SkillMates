-- Create skills table for available skills
CREATE TABLE public.skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skill verifications table to track user attempts
CREATE TABLE public.skill_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL DEFAULT false,
  score INTEGER NOT NULL DEFAULT 0,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_attempt_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, skill_id)
);

-- Enable RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_verifications ENABLE ROW LEVEL SECURITY;

-- Skills are readable by everyone
CREATE POLICY "Anyone can view skills" 
ON public.skills FOR SELECT 
USING (true);

-- Skill verifications policies
CREATE POLICY "Users can view their own verifications" 
ON public.skill_verifications FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verifications" 
ON public.skill_verifications FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verifications" 
ON public.skill_verifications FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Insert some default skills
INSERT INTO public.skills (name, category) VALUES
('JavaScript', 'Programming'),
('Python', 'Programming'),
('React', 'Frontend'),
('Node.js', 'Backend'),
('TypeScript', 'Programming'),
('SQL', 'Database'),
('CSS', 'Frontend'),
('HTML', 'Frontend'),
('Git', 'Tools'),
('Docker', 'DevOps'),
('AWS', 'Cloud'),
('Machine Learning', 'AI/ML'),
('Data Analysis', 'Data Science'),
('UI/UX Design', 'Design'),
('Graphic Design', 'Design'),
('Photography', 'Creative'),
('Video Editing', 'Creative'),
('Public Speaking', 'Soft Skills'),
('Project Management', 'Business'),
('Marketing', 'Business'),
('Writing', 'Creative'),
('Spanish', 'Languages'),
('French', 'Languages'),
('Mandarin', 'Languages'),
('Music Production', 'Creative'),
('Guitar', 'Music'),
('Piano', 'Music'),
('Cooking', 'Lifestyle'),
('Fitness Training', 'Health'),
('Yoga', 'Health');