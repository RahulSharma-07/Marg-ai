-- =============================================================================
-- Marg AI — Initial Schema Migration
-- Creates all tables, enums, RLS policies, and triggers
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE user_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE study_hours AS ENUM ('0.5', '1', '2', '4+');
CREATE TYPE learning_style AS ENUM ('videos', 'reading', 'interactive', 'mixed');
CREATE TYPE primary_objective AS ENUM ('placement', 'internship', 'freelancing', 'projects', 'higher_studies');
CREATE TYPE user_plan AS ENUM ('free', 'premium');

CREATE TYPE roadmap_status AS ENUM ('generating', 'active', 'completed', 'archived');

CREATE TYPE topic_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE topic_status AS ENUM ('locked', 'available', 'in_progress', 'completed');

CREATE TYPE resource_type AS ENUM ('video', 'documentation', 'practice', 'project', 'reading');
CREATE TYPE verification_status AS ENUM ('unverified', 'verified', 'broken');
CREATE TYPE curation_method AS ENUM ('ai_generated', 'human_reviewed');

CREATE TYPE ai_call_type AS ENUM (
  'roadmap_gen',
  'mindmap_gen',
  'summary_gen',
  'doubt_solver',
  'resource_curation'
);

-- ---------------------------------------------------------------------------
-- TABLE: users
-- Extends auth.users with product-specific profile data
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id                    uuid          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  text,
  email                 text,
  goal                  text,
  level                 user_level,
  study_hours_per_day   study_hours,
  learning_style        learning_style,
  primary_objective     primary_objective,
  plan                  user_plan     NOT NULL DEFAULT 'free',
  created_at            timestamptz   NOT NULL DEFAULT now()
);

-- Auto-create a users row when a new auth.users record is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- TABLE: roadmaps
-- AI-generated course plan for a user
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.roadmaps (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title                 text          NOT NULL,
  estimated_total_time  text,
  status                roadmap_status NOT NULL DEFAULT 'generating',
  created_at            timestamptz   NOT NULL DEFAULT now()
);

-- Enforce one active roadmap per user at the DB level
CREATE UNIQUE INDEX IF NOT EXISTS roadmaps_one_active_per_user
  ON public.roadmaps (user_id)
  WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- TABLE: topics
-- Individual steps within a roadmap
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.topics (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id        uuid          NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  title             text          NOT NULL,
  sequence_order    int           NOT NULL,
  difficulty        topic_difficulty,
  estimated_time    text,
  prerequisites     jsonb         DEFAULT '[]'::jsonb,
  learning_outcome  text,
  status            topic_status  NOT NULL DEFAULT 'locked',
  week_number       int,
  mindmap           jsonb,
  summary           jsonb,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

CREATE INDEX IF NOT EXISTS topics_roadmap_id_idx ON public.topics (roadmap_id);
CREATE INDEX IF NOT EXISTS topics_roadmap_order_idx ON public.topics (roadmap_id, sequence_order);

-- ---------------------------------------------------------------------------
-- TABLE: resources
-- Learning resources attached to a topic
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.resources (
  id                  uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id            uuid                  NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  type                resource_type         NOT NULL,
  title               text                  NOT NULL,
  url                 text                  NOT NULL,
  source_platform     text,
  verification_status verification_status   NOT NULL DEFAULT 'unverified',
  curation_method     curation_method       NOT NULL DEFAULT 'ai_generated',
  created_at          timestamptz           NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resources_topic_id_idx ON public.resources (topic_id);

-- ---------------------------------------------------------------------------
-- TABLE: progress
-- Denormalized progress summary per user+roadmap for fast dashboard reads
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.progress (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  roadmap_id            uuid        NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  topics_completed      int         NOT NULL DEFAULT 0,
  total_topics          int         NOT NULL DEFAULT 0,
  total_learning_hours  numeric     NOT NULL DEFAULT 0,
  last_activity_at      timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, roadmap_id)
);

-- ---------------------------------------------------------------------------
-- TABLE: chat_history
-- Doubt-solver exchanges, linked to user and optionally to a topic
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.chat_history (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic_id          uuid        REFERENCES public.topics(id) ON DELETE SET NULL,
  question          text        NOT NULL,
  answer            text        NOT NULL,
  context_snapshot  jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_history_user_id_idx ON public.chat_history (user_id);
CREATE INDEX IF NOT EXISTS chat_history_created_at_idx ON public.chat_history (created_at DESC);

-- ---------------------------------------------------------------------------
-- TABLE: assessments
-- Raw assessment answers + AI-derived profile, kept for auditing and re-runs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.assessments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  raw_answers       jsonb       NOT NULL,
  generated_profile jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessments_user_id_idx ON public.assessments (user_id);

-- ---------------------------------------------------------------------------
-- TABLE: ai_usage_logs
-- Every AI call logged for cost monitoring (unit economics early warning)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  call_type           ai_call_type  NOT NULL,
  provider            text          NOT NULL,
  tokens_used         int           NOT NULL DEFAULT 0,
  estimated_cost_usd  numeric       NOT NULL DEFAULT 0,
  created_at          timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_logs_user_id_idx ON public.ai_usage_logs (user_id);
CREATE INDEX IF NOT EXISTS ai_usage_logs_created_at_idx ON public.ai_usage_logs (created_at DESC);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- Every user-scoped table: users can only read/write their own rows
-- ---------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs   ENABLE ROW LEVEL SECURITY;

-- users: own row only
CREATE POLICY "users_own_row" ON public.users
  FOR ALL USING (auth.uid() = id);

-- roadmaps: own rows only
CREATE POLICY "roadmaps_own_rows" ON public.roadmaps
  FOR ALL USING (auth.uid() = user_id);

-- topics: visible if the roadmap belongs to the user
CREATE POLICY "topics_via_roadmap" ON public.topics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      WHERE r.id = topics.roadmap_id
        AND r.user_id = auth.uid()
    )
  );

-- resources: visible if the topic's roadmap belongs to the user
CREATE POLICY "resources_via_topic" ON public.resources
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.topics t
      JOIN public.roadmaps r ON r.id = t.roadmap_id
      WHERE t.id = resources.topic_id
        AND r.user_id = auth.uid()
    )
  );

-- progress: own rows only
CREATE POLICY "progress_own_rows" ON public.progress
  FOR ALL USING (auth.uid() = user_id);

-- chat_history: own rows only
CREATE POLICY "chat_history_own_rows" ON public.chat_history
  FOR ALL USING (auth.uid() = user_id);

-- assessments: own rows only
CREATE POLICY "assessments_own_rows" ON public.assessments
  FOR ALL USING (auth.uid() = user_id);

-- ai_usage_logs: own rows only
CREATE POLICY "ai_usage_logs_own_rows" ON public.ai_usage_logs
  FOR ALL USING (auth.uid() = user_id);
