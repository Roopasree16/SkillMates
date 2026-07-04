-- Create reviews table for connections
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL,
  reviewed_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, reviewed_user_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

-- Users can create reviews for their connections
CREATE POLICY "Users can create reviews for connections" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id 
  AND reviewer_id != reviewed_user_id
  AND EXISTS (
    SELECT 1 FROM connection_requests 
    WHERE status = 'accepted' 
    AND ((from_user_id = auth.uid() AND to_user_id = reviewed_user_id) 
      OR (to_user_id = auth.uid() AND from_user_id = reviewed_user_id))
  )
);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = reviewer_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" 
ON public.reviews 
FOR DELETE 
USING (auth.uid() = reviewer_id);

-- Add trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();