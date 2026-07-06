# Technical Architecture Document: Marg AI

**Document Owner:** Engineering
**Status:** Draft v1.0
**Last Updated:** July 2026
**Companion to:** Marg AI PRD v1.0

---

## 1. Architecture Philosophy

Three constraints should drive every decision in this document:

1. **Small team, fast iteration.** You're pre-PMF. Every tool should minimize ops overhead so 1–3 engineers can ship daily without managing infrastructure.
2. **AI cost and latency are first-class concerns.** Roadmap generation, resource curation, doubt-solving, and mind maps are all LLM calls. These need to be async, cacheable, and cost-monitored from day one — not bolted on later.
3. **Curation quality is the product.** The architecture must support a human-in-the-loop review layer for AI-generated resources, not just raw LLM output straight to production. This shapes the data model (Section 4) more than anything else.

---

## 2. Recommended Tech Stack (with reasoning)

### 2.1 Frontend

| Choice | Reasoning |
|---|---|
| **Next.js 14+ (App Router)** | Single framework for marketing pages (SSG/SSR for SEO on the landing page) and the authenticated app (client-heavy dashboard). Avoids running two separate frontends at MVP stage. |
| **TypeScript** | Non-negotiable at this data-model complexity (roadmaps, topics, resources, chat history all reference each other). Catches integration bugs between frontend and API before runtime. |
| **Tailwind CSS** | Fastest path to a consistent design system with a small team; pairs directly with Shadcn. |
| **Shadcn UI** | Copy-in component code (not a black-box npm dependency) — you own and can modify components, which matters because you have two visual themes (Blue/Free, Gold/Premium) to support. |

### 2.2 Backend

| Choice | Reasoning |
|---|---|
| **Next.js API Routes (Route Handlers)** | Keeps one deployable unit at MVP. Avoids standing up a separate backend service before you have traffic that justifies it. |
| **Supabase (PostgreSQL)** | Managed Postgres + built-in Auth + Row Level Security (RLS) in one product. RLS is particularly valuable here: student data (profile, chat history, progress) needs per-user isolation, and RLS enforces that at the database layer instead of relying on application code to never make a mistake. |
| **Background jobs: Supabase Edge Functions or a lightweight queue (e.g., Inngest/Trigger.dev)** *(recommended addition)* | Roadmap generation, mind map generation, and resource curation are slow LLM chains. These must NOT run synchronously inside a request/response cycle — use a job queue so the user gets a "generating your roadmap..." state while work happens in the background and the dashboard updates on completion. |

### 2.3 Authentication

| Choice | Reasoning |
|---|---|
| **Supabase Auth (Google OAuth + Email/Password)** | Native integration with Supabase Postgres + RLS. Google OAuth reduces signup friction for the target segment (college students already signed into Google). Defer OTP (SMS) — it adds an SMS provider dependency for marginal conversion gain at MVP. |

### 2.4 AI Layer

| Choice | Reasoning |
|---|---|
| **Gemini API (primary)** | Stated preference in the concept doc; strong cost/performance for structured generation (roadmaps, summaries) and long-context doubt-solving (needs to hold roadmap + history in context). |
| **Provider abstraction layer** *(strong recommendation)* | Don't call the Gemini SDK directly from route handlers. Build a thin internal `ai/` service layer (`generateRoadmap()`, `answerDoubt()`, `curateResources()`) so you can swap/add OpenAI or Claude later (as the original doc notes) without touching business logic. This also gives you one place to enforce cost logging, retries, and output validation. |
| **Structured output enforcement** | Roadmap/topic/resource generation must return validated JSON (use a schema validator like Zod against the LLM response) before it's written to the database. Unvalidated LLM output going straight into `resources.video` / `resources.documentation` fields is the single biggest quality risk in this product. |

### 2.5 Search / External Resource Data *(recommended addition — not in original doc)*

