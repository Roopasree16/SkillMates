-- Secure helper to mark messages read (WhatsApp-like)
-- Allows only conversation participants to mark incoming messages as read.

CREATE OR REPLACE FUNCTION public.mark_conversation_messages_read(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure caller is a participant
  IF NOT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND (c.participant_1 = v_uid OR c.participant_2 = v_uid)
  ) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  -- Mark only incoming (not sent by caller) unread messages as read
  UPDATE public.messages m
  SET is_read = true
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id <> v_uid
    AND m.is_read = false;
END;
$$;

COMMENT ON FUNCTION public.mark_conversation_messages_read(uuid)
IS 'Marks unread incoming messages as read for a conversation (participant-only).';
