# Product Requirements Document: Marg AI

**Tagline:** Stop Searching. Start Learning.
**Document Owner:** Product
**Status:** Draft v1.0
**Last Updated:** July 2026

---

## 1. Executive Summary

Marg AI is an AI-powered learning mentor for students and self-learners. Instead of leaving learners to sift through thousands of scattered resources (YouTube, courses, docs, blogs, GitHub repos), Marg AI assesses a learner's current level and goals, then generates a single, personalized roadmap with curated resources, timelines, mind maps, and an on-demand AI tutor that understands exactly where the student is in their journey.

The core bet: **curation and personalization beat unlimited access.** We are not building a search engine or a content aggregator — we are building a mentor.

---

## 2. Problem Statement

Learners today don't lack resources — they're drowning in them. For any given topic (e.g., Python), a student can find hundreds of videos, courses, and docs, but no clear answer to "what should I actually do next, given where I am?"

This leads to measurable, recurring pain:

| Symptom | Root Cause |
|---|---|
| Hours lost browsing/comparing resources | No single source of curated truth |
| Starting and abandoning multiple courses | No structured, sequenced path |
| Low confidence, no sense of progress | No visibility into "how far am I" |
| Generic doubt-solving (ChatGPT/Google) | No context on what the learner has already studied |
| Random, unstructured learning | No adaptive timeline tied to actual pace |

**Core insight:** The bottleneck isn't access to content — it's the *decision layer* on top of that content. Marg AI's job is to make that decision for the student, continuously, based on who they are and how they're progressing.

---

## 3. Target Users

| Segment | Primary Need |
|---|---|
| First-year college students | Structured onboarding into a field with zero prior context |
| Complete beginners / self-learners | A trusted starting point and sequence |
| Placement aspirants | Goal-driven, timeline-bound prep with interview readiness |
| Students switching domains | Fast, level-appropriate re-orientation without repeating basics they already know |

**Primary persona (MVP focus):** A first- or second-year engineering/college student in India, self-teaching a technical skill (e.g., Python, web dev) outside their curriculum, with 1–4 hours/day, motivated by placements or projects, currently overwhelmed by free content online.

We are explicitly **not** targeting enterprise L&D, K-12, or non-technical/creative skill domains in v1.

---

## 4. Goals & Non-Goals

**Goals for v1**
- Reduce the time between "I want to learn X" and "I'm actively, correctly studying X" to near-zero.
- Give every learner a single roadmap they trust enough to stop searching elsewhere.
- Make progress visible and motivating enough to reduce drop-off mid-course.