| Choice | Reasoning |
|---|---|
| **YouTube Data API + a lightweight web-verification step** | The LLM should not "recall" a YouTube link from memory — it hallucinates URLs. Use the YouTube Data API to search/verify real playlists, and a fetch/HEAD-check on documentation URLs before persisting a resource. This directly protects the "curation quality" promise from the PRD. |

### 2.6 Payments *(needed once Premium ships — Should-Have, not MVP)*

| Choice | Reasoning |
|---|---|
| **Razorpay (primary, India-first) or Stripe** | Razorpay if the initial market is India-based college students (matches UPI/local payment preferences); Stripe if expanding internationally early. Don't build custom billing logic — use their subscription/webhook primitives. |

### 2.7 Hosting / Infra

| Choice | Reasoning |
|---|---|
| **Vercel** | Native Next.js deployment, preview environments per PR (valuable for a fast-moving small team), generous free tier for MVP traffic. |
| **Supabase (hosted)** | Managed Postgres, no DB ops burden at this stage. |

### 2.8 Observability & Monitoring *(recommended addition)*

| Choice | Reasoning |
|---|---|
| **Sentry** | Error tracking across frontend + API routes — cheap to add, high value once real users hit edge cases in AI generation. |
| **PostHog or Vercel Analytics** | Product analytics for the success metrics defined in the PRD (activation, engagement, retention funnels) — needs to be wired in from week one, not retrofitted. |
| **A simple AI cost/usage log table** (see Section 4) | LLM API costs scale with usage in ways that surprise founders. Log every AI call's token count and cost against `user_id` from day one so you can see cost-per-user before it becomes a problem. |

---

## 3. Project File & Folder Structure

