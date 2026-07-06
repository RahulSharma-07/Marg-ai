-- =============================================================================
-- Marg AI — Seed Data for Local Development
-- Run this after migrations to get a sample roadmap for testing.
-- NOTE: Replace the user_id with a real auth.users id from your local Supabase.
-- =============================================================================

-- Placeholder user id — replace with a real id when seeding locally
DO $$
DECLARE
  v_user_id    uuid := '00000000-0000-0000-0000-000000000001';
  v_roadmap_id uuid;
  v_topic1_id  uuid;
  v_topic2_id  uuid;
  v_topic3_id  uuid;
BEGIN

-- Seed user profile (skip if user already exists)
INSERT INTO public.users (id, name, email, goal, level, study_hours_per_day, learning_style, primary_objective)
VALUES (
  v_user_id,
  'Test Student',
  'test@example.com',
  'Python Web Developer',
  'beginner',
  '1',
  'videos',
  'placement'
)
ON CONFLICT (id) DO NOTHING;

-- Seed roadmap
INSERT INTO public.roadmaps (id, user_id, title, estimated_total_time, status)
VALUES (
  gen_random_uuid(),
  v_user_id,
  'Python for Web Development',
  '8 weeks',
  'active'
)
RETURNING id INTO v_roadmap_id;

-- Seed topics
INSERT INTO public.topics (id, roadmap_id, title, sequence_order, difficulty, estimated_time, learning_outcome, status, week_number)
VALUES (gen_random_uuid(), v_roadmap_id, 'Python Basics', 1, 'easy', '3 hours', 'Write basic Python scripts using variables, data types, and operators', 'available', 1)
RETURNING id INTO v_topic1_id;

INSERT INTO public.topics (id, roadmap_id, title, sequence_order, difficulty, estimated_time, prerequisites, learning_outcome, status, week_number)
VALUES (gen_random_uuid(), v_roadmap_id, 'Control Flow', 2, 'easy', '2 hours', '["Python Basics"]', 'Use if/else, for loops, and while loops to control program flow', 'locked', 1)
RETURNING id INTO v_topic2_id;

INSERT INTO public.topics (id, roadmap_id, title, sequence_order, difficulty, estimated_time, prerequisites, learning_outcome, status, week_number)
VALUES (gen_random_uuid(), v_roadmap_id, 'Functions', 3, 'medium', '3 hours', '["Control Flow"]', 'Define and call functions, understand scope, args/kwargs', 'locked', 2)
RETURNING id INTO v_topic3_id;

-- Seed resources for first topic
INSERT INTO public.resources (topic_id, type, title, url, source_platform, verification_status)
VALUES
  (v_topic1_id, 'video',         'Python Tutorial for Beginners',  'https://www.youtube.com/watch?v=_uQrJ0TkZlc', 'YouTube',     'unverified'),
  (v_topic1_id, 'documentation', 'The Python Tutorial (Official)', 'https://docs.python.org/3/tutorial/',           'Python Docs', 'verified'),
  (v_topic1_id, 'practice',      'Python on HackerRank',           'https://www.hackerrank.com/domains/python',     'HackerRank',  'unverified'),
  (v_topic1_id, 'reading',       'Python Basics — freeCodeCamp',   'https://www.freecodecamp.org/news/the-python-guide-for-beginners/', 'freeCodeCamp', 'unverified');

-- Seed progress
INSERT INTO public.progress (user_id, roadmap_id, topics_completed, total_topics)
VALUES (v_user_id, v_roadmap_id, 0, 3);

END $$;
