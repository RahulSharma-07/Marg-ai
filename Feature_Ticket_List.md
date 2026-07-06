# Marg AI — Feature Ticket List
**Source:** PRD v1.0, July 2026
**Stack assumptions:** Next.js + TypeScript + Tailwind + Shadcn UI (frontend), Next.js API Routes + Supabase/PostgreSQL (backend), Supabase Auth + Google OAuth, Gemini API (AI layer), Vercel (deployment)
**Ticket ordering:** Grouped by priority tier, then by build sequence within each tier (respecting dependencies).

---

## PRIORITY: MUST-HAVE FOR LAUNCH (MVP)

---

### TICKET-01: Core Database Schema & Data Models

**Description:**
Set up the Supabase/PostgreSQL schema that underpins the entire product. Build tables for `users`, `roadmaps`, `topics`, `resources`, and `chat_history` as defined in the PRD's data model appendix. Add appropriate foreign keys, indexes on frequently-queried columns (`user_id`, `roadmap_id`, `topic_id`), and RLS (Row Level Security) policies in Supabase so users can only read/write their own data. Include a `status` enum on roadmaps (`active`, `completed`, `archived`) and a `status` enum on topics (`not_started`, `in_progress`, `completed`).

**AI Coding Prompt:**
"Create a Supabase PostgreSQL schema in SQL migration files for a learning platform. Tables: `users` (id, name, email, goal, level, study_hours, learning_style, created_at), `roadmaps` (id, user_id FK, title, estimated_time, status enum: active/completed/archived, created_at), `topics` (id, roadmap_id FK, topic, summary, mindmap jsonb, sequence_order int, status enum: not_started/in_progress/completed, created_at), `resources` (id, topic_id FK, video_url, documentation_url, practice_url, project_description), `chat_history` (id, user_id FK, roadmap_id FK nullable, question, answer, created_at). Add indexes on all foreign keys. Add Row Level Security policies so users can only access rows where user_id matches auth.uid()."

**Acceptance Criteria:**
- [ ] All 5 tables exist with correct columns and types
- [ ] Foreign key constraints enforce referential integrity
- [ ] RLS policies prevent a user from reading/writing another user's data (tested with two separate test accounts)
- [ ] Indexes exist on all foreign key columns
- [ ] Migration is version-controlled and can be run from a clean database

**Dependencies:** None (foundational)
**Priority:** Must-Have

---

### TICKET-02: Authentication (Google OAuth + Email)

**Description:**
Implement signup/login using Supabase Auth with two methods: Google OAuth and email/password. On first login, a corresponding row must be created in the `users` table. Include session persistence, protected route middleware (redirect unauthenticated users to login), and logout functionality.

**AI Coding Prompt:**
"Using Next.js and Supabase Auth, implement authentication supporting Google OAuth and email/password signup/login. On successful first-time signup, create a row in the `users` table with the auth user's id and email. Add Next.js middleware that redirects unauthenticated users away from protected routes (`/dashboard`, `/roadmap`, `/assessment`) to `/login`. Include a logout button that clears the session and redirects to the landing page. Handle and display auth errors (invalid credentials, existing email, etc.) in the UI."

**Acceptance Criteria:**
- [ ] User can sign up and log in via Google OAuth
- [ ] User can sign up and log in via email/password
- [ ] A `users` row is created automatically on first login
- [ ] Unauthenticated users are redirected from protected pages to `/login`
- [ ] Logout clears the session and redirects correctly
- [ ] Auth errors are shown clearly in the UI (not just console-logged)

**Dependencies:** TICKET-01 (users table must exist)
**Priority:** Must-Have

---

### TICKET-03: Landing Page