```
marg-ai/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (marketing)/               # Public, SSG/SSR pages
│   │   │   ├── page.tsx                  # Landing page
│   │   │   ├── pricing/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (app)/                     # Authenticated app, requires session
│   │   │   ├── assessment/page.tsx        # AI Assessment flow
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── roadmap/
│   │   │   │   ├── page.tsx               # Full roadmap view
│   │   │   │   └── [topicId]/page.tsx     # Topic detail (resources, mindmap, summary)
│   │   │   ├── chat/page.tsx              # AI Doubt Solver (full view)
│   │   │   ├── profile/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx                 # Auth guard + shared dashboard nav
│   │   │
│   │   └── api/                       # Route Handlers
│   │       ├── assessment/route.ts        # Submit assessment answers
│   │       ├── roadmap/
│   │       │   ├── generate/route.ts      # Trigger roadmap generation job
│   │       │   └── [id]/route.ts
│   │       ├── topics/[id]/
│   │       │   ├── complete/route.ts      # Mark topic complete, trigger mindmap+summary job
│   │       │   └── route.ts
│   │       ├── chat/route.ts              # Doubt solver endpoint
│   │       ├── resources/verify/route.ts  # Resource verification webhook/job
│   │       ├── webhooks/
│   │       │   ├── payments/route.ts
│   │       │   └── supabase/route.ts
│   │       └── jobs/                      # Background job triggers/callbacks
│   │
│   ├── components/
│   │   ├── ui/                        # Shadcn primitives
│   │   ├── dashboard/                 # Dashboard widgets (TodayTopic, ProgressBar, etc.)
│   │   ├── roadmap/                   # RoadmapView, TopicCard, TimelineView
│   │   ├── chat/                      # ChatWindow, MessageBubble
│   │   ├── assessment/                # QuestionStep components
│   │   └── shared/                    # Nav, ThemeProvider (Blue/Gold), Footer
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                  # Browser client
│   │   │   ├── server.ts                  # Server client (RLS-aware)
│   │   │   └── admin.ts                   # Service-role client (background jobs only)
│   │   ├── ai/
│   │   │   ├── provider.ts                # Abstraction over Gemini/OpenAI
│   │   │   ├── prompts/                   # Versioned prompt templates
│   │   │   │   ├── generateRoadmap.ts
│   │   │   │   ├── generateMindmap.ts
│   │   │   │   ├── generateSummary.ts
│   │   │   │   └── doubtSolver.ts
│   │   │   ├── schemas.ts                 # Zod schemas validating AI JSON output
│   │   │   └── costLogger.ts
│   │   ├── resources/
│   │   │   ├── youtubeSearch.ts
│   │   │   └── urlVerification.ts
│   │   ├── jobs/                      # Background job definitions (Inngest/Trigger.dev)
│   │   └── utils/
│   │
│   ├── types/                         # Shared TypeScript types (mirrors DB schema)
│   ├── hooks/                         # useRoadmap, useProgress, useChat (React Query wrappers)
│   └── styles/
│
├── supabase/
│   ├── migrations/                    # SQL migration files (source of truth for schema)
│   └── seed.sql                       # Seed data for local dev (sample roadmap, topics)
│
├── public/
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**Key structural decisions worth calling out:**
- **Route groups** `(marketing)`, `(auth)`, `(app)` separate concerns cleanly: different layouts, and the `(app)` group is where you enforce the auth guard once, in one layout file, rather than per-page.
- **`lib/ai/` is isolated from `app/api/`** — routes call into this layer, they don't contain prompt logic directly. This is what makes provider-swapping and prompt versioning possible without a rewrite.
- **`lib/supabase/admin.ts` (service role) is only ever imported by background jobs, never by route handlers that respond directly to user requests** — this is a security boundary, not just an organizational one.

---

## 4. Database Schema

All tables use PostgreSQL via Supabase, with Row Level Security enabled on every user-scoped table (a user can only read/write their own rows, enforced at the DB level).

### 4.1 `users`
Extends Supabase's built-in `auth.users` with product-specific profile data.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK, FK → auth.users.id) | Same ID as the Supabase auth record |
| `name` | text | |
| `email` | text | Mirrored from auth for convenience/joins |
| `goal` | text | e.g., "Web Developer" — from Assessment Q1 |
| `level` | enum(`beginner`,`intermediate`,`advanced`) | From Assessment Q2 |
| `study_hours_per_day` | enum(`0.5`,`1`,`2`,`4+`) | From Assessment Q3 |
| `learning_style` | enum(`videos`,`reading`,`interactive`,`mixed`) | From Assessment Q4 |
| `primary_objective` | enum(`placement`,`internship`,`freelancing`,`projects`,`higher_studies`) | From Assessment Q5 |
| `plan` | enum(`free`,`premium`) | Default `free` |
| `created_at` | timestamptz | |

**In plain English:** this is one row per student, holding both their account info and the answers from onboarding. Every other table hangs off this one via `user_id`.

### 4.2 `roadmaps`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → users.id) | |
| `title` | text | e.g., "Python for Beginners" |
| `estimated_total_time` | text | e.g., "6 weeks" |
| `status` | enum(`generating`,`active`,`completed`,`archived`) | `generating` while the async AI job runs |
| `created_at` | timestamptz | |

**In plain English:** a roadmap is the AI-generated "course plan" for one student. MVP restricts each user to one active roadmap at a time (per the PRD's recommendation) — enforced in application logic, e.g. a partial unique index on `(user_id) WHERE status = 'active'`.

### 4.3 `topics`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `roadmap_id` | uuid (FK → roadmaps.id) | |
| `title` | text | e.g., "Loops" |
| `sequence_order` | int | Position within the roadmap |
| `difficulty` | enum(`easy`,`medium`,`hard`) | |
| `estimated_time` | text | e.g., "3 hours" |
| `prerequisites` | text[] or jsonb | References to other topic titles/ids |
| `learning_outcome` | text | |
| `status` | enum(`locked`,`available`,`in_progress`,`completed`) | Drives progress tracking |
| `week_number` | int | Maps topic to the timeline view |
| `mindmap` | jsonb (nullable) | Generated after completion; nullable until then |
| `summary` | jsonb (nullable) | Structured: explanation, key concepts, interview questions, common mistakes |
| `created_at` / `completed_at` | timestamptz | |

**In plain English:** a topic is one step in the roadmap (e.g., "Variables," "Loops," "OOP"). This table is the backbone of the roadmap view, the timeline, and progress tracking all at once — `sequence_order` + `week_number` drive the roadmap UI, `status` drives progress %.

### 4.4 `resources`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `topic_id` | uuid (FK → topics.id) | |
| `type` | enum(`video`,`documentation`,`practice`,`project`,`reading`) | |
| `title` | text | |
| `url` | text | |
| `source_platform` | text (nullable) | e.g., "YouTube", "LeetCode" |
| `verification_status` | enum(`unverified`,`verified`,`broken`) | Set by the URL verification job (Section 2.5) |
| `curation_method` | enum(`ai_generated`,`human_reviewed`) | Supports the human-in-the-loop review noted in Section 1 |
| `created_at` | timestamptz | |

**In plain English:** each topic has a small, fixed set of resource rows (not an open-ended list) — this table structurally enforces the product's "no information overload" promise, since the UI only ever renders what's in this table, one row per resource type per topic.

### 4.5 `progress` *(recommended addition — not explicit in original doc)*

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK) | |
| `roadmap_id` | uuid (FK) | |
| `topics_completed` | int | Denormalized counter for fast dashboard reads |
| `total_topics` | int | |
| `total_learning_hours` | numeric | Sum of time spent, if you track session time |
| `last_activity_at` | timestamptz | Powers the "resumption after gap" retention metric from the PRD |
| `updated_at` | timestamptz | |

**In plain English:** rather than computing "roadmap completion %" by counting `topics` rows on every dashboard load, this table keeps a running summary per roadmap. Cheap to read, updated whenever a topic's status changes.

### 4.6 `chat_history`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK) | |
| `topic_id` | uuid (FK, nullable) | Which topic the question relates to, if inferable |
| `question` | text | |
| `answer` | text | |
| `context_snapshot` | jsonb (nullable) | What roadmap/level/history was passed to the AI at answer-time — useful for debugging bad answers later |
| `created_at` | timestamptz | |

**In plain English:** every doubt-solver exchange, logged. `context_snapshot` is what makes this "not a generic chatbot" — it's the audit trail proving the AI actually used the student's roadmap context, and it's invaluable when you're debugging why an answer was wrong.

### 4.7 `assessments` *(recommended addition — not explicit in original doc)*

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK) | |
| `raw_answers` | jsonb | Full Q&A payload as submitted |
| `generated_profile` | jsonb | The AI's derived profile summary |
| `created_at` | timestamptz | |

**In plain English:** keep the raw assessment answers even though they're copied into `users`. This lets you re-run roadmap generation logic against historical answers, support re-assessment (Open Question #2 in the PRD), and audit "why did the AI put this student at this level."

### 4.8 `ai_usage_logs` *(recommended addition — not explicit in original doc)*

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK) | |
| `call_type` | enum(`roadmap_gen`,`mindmap_gen`,`summary_gen`,`doubt_solver`,`resource_curation`) | |
| `provider` | text | e.g., "gemini-1.5-pro" |
| `tokens_used` | int | |
| `estimated_cost_usd` | numeric | |
| `created_at` | timestamptz | |

**In plain English:** this is your early-warning system for unit economics. Without it, you won't know your cost-per-active-user until the bill arrives.

### 4.9 `subscriptions` *(Should-Have — needed when Premium ships)*

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK) | |
| `provider` | text | e.g., "razorpay" |
| `provider_subscription_id` | text | |
| `status` | enum(`active`,`cancelled`,`past_due`) | |
| `current_period_end` | timestamptz | |

**In plain English:** kept separate from `users.plan` so `users.plan` remains the fast, simple field the app checks everywhere, while this table holds the messier billing-provider state, updated via webhook.

### 4.10 Relationships summary (plain English)

- One **user** has one **profile** (assessment answers baked into the `users` row) and, at MVP, **one active roadmap**.
- One **roadmap** has many **topics**, ordered by `sequence_order`.
- One **topic** has a small, fixed set of **resources** (one video, one doc, one practice link, one project — enforced by UI/business logic, not a hard DB constraint, in case a topic legitimately needs two practice links later).
- One **roadmap** has one **progress** summary row, kept in sync as topics complete.
- One **user** has many **chat_history** entries, optionally linked to the topic they were asking about.
- One **user** has many **ai_usage_logs** entries — every AI call, regardless of feature, logs here.
- One **user** has zero or one **subscription** (zero = free tier).

---

## 5. Environment Variables & Configuration Notes

### 5.1 Required environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # Safe for client, respects RLS
SUPABASE_SERVICE_ROLE_KEY=           # Server-only. NEVER expose to client. Bypasses RLS.

# Auth
NEXT_PUBLIC_SITE_URL=                # Used for OAuth redirect URLs
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=

# AI Provider
GEMINI_API_KEY=
# OPENAI_API_KEY=                    # Uncomment when/if added as fallback provider

# External resource verification
YOUTUBE_DATA_API_KEY=


# Observability
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

### 5.2 Configuration notes before you start building

1. **Never let `SUPABASE_SERVICE_ROLE_KEY` reach the client bundle.** Only import `lib/supabase/admin.ts` inside route handlers and background job files — never inside a `"use client"` component. Consider a lint rule or CI check to prevent accidental leakage.
2. **Enable RLS on every table before writing a single row of real user data**, not after. Retrofitting RLS onto a table that already has application code assuming open access is a common and painful migration.
3. **Version your AI prompts.** Store prompt templates as versioned files (`lib/ai/prompts/generateRoadmap.ts`), and log which prompt version produced each roadmap in `ai_usage_logs` or a dedicated column. When you improve a prompt, you need to know which existing roadmaps were generated by the old one.
4. **Validate all LLM JSON output with Zod (or similar) before writing to Postgres.** Treat the LLM as an untrusted input source, the same way you'd treat user form input — malformed or hallucinated structure should be rejected and retried, not silently persisted.
5. **Set hard timeouts and fallback states for AI generation jobs.** Roadmap/mindmap/summary generation should have a max retry count and a clear "generation failed, retry" UI state — don't leave a topic stuck in `generating` indefinitely.
6. **Decide your resource curation review policy before launch**, not as an afterthought: fully automated (`ai_generated`) is faster to ship but riskier for trust (per the PRD's core value prop); a lightweight human review queue for the first N roadmaps per domain is safer. The `curation_method` field on `resources` exists specifically so you can measure the difference later.
7. **Rate-limit the AI Doubt Solver and roadmap generation per user**, even on paid plans, to protect against cost blowouts from a single runaway session or bug (e.g., a frontend retry loop).
8. **Separate OAuth redirect URLs per environment** (local, preview/staging, production) in your Google Cloud Console config — a common early bug is OAuth working locally and breaking on the first Vercel preview deploy.
9. **Use Supabase migrations (`supabase/migrations/`) as the single source of truth for schema**, applied via CLI, rather than hand-editing tables in the Supabase dashboard — this keeps schema changes reviewable in PRs and reproducible across environments.
10. **Cache AI-generated resources aggressively.** If two students both start "Python Basics" at the "beginner" level, you likely don't need to regenerate resource recommendations from scratch — cache by `(topic_title, level)` or similar to cut both cost and latency. This becomes important quickly once you're past a handful of users.

---

## 6. Suggested Build Order (maps to PRD MVP scope)

1. Auth + `users` table + RLS policies
2. Assessment flow → `assessments` table → profile fields on `users`
3. AI roadmap generation (background job) → `roadmaps` + `topics`
4. Resource curation (AI + verification) → `resources`
5. Dashboard + progress tracking → `progress`
6. AI Doubt Solver → `chat_history`
7. `ai_usage_logs` wired in from step 3 onward, not bolted on at the end
8. Mind maps + summaries (Should-Have, once core loop is validated)
9. Subscriptions/Premium billing (Should-Have)

This order intentionally front-loads the AI usage logging and RLS/security setup, since both are far more expensive to retrofit than to build in from the start.
