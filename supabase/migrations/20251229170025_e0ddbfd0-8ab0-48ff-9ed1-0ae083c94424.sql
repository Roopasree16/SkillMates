-- Allow users to delete their own connection requests
CREATE POLICY "Users can delete their own connection requests"
ON public.connection_requests
FOR DELETE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);