**Non-Goals for v1**
- Becoming a content host/creator (we curate, we don't produce video/course content).
- Replacing structured, accredited courses or certifications.
- Supporting every possible learning domain on day one (see Section 8, out of scope).

---

## 5. Core Features — MoSCoW Classification

### 5.1 Must-Have (MVP-critical)

| Feature | Description | Why it's must-have |
|---|---|---|
| **AI Assessment (Onboarding)** | 5-question flow: goal, current level, daily study hours, learning preference, primary objective | This is the input the entire product depends on — without it, nothing can be personalized |
| **Student Profile** | AI-generated summary: level, learning speed, goal, available time, preferred style | Persistent context used by every downstream feature (roadmap, doubt solver) |
| **Personalized Roadmap Generation** | AI-generated sequenced topic list with prerequisites, difficulty, estimated time, learning outcome | This is the core value proposition — the "single source of truth" path |
| **Curated Resource per Topic** | One best video/playlist, one official doc link, one practice platform, one mini-project | Directly solves the "information overload" problem — must stay tightly curated, not a list |
| **Timeline / Weekly Plan** | Auto-generated week-by-week schedule based on hours available | Converts an abstract roadmap into a daily habit |
| **Dashboard** | Current goal, today's topic, progress %, upcoming topic, quick AI chat | Primary retention surface — the "hub" a student returns to daily |
| **AI Doubt Solver (context-aware)** | Chat that has access to the student's roadmap/level/history when answering | Differentiator vs. generic ChatGPT use — must be context-aware from day one, not a bolt-on |
| **Progress Tracking** | Completed/current/remaining topics, roadmap completion % | Required for both motivation and adaptive timeline recalculation |
| **Auth (Login/Signup)** | Google OAuth + email login | Baseline requirement, no personalization possible without an account |
| **Free tier with usage caps** | Limited AI chat, limited roadmaps, basic resources | Needed to acquire users and validate demand before monetization push |

### 5.2 Should-Have (early post-MVP, high value)

| Feature | Description |
|---|---|
| **AI-generated Mind Maps** | Visual topic breakdown per completed topic, for revision |
| **AI Topic Summaries** | Short notes, key concepts, common mistakes, interview questions per topic |
| **Adaptive Timeline Recalculation** | Roadmap/timeline auto-adjusts based on actual completion pace, not just stated hours |
| **Premium tier (Gold)** | Unlimited AI, priority responses, advanced mind maps/summaries, PDF export |
| **Recent Activity / Learning Timeline widget** | Session history for motivation and habit reinforcement |

### 5.3 Nice-to-Have (v2+, defer)

| Feature | Description |
|---|---|
| OTP login | Additional login method, low marginal value over Google/email at launch |
| PDF export of roadmap | Convenience feature, not core to learning outcomes |
| Theme customization (beyond Free/Premium color) | Cosmetic |
| Multi-language support | Needed for scale, not for validating the core loop |
| Testimonials / social proof sections on landing page | Marketing polish, not product |
| Notifications system | Improves habit-forming but not required to prove the core value prop |
| AI preference settings | Fine-tuning, valuable once we know what needs tuning |

---

## 6. User Flow (Start to Finish)

```
Landing Page
    ↓  (Get Started)
Login / Sign Up  →  Google OAuth or Email
    ↓
AI Assessment (5 questions: goal, level, hours/day, learning style, objective)
    ↓
AI Analysis  →  Student Profile generated
    ↓
Personalized Dashboard (first-time state: roadmap ready, Week 1 highlighted)
    ↓
Roadmap View  →  student sees full sequenced topic list
    ↓
Select Topic  →  Curated Resources (video / docs / practice / mini-project)
    ↓
Complete Topic  →  Mind Map + AI Summary generated
    ↓
Stuck? → AI Doubt Solver (context-aware chat)
    ↓
Progress updates → Timeline recalculates → Dashboard reflects new state
    ↓
Repeat (next topic) → Roadmap completion → (future: certificate / next roadmap)
```

**Key UX principle:** the student should never need to leave the roadmap to figure out "what's next." Every screen should have an obvious next action.

---

## 7. MVP Scope

**MVP Definition:** The smallest version of Marg AI that proves a student will (a) complete the assessment, (b) trust and follow the AI-generated roadmap over browsing on their own, and (c) return to the dashboard repeatedly instead of dropping off.

### MVP includes:
- Landing page (Hero, Features, How It Works, Pricing, FAQ — no testimonials required)
- Auth: Google + Email login only
- AI Assessment (all 5 questions)
- Student Profile generation
- Roadmap generation (single domain to start — see recommendation below)
- Timeline generation (static weekly plan, recalculation can be simplified/manual in v1)
- Resource recommendation per topic (video, docs, practice, mini-project)
- Dashboard (core widgets only: current goal, today's topic, progress, quick AI chat)
- AI Doubt Solver, context-aware
- Progress tracking
- Free tier only (Premium tier can be scaffolded but gating logic is simple — hard usage caps, no billing polish required)

### MVP explicitly excludes:
- Mind maps and AI summaries (Should-Have, add immediately post-MVP)
- Premium billing/payment integration
- PDF export
- Notifications
- Multi-domain roadmap support at launch

**Recommendation:** Launch MVP supporting **1–2 tightly scoped learning tracks** (e.g., "Python for Beginners" and "Web Development Fundamentals") rather than the full open-ended "become an AI Engineer / Cyber Security / Data Scientist" goal set. This lets the team hand-validate/curate resource quality before trusting AI-generated curation across every domain — critical, since bad resource curation directly undermines the core value proposition (trust).

---

## 8. Out of Scope for Version 1 (Deliberately Not Building)

| Not Building | Reasoning |
|---|---|
| Full domain coverage (all 6+ career goals from assessment) | Curation quality > breadth; validate the model on 1–2 tracks first |
| Content hosting/creation (own videos, own courses) | Marg AI is a curation/mentorship layer, not a content studio — different business entirely |
| Certifications / accreditation | Out of core value prop; adds legal/credibility overhead with no MVP validation need |
| Team/cohort/social learning features (leaderboards, peer groups, study buddies) | Adds complexity before the single-player core loop is proven |
| Native mobile apps | Web-first (Next.js) is sufficient to validate; mobile is a scaling decision, not a v1 one |
| Multi-language support | English-first for initial target segment (Indian college students, tech skills) |
| Adaptive real-time re-planning (ML-driven pacing beyond simple recalculation) | Requires usage data we don't have yet; start with rule-based timeline adjustment |
| Enterprise/institutional accounts | Different sales motion, different feature set (admin dashboards, seat management) — post-PMF |
| Payment/subscription infrastructure beyond a hard free-tier cap | Don't build billing complexity before confirming willingness to pay |

---

## 9. Success Metrics

### 9.1 Activation
- **% of signups who complete the AI Assessment** (target: >70%) — measures whether the funnel into personalization works.
- **% of assessed users who view their generated roadmap** (target: >90%) — near-1:1 expected; a drop here signals assessment→roadmap trust issues.

### 9.2 Engagement (the core hypothesis: roadmap > random browsing)
- **Weekly Active Learners** (returned to dashboard and engaged with ≥1 topic in the last 7 days)
- **Topic completion rate** — % of started topics marked complete (proxy for "did the curated resource actually work")
- **Roadmap completion rate** — % of students who finish an entire roadmap (proxy for whether we solved "incomplete courses")
- **AI Doubt Solver usage per active user** — signals whether the mentor feature is actually being relied upon vs. ignored

### 9.3 Retention
- **D7 / D30 retention** of learners who completed onboarding
- **Roadmap resumption rate** — % of users who return to an in-progress roadmap after a >3 day gap (directly tests "wasted time / abandoned courses" problem)

### 9.4 Trust / Quality signal (leading indicator, qualitative + quantitative)
- **% of users who click through to an external, non-recommended resource** while inside a topic (a proxy for "our curation didn't satisfy them" — lower is better)
- **Self-reported confidence score** (simple in-app pulse survey at topic completion: "Did this resource help you understand the topic?")

### 9.5 Monetization (post-MVP, tracked from Should-Have launch onward)
- **Free-to-Premium conversion rate**
- **Reason for upgrade** (AI limit hit vs. feature desire — from cancellation/upgrade surveys)

**North Star Metric (proposed):** *Roadmap completion rate* — it's the single number that captures whether Marg AI is actually solving "incomplete courses" and "wasted time," which is the central problem statement.

---

## 10. Open Questions for the Team

1. How is resource curation actually sourced/verified — pure LLM generation, or LLM + a human/editorial review layer before a resource is shown to any student? (Quality here is existential to the product; recommend a hybrid approach at MVP.)
2. What happens when a student's stated level (self-reported in Assessment) doesn't match their actual performance in early topics? Is there a re-assessment trigger?
3. Single roadmap per user at a time, or can a user run multiple roadmaps in parallel (e.g., Python + DSA)? MVP should probably restrict to one active roadmap to reduce complexity and dilution of focus.
4. What's the fallback when the AI Doubt Solver can't answer confidently — silent best-effort, or explicit escalation/flagging?

---

## 11. Appendix: Reference Data Model (from concept doc)

- **Users:** id, name, email, goal, level, study_hours, learning_style
- **Roadmaps:** id, user_id, title, estimated_time, status
- **Topics:** id, roadmap_id, topic, summary, mindmap, resources
- **Resources:** id, topic_id, video, documentation, practice, project
- **Chat History:** id, user_id, question, answer

**Proposed Tech Stack (from concept doc, unvalidated by this PRD):** Next.js + TypeScript + Tailwind + Shadcn UI frontend; Next.js API Routes + Supabase/PostgreSQL backend; Supabase Auth + Google OAuth; Gemini API for AI layer; Vercel for deployment.
