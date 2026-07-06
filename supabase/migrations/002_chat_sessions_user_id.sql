ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;


CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions (user_id);


ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "chat_sessions_own_rows" ON public.chat_sessions;
CREATE POLICY "chat_sessions_own_rows" ON public.chat_sessions
  FOR ALL USING (auth.uid() = user_id);


DROP POLICY IF EXISTS "chat_messages_via_session" ON public.chat_messages;
CREATE POLICY "chat_messages_via_session" ON public.chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = chat_messages.session_id
        AND s.user_id = auth.uid()
    )
  );