**Description:**
Build the public marketing landing page: Hero section (tagline "Stop Searching. Start Learning."), Features section, How It Works section, Pricing section (Free vs Premium — Premium can be visually present even though billing isn't live), and FAQ. No testimonials required for MVP. Primary CTA ("Get Started") routes to signup.

**AI Coding Prompt:**
"Build a responsive Next.js + Tailwind + Shadcn UI landing page for 'Marg AI', an AI learning mentor with the tagline 'Stop Searching. Start Learning.' Include sections in this order: Hero (headline, subheadline, primary CTA button 'Get Started' linking to /signup), Features (3-4 cards: Personalized Roadmap, Curated Resources, AI Doubt Solver, Progress Tracking), How It Works (3-4 step visual: Assessment → Roadmap → Learn → Track Progress), Pricing (Free tier vs Premium/Gold tier comparison card, Premium shows 'Coming Soon' badge), FAQ (accordion, 5-6 common questions). Fully responsive for mobile and desktop."

**Acceptance Criteria:**
- [ ] All five sections render correctly on desktop and mobile
- [ ] "Get Started" CTA routes to the signup flow
- [ ] Pricing section clearly distinguishes Free vs Premium (Premium marked as not yet purchasable)
- [ ] FAQ accordion expands/collapses correctly
- [ ] Passes basic Lighthouse accessibility check (>90)

**Dependencies:** None
**Priority:** Must-Have

---

### TICKET-04: AI Assessment (Onboarding Flow)

**Description:**
Build the 5-question onboarding flow that captures: (1) learning goal, (2) current skill level, (3) daily study hours available, (4) preferred learning style, (5) primary objective (e.g., placement prep, project-building, curiosity). This must be a guided, single-question-at-a-time flow (not one long form) with a progress indicator. On completion, submit answers to the backend to trigger Student Profile + Roadmap generation (Tickets 05/06).

**AI Coding Prompt:**
"Build a multi-step onboarding assessment flow in Next.js with Shadcn UI. Five sequential screens, one question per screen, each with a progress bar (Step X of 5) and Back/Next navigation: Q1 'What do you want to learn?' (text input or preset chips e.g. Python, Web Development), Q2 'What's your current level?' (single-select: Complete Beginner / Some Experience / Intermediate), Q3 'How many hours per day can you study?' (single-select: <1hr / 1-2hrs / 2-4hrs / 4+hrs), Q4 'How do you prefer to learn?' (single-select: Video-first / Reading/docs-first / Hands-on projects / Mixed), Q5 'What's your main goal?' (single-select: Placement prep / Personal project / Switching domains / Just curious). On final submit, POST all answers to an API route `/api/assessment/submit` and show a loading state ('Analyzing your profile...') before redirecting to the dashboard."

**Acceptance Criteria:**
- [ ] All 5 questions render in sequence with a visible progress indicator
- [ ] User can navigate back to change a previous answer before submitting
- [ ] Cannot proceed without answering the current question
- [ ] On submit, answers are sent to the backend and a loading state is shown
- [ ] User is redirected to the dashboard only after profile + roadmap generation succeeds
- [ ] Assessment cannot be re-taken accidentally (re-access from dashboard should warn it will regenerate the roadmap)

**Dependencies:** TICKET-02 (Auth), TICKET-01 (schema)
**Priority:** Must-Have

---

### TICKET-05: Student Profile Generation

**Description:**
Backend service that takes the 5 assessment answers and calls the Gemini API to produce a structured Student Profile: normalized level, learning speed estimate, goal, available time, and preferred style. Store this profile on the `users` table (extend schema if needed) so every downstream feature (roadmap, doubt solver) can read it as context.

**AI Coding Prompt:**
"Create a Next.js API route `/api/assessment/submit` that accepts the 5 assessment answers (goal, level, study_hours, learning_style, objective) as JSON. Call the Gemini API with a system prompt instructing it to return ONLY a JSON object (no markdown, no preamble) with fields: `normalized_level` (beginner/intermediate/advanced), `learning_speed_estimate` (slow/moderate/fast), `goal`, `available_hours_per_day`, `preferred_style`. Parse and validate the JSON response (strip any accidental code fences), then upsert these fields into the `users` table row for the authenticated user. Return the generated profile in the response. Handle Gemini API failures gracefully with a retry (max 2 attempts) before returning a 500 error."

**Acceptance Criteria:**
- [ ] API route accepts assessment answers and returns a structured profile object
- [ ] Generated profile is persisted to the `users` table
- [ ] Malformed/non-JSON model responses are caught and retried, not silently accepted
- [ ] Endpoint fails gracefully with a clear error if Gemini API is unreachable
- [ ] Profile data is retrievable by other backend services via `user_id`

**Dependencies:** TICKET-01, TICKET-04
**Priority:** Must-Have

---

### TICKET-06: Personalized Roadmap Generation

**Description:**
Core value-prop feature. Backend service that takes the Student Profile and generates a sequenced list of topics (with prerequisites, difficulty, estimated time, and learning outcome per topic) for one of the MVP-supported tracks (e.g., "Python for Beginners," "Web Development Fundamentals"). Persist the roadmap and its topics to the database. Build the Roadmap View UI showing the full sequenced list.

**AI Coding Prompt:**
"Create a Next.js API route `/api/roadmap/generate` that takes a user's Student Profile and a selected track (limit to 'Python for Beginners' and 'Web Development Fundamentals' for MVP) and calls the Gemini API to generate a sequenced roadmap. Prompt Gemini to return ONLY JSON: an array of topics, each with `topic_name`, `prerequisites` (array of topic names or empty), `difficulty` (easy/medium/hard), `estimated_hours`, and `learning_outcome`. Adjust topic depth/pacing based on `normalized_level` and `available_hours_per_day` from the profile (e.g., skip basics for intermediate users). Insert the roadmap into the `roadmaps` table and each topic into the `topics` table with correct `sequence_order`. Then build a Roadmap View page at `/roadmap` that lists all topics in order, showing difficulty badge, estimated time, and a lock icon on topics whose prerequisites aren't yet completed."

**Acceptance Criteria:**
- [ ] Roadmap generation produces a logically sequenced topic list matching the user's stated level
- [ ] Roadmap and topics are correctly persisted with sequence order preserved
- [ ] Roadmap View displays all topics with difficulty, estimated time, and learning outcome
- [ ] Topics with unmet prerequisites are visually locked/disabled
- [ ] A user with an "advanced" self-reported level receives a visibly shorter/different roadmap than a "beginner" for the same track (spot-check test)
- [ ] Only one active roadmap exists per user at a time (per PRD Open Question #3 resolution for MVP)

**Dependencies:** TICKET-01, TICKET-05
**Priority:** Must-Have

---

### TICKET-07: Curated Resource Recommendation per Topic

**Description:**
For each topic in a roadmap, generate exactly one best video/playlist, one official documentation link, one practice platform link, and one mini-project description. This must be tightly curated (single best option), not a list of alternatives, per the PRD's core "curation beats access" thesis. Store resources linked to their topic and display them in the Topic Detail view.

**AI Coding Prompt:**
"Create a Next.js API route `/api/topic/[topicId]/resources` that, given a topic name and its parent track, calls the Gemini API to return ONLY JSON with exactly one recommendation per category: `video_url` (single best YouTube video/playlist), `documentation_url` (single official docs link), `practice_url` (single practice platform link), `project_description` (a short mini-project brief testing this topic). Insert the result into the `resources` table linked to the topic. Build a Topic Detail page at `/roadmap/[topicId]` displaying these four resources as distinct cards (Watch, Read, Practice, Build), plus a 'Mark as Complete' button and a 'Stuck? Ask AI' button linking to the Doubt Solver."

**Acceptance Criteria:**
- [ ] Each topic has exactly one resource per category (video, docs, practice, project) — never a list
- [ ] Topic Detail page renders all four resource cards clearly
- [ ] Resource links are valid URLs (basic format validation before storage)
- [ ] "Mark as Complete" button is present and wired to Progress Tracking (Ticket 11)
- [ ] "Ask AI" button routes into the Doubt Solver with topic context pre-loaded

**Dependencies:** TICKET-06
**Priority:** Must-Have

---

### TICKET-08: Timeline / Weekly Plan Generation

**Description:**
Convert the flat roadmap into a week-by-week schedule based on the user's stated daily study hours. MVP can be a static plan generated once at roadmap creation (recalculation logic is a Should-Have, Ticket 15). Display as a simple weekly breakdown showing which topics fall in which week.

**AI Coding Prompt:**
"Create a function `generateWeeklyPlan(topics, availableHoursPerDay)` that takes the ordered list of roadmap topics (each with `estimated_hours`) and the user's daily study hours, and buckets topics into weeks (assume a 5-day study week) without splitting a topic across weeks unless it exceeds a full week's capacity. Return an array of `{ week_number, topics: [...] }`. Call this after roadmap generation in `/api/roadmap/generate` and store the week_number on each topic row (add a `week_number` column to `topics` table). Build a Timeline view component showing weeks as collapsible sections, each listing its topics with status."

**Acceptance Criteria:**
- [ ] Every topic is assigned to exactly one week
- [ ] Total weekly hours roughly match the user's stated daily availability × study days
- [ ] Timeline view groups and displays topics by week correctly
- [ ] Timeline is generated automatically immediately after roadmap generation (no separate manual step)

**Dependencies:** TICKET-06
**Priority:** Must-Have

---

### TICKET-09: Dashboard

**Description:**
The primary retention surface. Build the dashboard showing: current goal, today's/current topic, overall progress %, next upcoming topic, and a quick-access AI chat entry point. This is what a returning user sees first.

**AI Coding Prompt:**
"Build a Dashboard page at `/dashboard` in Next.js + Tailwind + Shadcn UI. Fetch the user's active roadmap and progress data server-side. Display: (1) a header card showing the user's current goal/track, (2) a 'Continue Learning' card showing the current in-progress topic with a button to jump to it, (3) a progress ring or bar showing overall roadmap completion percentage, (4) an 'Up Next' card showing the next locked/upcoming topic, (5) a quick AI chat widget (collapsed input box that expands into the Doubt Solver on click/type). Handle the empty/first-time state (no roadmap yet) by showing a CTA to start the assessment."

**Acceptance Criteria:**
- [ ] Dashboard correctly reflects the user's actual current topic and progress %
- [ ] "Continue Learning" navigates directly to the correct in-progress topic
- [ ] Progress % matches the Progress Tracking data source exactly (no drift/separate calculation)
- [ ] Quick AI chat widget successfully opens the Doubt Solver with context
- [ ] First-time users with no roadmap see an assessment CTA instead of a broken/empty dashboard

**Dependencies:** TICKET-06, TICKET-08, TICKET-11 (progress data)
**Priority:** Must-Have

---

### TICKET-10: AI Doubt Solver (Context-Aware Chat)

**Description:**
A chat interface where the AI has access to the student's profile, current roadmap, and current topic when answering — this is the key differentiator vs. generic ChatGPT use per the PRD. Store all Q&A pairs in `chat_history`.

**AI Coding Prompt:**
"Build a chat interface component (`DoubtSolver`) and a backend API route `/api/chat` that accepts a user's question plus their current `topic_id`. Before calling Gemini, fetch and inject as context: the user's Student Profile (level, learning style, goal), the current topic's name and learning outcome, and the last 5 messages from that user's `chat_history` for conversational continuity. Construct a system prompt like: 'You are a mentor helping a {level} learner currently studying {topic_name} as part of their {goal} roadmap. Answer clearly, keep answers scoped to their current level, and connect explanations back to their roadmap context where relevant.' Save both the question and answer to `chat_history` with `user_id`, `roadmap_id`, and timestamp. Render the chat as a scrollable message thread with a text input, loading state while awaiting a response, and error handling if the AI call fails."

**Acceptance Criteria:**
- [ ] Chat responses visibly reflect awareness of the user's current topic and level (verify via test prompts)
- [ ] All Q&A pairs are persisted to `chat_history`
- [ ] Chat maintains short-term context across at least the last 5 exchanges in a session
- [ ] Failed AI calls show a user-facing error message, not a silent failure or crash
- [ ] Doubt Solver is reachable both from the Dashboard quick-chat and from within a Topic Detail page

**Dependencies:** TICKET-01, TICKET-05, TICKET-06
**Priority:** Must-Have

---

### TICKET-11: Progress Tracking

**Description:**
Track and persist topic-level status (not_started/in_progress/completed) and compute overall roadmap completion percentage. This data feeds the Dashboard, Roadmap View, and future Timeline Recalculation.

**AI Coding Prompt:**
"Create an API route `/api/topic/[topicId]/complete` (PATCH) that marks a topic's status as 'completed' in the `topics` table, and automatically sets the next sequential topic (respecting prerequisites) to 'in_progress' if it isn't already. Create a helper function `calculateRoadmapProgress(roadmapId)` that returns `{ completed_count, total_count, percentage }` by querying topic statuses for that roadmap. Expose this via `/api/roadmap/[roadmapId]/progress` (GET). Wire the 'Mark as Complete' button from the Topic Detail page (Ticket 07) to call the completion endpoint and optimistically update the UI."

**Acceptance Criteria:**
- [ ] Marking a topic complete updates its status in the database immediately
- [ ] The next unlocked topic is automatically set to 'in_progress' after a completion
- [ ] Roadmap completion percentage is calculated correctly (completed / total, rounded)
- [ ] Progress data returned by the API matches what's displayed on Dashboard and Roadmap View at all times
- [ ] Completing the final topic in a roadmap updates the roadmap's own `status` to 'completed'

**Dependencies:** TICKET-06, TICKET-07
**Priority:** Must-Have

---

### TICKET-12: Free Tier Usage Caps

**Description:**
Implement simple, hard usage limits for the free tier (no billing system needed yet): capped number of AI Doubt Solver messages per day/month, and a cap of one active roadmap per user. Enforce limits server-side (not just UI-hidden) and show clear in-app messaging when a limit is hit.

**AI Coding Prompt:**
"Add server-side rate limiting to the `/api/chat` route: track daily message count per user (e.g., store a `chat_messages_today` counter with a `last_reset_date` on the `users` table, or query `chat_history` count for the current day) and reject requests beyond a configurable limit (e.g., 20 messages/day) with a 429 status and a clear error message: 'Daily AI chat limit reached — upgrade to Premium for unlimited access.' Enforce that `/api/roadmap/generate` rejects creating a second active roadmap while one is already 'active' for that user, returning a clear error message. Surface both limit states in the UI (disabled chat input with upgrade prompt; roadmap generation blocked with an explanation)."

**Acceptance Criteria:**
- [ ] Free tier users are blocked from sending chat messages beyond the daily cap, enforced server-side
- [ ] Attempting to exceed the cap shows a clear, friendly in-app message (not a raw error)
- [ ] Users cannot create a second active roadmap while one exists, enforced server-side
- [ ] Limit counters reset correctly on the intended cadence (daily/monthly as configured)
- [ ] Premium/Gold users (even if just a flag with no real billing yet) bypass these caps

**Dependencies:** TICKET-06, TICKET-10
**Priority:** Must-Have

---

## PRIORITY: SHOULD-HAVE (Early Post-MVP)

---

### TICKET-13: AI-Generated Mind Maps

**Description:**
On topic completion, generate a visual mind map breaking down the topic's key concepts, for revision purposes. Store as structured JSON and render visually (not as a static image) so it's interactive/zoomable.

**AI Coding Prompt:**
"Create an API route `/api/topic/[topicId]/mindmap` that calls the Gemini API to generate a hierarchical mind map for a completed topic, returning ONLY JSON in a tree structure: `{ label, children: [{ label, children: [...] }] }` with a max depth of 3. Store this JSON in the `topics.mindmap` column. Build a `MindMapViewer` React component that renders this tree as an interactive, zoomable/pannable node graph (use a library like `react-flow` or a simple recursive SVG tree renderer). Trigger mind map generation automatically when a topic is marked complete, and show a 'View Mind Map' button on completed topics in the Roadmap View."

**Acceptance Criteria:**
- [ ] Mind map JSON is generated and stored automatically on topic completion
- [ ] Mind map renders as an interactive visual tree, not plain text or a static image
- [ ] Depth and node count stay readable (not an unreadable wall of nodes)
- [ ] "View Mind Map" is only shown/enabled for completed topics

**Dependencies:** TICKET-07, TICKET-11
**Priority:** Should-Have

---

### TICKET-14: AI Topic Summaries

**Description:**
Generate short notes per topic: key concepts, common mistakes, and interview questions. Displayed alongside the mind map for revision.

**AI Coding Prompt:**
"Create an API route `/api/topic/[topicId]/summary` that calls the Gemini API to generate ONLY JSON with fields: `key_concepts` (array of short bullet strings), `common_mistakes` (array of strings), `interview_questions` (array of 3-5 questions). Store in the `topics.summary` column (jsonb). Trigger generation on topic completion alongside the mind map (Ticket 13). Build a `TopicSummary` component with three collapsible sections (Key Concepts / Common Mistakes / Interview Questions) shown on the Topic Detail page for completed topics."

**Acceptance Criteria:**
- [ ] Summary is generated and stored automatically on topic completion
- [ ] All three sections (concepts, mistakes, interview questions) render correctly and are non-empty
- [ ] Summary is only visible for completed topics
- [ ] Content is specific to the topic (not generic boilerplate — spot check against topic name)

**Dependencies:** TICKET-07, TICKET-11
**Priority:** Should-Have

---

### TICKET-15: Adaptive Timeline Recalculation

**Description:**
Automatically adjust the remaining weekly plan based on the student's actual completion pace, not just their originally stated hours. Rule-based (not ML) for v1, per PRD's explicit scope limit.

**AI Coding Prompt:**
"Create a function `recalculateTimeline(roadmapId)` that compares actual topic completion dates against the originally planned week_numbers to compute the user's real average pace (topics or hours completed per week). If actual pace differs from planned pace by more than a defined threshold (e.g., 20%), re-bucket all remaining incomplete topics into new week_numbers using the actual pace, keeping sequence order intact. Trigger this recalculation after every topic completion (call from the `/api/topic/[topicId]/complete` handler from Ticket 11). Update the Timeline view to show a subtle 'Timeline adjusted based on your pace' notice when a recalculation changes the plan."

**Acceptance Criteria:**
- [ ] Recalculation runs automatically after each topic completion
- [ ] Only remaining/incomplete topics are re-bucketed; completed topics' historical week assignment is untouched
- [ ] Recalculation only triggers a visible change when the pace deviation exceeds the defined threshold (avoid noisy constant re-shuffling)
- [ ] Timeline view clearly communicates to the user when/why their plan shifted

**Dependencies:** TICKET-08, TICKET-11
**Priority:** Should-Have

---

### TICKET-16: Premium Tier (Gold) — Feature Gating & Scaffolding

**Description:**
Introduce a Premium/Gold tier flag and gate premium features (unlimited AI chat, priority responses, advanced mind maps/summaries, PDF export placeholder) behind it. Full payment integration is explicitly out of scope — this ticket is about the gating logic and UI, not billing.

**AI Coding Prompt:**
"Add a `tier` column (enum: 'free' | 'premium') to the `users` table, defaulting to 'free'. Update the rate-limiting logic from Ticket 12 to bypass caps entirely for `tier = 'premium'` users. Build a simple internal admin toggle (or a temporary manual DB flag / hidden dev-only UI toggle) to flip a user's tier for testing, since real billing isn't built yet. Update the Pricing section on the landing page and a new `/upgrade` page to reflect real feature differences (unlimited chat, priority AI response labeling, advanced summaries) with an 'Upgrade' button that is currently non-functional/shows a 'Coming Soon' modal instead of a real checkout."

**Acceptance Criteria:**
- [ ] `tier` field exists and correctly gates chat limits per Ticket 12
- [ ] Premium users experience no usage caps
- [ ] A way exists to toggle a test user's tier without needing real payment infrastructure
- [ ] Upgrade page clearly lists Premium benefits without implying a working checkout exists yet

**Dependencies:** TICKET-12
**Priority:** Should-Have

---

### TICKET-17: Recent Activity / Learning Timeline Widget

**Description:**
A widget showing the user's session history (topics studied, completions, chat sessions) over time, for motivation and habit reinforcement.

**AI Coding Prompt:**
"Create an API route `/api/user/activity` that aggregates and returns a chronological feed of the user's recent actions: topic completions (from `topics` table), chat sessions (grouped by day, from `chat_history`), and roadmap milestones (e.g., 'started roadmap', 'reached Week 3'). Return the last 30 days, most recent first. Build a `RecentActivity` widget component for the Dashboard showing this as a simple vertical timeline/feed with icons per activity type and relative timestamps ('2 days ago')."

**Acceptance Criteria:**
- [ ] Activity feed correctly reflects real completions and chat sessions in chronological order
- [ ] Widget renders on the Dashboard without noticeably slowing initial page load (lazy-load if needed)
- [ ] Empty state (new user, no activity yet) is handled gracefully, not shown as broken/blank

**Dependencies:** TICKET-09, TICKET-10, TICKET-11
**Priority:** Should-Have

---

## PRIORITY: NICE-TO-HAVE (v2+, Defer)

---

### TICKET-18: OTP Login

**Description:**
Add phone-number-based OTP login as a third auth method alongside Google OAuth and email/password.

**AI Coding Prompt:**
"Extend the existing Supabase Auth setup (from Ticket 02) to support phone OTP login. Add a phone number input and OTP verification screen to the login/signup flow. On successful OTP verification for a new user, create a `users` row as with the other auth methods. Ensure OTP login updates the same `users` table schema without requiring email."

**Acceptance Criteria:**
- [ ] User can sign up/log in via phone number + OTP
- [ ] OTP flow includes resend and expiry handling
- [ ] New users via OTP get a correctly created `users` row

**Dependencies:** TICKET-02
**Priority:** Nice-to-Have

---

### TICKET-19: PDF Export of Roadmap

**Description:**
Allow users to export their roadmap (topics, timeline, progress) as a downloadable PDF.

**AI Coding Prompt:**
"Create an API route `/api/roadmap/[roadmapId]/export-pdf` that generates a PDF summarizing the roadmap: title, weekly breakdown, topic list with status, and overall completion percentage. Use a library like `@react-pdf/renderer` or `puppeteer` server-side to render and return the PDF as a downloadable file. Add an 'Export as PDF' button to the Roadmap View."

**Acceptance Criteria:**
- [ ] Generated PDF accurately reflects the current roadmap and progress state
- [ ] PDF is downloadable directly from the Roadmap View
- [ ] Export works for roadmaps of varying lengths without breaking layout/pagination

**Dependencies:** TICKET-06, TICKET-08, TICKET-11
**Priority:** Nice-to-Have

---

### TICKET-20: Theme Customization (Beyond Free/Premium Default)

**Description:**
Allow users to select additional visual themes beyond the default Free/Premium color scheme.

**AI Coding Prompt:**
"Add a theme selector to user settings supporting at least 3 color themes (e.g., Light, Dark, and one accent variant) using Tailwind CSS variables/classes. Persist the selected theme to the `users` table or local storage, and apply it app-wide via a theme provider/context."

**Acceptance Criteria:**
- [ ] User can select and persist a theme choice across sessions
- [ ] Theme applies consistently across all pages (dashboard, roadmap, chat, landing)
- [ ] No layout/contrast issues introduced by any theme

**Dependencies:** TICKET-09
**Priority:** Nice-to-Have

---

### TICKET-21: Multi-Language Support

**Description:**
Support additional languages beyond English for UI and potentially AI-generated content.

**AI Coding Prompt:**
"Integrate an i18n solution (e.g., `next-intl` or `next-i18next`) into the Next.js app. Extract all UI strings into translation files, starting with English and one additional language (e.g., Hindi). Add a language switcher in the app header/settings. Note: AI-generated content (roadmaps, chat) translation is a separate future concern and out of scope for this ticket."

**Acceptance Criteria:**
- [ ] All static UI text is externalized into translation files
- [ ] Language switcher correctly toggles UI language app-wide
- [ ] Fallback to English works correctly for any missing translation keys

**Dependencies:** None (can be done independently, but easiest late in the build)
**Priority:** Nice-to-Have

---

### TICKET-22: Testimonials / Social Proof Section

**Description:**
Add a testimonials/social proof section to the landing page.

**AI Coding Prompt:**
"Add a Testimonials section to the landing page (Ticket 03) displaying a carousel or grid of user testimonials (name, role/context, quote, optional avatar). Make the testimonial data source a simple config array or CMS-fetched list so it's easy to update without a code deploy."

**Acceptance Criteria:**
- [ ] Testimonials section renders responsively on the landing page
- [ ] Testimonial content is easily editable without code changes to the layout itself

**Dependencies:** TICKET-03
**Priority:** Nice-to-Have

---

### TICKET-23: Notifications System

**Description:**
Notify users (in-app and/or email) about streaks, upcoming timeline milestones, or inactivity nudges to improve habit formation.

**AI Coding Prompt:**
"Build a notifications system with an in-app notification bell/dropdown on the Dashboard and a backend job (e.g., a scheduled Supabase Edge Function or cron) that generates notifications for: (1) a user hasn't returned in 3+ days, (2) a new week of the timeline has started, (3) a roadmap milestone (25%/50%/75%/100% completion) was reached. Store notifications in a new `notifications` table (id, user_id, message, type, read boolean, created_at) and mark as read on view."

**Acceptance Criteria:**
- [ ] Notifications are generated correctly for each defined trigger condition
- [ ] In-app notification bell shows unread count and lists recent notifications
- [ ] Marking as read persists correctly and updates the unread count

**Dependencies:** TICKET-09, TICKET-11
**Priority:** Nice-to-Have

---

### TICKET-24: AI Preference Settings

**Description:**
Let users fine-tune AI behavior (e.g., response length, tone, explanation depth) for the Doubt Solver and roadmap generation.

**AI Coding Prompt:**
"Add an AI Preferences section to user settings with controls for: response length (concise/detailed), tone (formal/casual), and explanation depth (simple/technical). Persist these as a `ai_preferences` jsonb column on the `users` table. Inject these preferences into the system prompt used in the `/api/chat` route (Ticket 10) so responses adapt accordingly."

**Acceptance Criteria:**
- [ ] User can set and persist AI preferences
- [ ] Doubt Solver responses observably change based on selected preferences (verify via test prompts with different settings)
- [ ] Default preferences are sensible for users who never touch this setting

**Dependencies:** TICKET-10
**Priority:** Nice-to-Have

---

## Build Order Summary (Critical Path for MVP)

```
TICKET-01 (Schema)
   ↓
TICKET-02 (Auth) ──→ TICKET-03 (Landing Page, parallel/independent)
   ↓
TICKET-04 (Assessment)
   ↓
TICKET-05 (Student Profile)
   ↓
TICKET-06 (Roadmap Generation)
   ↓
   ├─→ TICKET-07 (Resources) ──→ TICKET-11 (Progress Tracking)
   ├─→ TICKET-08 (Timeline)
   └─→ TICKET-10 (Doubt Solver)
   ↓
TICKET-09 (Dashboard) — depends on 06, 08, 11
   ↓
TICKET-12 (Free Tier Caps) — depends on 06, 10
```

**MVP is launch-ready once Tickets 01–12 are complete.** Tickets 13–17 (Should-Have) can be built in the first post-launch sprint cycles. Tickets 18–24 (Nice-to-Have) should be deferred until core engagement metrics (Section 9 of the PRD) validate the core loop.
