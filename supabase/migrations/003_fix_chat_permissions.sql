-- Fix chat_sessions and chat_messages permissions
-- Run this in Supabase SQL Editor → https://supabase.com/dashboard/project/ypaqmqaioqsaslbnzebz/sql

-- 1. Make sure tables exist (safe to run even if they do)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Disable RLS so the anon/publishable key can read and write freely
ALTER TABLE public.chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;

-- 3. Grant full access to anon and authenticated roles
GRANT ALL ON public.chat_sessions TO anon, authenticated;
GRANT ALL ON public.chat_messages TO anon, authenticated;

-- 4. Auto-update updated_at on chat_sessions when new message arrives
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions SET updated_at = NOW() WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_message ON public.chat_messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_session_timestamp();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON public.chat_sessions(updated_at DESC);
