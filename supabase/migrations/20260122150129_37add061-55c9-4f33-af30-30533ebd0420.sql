-- Enable realtime for messages table so UPDATE events (like marking as read) are broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;