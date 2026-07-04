-- Create shared_resources table for file sharing
CREATE TABLE public.shared_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_resources ENABLE ROW LEVEL SECURITY;

-- Anyone can view shared resources
CREATE POLICY "Anyone can view shared resources"
ON public.shared_resources
FOR SELECT
USING (true);

-- Users can insert their own resources
CREATE POLICY "Users can insert their own resources"
ON public.shared_resources
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own resources
CREATE POLICY "Users can update their own resources"
ON public.shared_resources
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own resources
CREATE POLICY "Users can delete their own resources"
ON public.shared_resources
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_shared_resources_updated_at
BEFORE UPDATE ON public.shared_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for shared resources
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);

-- Storage policies for resources bucket
CREATE POLICY "Anyone can view resources files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resources');

CREATE POLICY "Authenticated users can upload resources"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resources' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own resource files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);