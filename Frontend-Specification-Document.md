# Marg AI — Frontend Specification Document
### Design System + Third-Party API & Integration Spec

*Prepared for: Marg AI founding & engineering team*
*Purpose: A single source of truth a designer or developer can open and build from without guessing — covering visual design rules and exactly how every external service is wired in.*

---

# PART A — DESIGN SYSTEM

## A1. Design Philosophy

Marg AI's visual identity is: **Dark-first, glassmorphic, minimal, single-accent-per-plan.**

- **Dark First** — the app defaults to a near-black canvas; nothing is designed "light-mode first and inverted."
- **Glassmorphism** — panels are translucent, blurred, and layered rather than flat/opaque.
- **Single Accent Color Based on Plan** — Free students see the product in **Cyan**, Premium students see it in **Gold**. This is not just a color skin — it's the core way we visually communicate "you're on Premium" throughout the entire UI, not just on a pricing page.
- **Minimal UI, Soft Neon Glow** — clean layouts with restrained detail; the glow effect is used sparingly (primary actions, active states) rather than everywhere, or it stops feeling premium and starts feeling noisy.
- **Rounded, Soft Geometry** — 18–24px radii throughout; no sharp corners anywhere in the product.

---

## A2. Color System

### A2.1 Background Colors
| Usage | Hex / Value |
|---|---|
| Primary Background | `#050608` |
| Secondary Background | `#0A0C10` |
| Sidebar | `#0E1117` |
| Card Background | `rgba(255,255,255,0.04)` |
| Glass Background | `rgba(255,255,255,0.06)` |
| Hover Background | `rgba(255,255,255,0.08)` |

### A2.2 Free Theme — Cyan
| Token | Value |
|---|---|
| Primary | `#00D9FF` |
| Secondary | `#3B82F6` |
| Hover | `#38BDF8` |
| Glow | `rgba(0,217,255,0.35)` |
| Gradient | `#00D9FF → #2563EB` |

### A2.3 Premium Theme — Gold
| Token | Value |
|---|---|
| Primary | `#FACC15` |
| Secondary | `#F59E0B` |
| Hover | `#FFD54A` |
| Glow | `rgba(250,204,21,0.35)` |
| Gradient | `#FFD700 → #F59E0B` |

### A2.4 Neutral / Text Colors
| Usage | Hex / Value |
|---|---|
| White | `#FFFFFF` |
| Text Primary | `#F3F4F6` |
| Text Secondary | `#9CA3AF` |
| Text Muted | `#6B7280` |
| Border | `rgba(255,255,255,0.08)` |
| Divider | `rgba(255,255,255,0.05)` |

### A2.5 Status Colors
| Status | Hex |
|---|---|
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |
| Info | `#3B82F6` |

**Rule:** Status colors never change based on plan — an error is always red, success always green, regardless of whether the student is Free or Premium. Only the *accent* color (buttons, active states, glows) switches by plan.

### A2.6 Background Gradients
```css
/* Free (Blue) Theme */
background:
  radial-gradient(circle at top, rgba(0,217,255,.15), transparent 55%),
  #050608;

/* Premium (Gold) Theme */
background:
  radial-gradient(circle at top, rgba(250,204,21,.15), transparent 55%),
  #050608;
```
This radial glow sits behind the entire app shell (applied once at the top-level layout), not repeated per-page.

---

## A3. Typography

**Font family:** Plus Jakarta Sans (single font family across the whole product — headings, body, buttons, everything). Load via `next/font/google` for performance rather than a CDN `<link>`, so it's optimized automatically by Next.js.

### A3.1 Type Scale
| Style | Size | Default Weight |
|---|---|---|
| Display / Hero | 64px | 700 |
| H1 | 48px | 700 |
| H2 | 36px | 700 |
| H3 | 28px | 600 |
| H4 | 22px | 600 |
| Body Large | 18px | 400 |
| Body | 16px | 400 |
| Small | 14px | 400 |
| Caption | 12px | 500 |

### A3.2 Font Weights Available
Light 300 · Regular 400 · Medium 500 · SemiBold 600 · Bold 700 · Extra Bold 800

### A3.3 Usage Rules
- Headings (H1–H4) always use SemiBold (600) or Bold (700) — never Regular.
- Body copy is always Regular (400); use Medium (500) only for emphasis inline (e.g. a key term), never for full paragraphs.
- Captions (12px) are reserved for timestamps, helper text under inputs, and metadata — never for primary content a student needs to read to use the product.
- Line height: 1.5 for body text, 1.2 for headings (tighter, since large text needs less breathing room per line).
- Never go below 14px for anything interactive (buttons, labels, nav items) — 12px is caption-only, for accessibility/readability on mobile.

---

## A4. Spacing, Radius & Layout Rules

### A4.1 Spacing Scale
| Token | Value | Used for |
|---|---|---|
| Section Spacing | 120px | Vertical gap between major landing-page/dashboard sections |
| Card Padding | 24px | Internal padding inside any card |
| Component Gap | 16px | Default gap between sibling elements (buttons in a row, list items, form fields) |
| Button Padding | 14px 24px | Internal padding for standard buttons |

**Additional rules to fill in the gaps:**
| Token | Value | Used for |
|---|---|---|
| Micro Gap | 8px | Tight groupings — icon + label, badge + text |
| Page Gutter (Desktop) | 80px | Left/right margin on wide screens |
| Page Gutter (Tablet) | 40px | Left/right margin, 768–1024px |
| Page Gutter (Mobile) | 20px | Left/right margin, below 768px |
| Max Content Width | 1280px | Content never stretches edge-to-edge on large monitors |

### A4.2 Grid & Breakpoints
| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 768px | Single column, stacked cards, bottom nav or hamburger menu |
| Tablet | 768–1023px | 2-column grid where applicable (e.g. dashboard widgets) |
| Desktop | 1024–1439px | 3-column grid, sidebar visible |
| Large Desktop | ≥ 1440px | Same 3-column grid, content capped at 1280px, extra space becomes margin |

### A4.3 Border Radius
| Element | Radius |
|---|---|
| Buttons | 14px |
| Cards | 24px |
| Inputs | 18px |
| Avatar | 50% (fully circular) |
| Modals | 24px (matches cards) |
| Badges / Pills | 999px (fully rounded) |

### A4.4 Shadows & Glow
| Theme | Value |
|---|---|
| Blue Glow | `0 0 30px rgba(0,217,255,.18)` |
| Gold Glow | `0 0 30px rgba(250,204,21,.18)` |

**Rule:** Glow is applied only to: the primary CTA button, the active/selected nav item, and the "current topic" highlight on the roadmap. It is never applied to every card on a page — that dilutes the effect and hurts readability.

### A4.5 Glass Effect (standard recipe)
```css
background: rgba(255,255,255,.05);
backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,.08);
```

### A4.6 Animation
| Property | Value |
|---|---|
| Standard Duration | 0.3s |
| Hover Scale | 1.03 |
| Card Hover Lift | `translateY(-5px)` |
| Glow Transition | opacity 0% → 100% |
| Library | Framer Motion |

**Rule:** Every interactive element (buttons, cards, nav items) should have *some* transition — nothing should snap instantly. But keep every transition at or near 0.3s; wildly different speeds across the app feel inconsistent.

### A4.7 Icons
- Library: **Lucide React**
- Default stroke width: 1.5–2px (thin, matches the minimal aesthetic)
- Default size: 20px inline with text, 24px standalone (nav/buttons), 32–40px for empty-state illustrations

---

## A5. Component Specifications

### A5.1 Buttons

**Primary Button**
| State | Free Theme | Premium Theme |
|---|---|---|
| Background | `#00D9FF` | `#FACC15` |
| Text Color | `#050608` | `#050608` |
| Hover Background | `#38BDF8` | `#FFD54A` |
| Hover Effect | scale 1.03 + glow fade-in | scale 1.03 + glow fade-in |
| Disabled | Background at 40% opacity, no hover effect, cursor not-allowed | same |
| Padding | 14px 24px | same |
| Radius | 14px | same |
| Font | 16px, SemiBold (600) | same |

**Secondary Button**
| State | Value |
|---|---|
| Background | transparent |
| Border | `1px solid rgba(255,255,255,.08)` |
| Text | `#F3F4F6` |
| Hover Background | `rgba(255,255,255,.05)` |
| Padding / Radius | Same as primary (14px 24px / 14px) |

**Destructive Button** *(new — needed for actions like "Delete Account," "Cancel Subscription")*
| State | Value |
|---|---|
| Background | transparent |
| Border | `1px solid rgba(239,68,68,0.4)` |
| Text | `#EF4444` |
| Hover Background | `rgba(239,68,68,0.08)` |

**Rule:** Only one Primary button should appear per screen/section at a time — it represents the single most important action. Everything else is Secondary or a plain text link.

### A5.2 Inputs (Text fields, dropdowns, textareas) *(new — not in original spec, defined here to match the system)*

| Property | Value |
|---|---|
| Background | `rgba(255,255,255,0.04)` (matches Card Background) |
| Border (default) | `1px solid rgba(255,255,255,0.08)` |
| Border (focused) | `1px solid` accent color (`#00D9FF` Free / `#FACC15` Premium) + subtle glow (`0 0 12px` accent at 20% opacity) |
| Border (error) | `1px solid #EF4444` |
| Text Color | `#F3F4F6` |
| Placeholder Color | `#6B7280` (Text Muted) |
| Radius | 18px |
| Padding | 14px 16px |
| Helper text (below field) | 12px, Text Secondary `#9CA3AF`; turns `#EF4444` on error |
| Label (above field) | 14px, Medium (500), Text Primary |

**Rule:** Never rely on color alone to show an error — always pair the red border with a short text message below the field, for accessibility (colorblind users, screen readers).

### A5.3 Cards

| Property | Value |
|---|---|
| Background | `rgba(255,255,255,.05)` |
| Border | `1px solid rgba(255,255,255,.08)` |
| Backdrop Blur | 24px |
| Radius | 24px |
| Padding | 24px |
| Hover (interactive cards only, e.g. topic cards, roadmap steps) | `translateY(-5px)` + border brightens to accent color at 30% opacity |
| Non-interactive cards (e.g. static info panel) | No hover effect at all — hover motion implies clickability, so don't apply it where nothing happens on click |

### A5.4 Modals *(new — defined here to match the system)*

| Property | Value |
|---|---|
| Overlay | `rgba(5,6,8,0.7)` (Primary Background at 70% opacity) with `backdrop-filter: blur(4px)` on the page behind it |
| Modal Background | Same as Card (`rgba(255,255,255,.05)`, blur 24px) |
| Border | `1px solid rgba(255,255,255,.08)` |
| Radius | 24px |
| Max Width | 480px (standard confirmation/form modal), 720px (larger modals e.g. "Export Roadmap" preview) |
| Entry Animation | Fade in (opacity 0→1) + scale from 0.96 → 1, 0.3s |
| Exit Animation | Reverse of entry, 0.2s (slightly faster on the way out) |
| Close Behavior | Click outside modal, press Escape, or explicit "X" — always give all three, never trap a user unless it's a critical/blocking action (e.g. "Confirm account deletion") |
| Header | H4 (22px, SemiBold), Text Primary |
| Footer | Right-aligned button row: Secondary button (Cancel) on the left, Primary or Destructive button on the right |

**Rule:** Never stack two modals on top of each other. If a second confirmation is needed (e.g. "Are you sure?" after another modal), replace the content of the existing modal rather than opening a new one on top.

### A5.5 Progress Bar
| Element | Value |
|---|---|
| Track Background | `#1F2937` |
| Fill — Free | `#00D9FF` |
| Fill — Premium | `#FACC15` |
| Height | 8px (default), 4px (compact, e.g. inline in a card) |
| Radius | 999px (fully rounded ends) |
| Animation | Fill transitions smoothly (0.3–0.5s ease) whenever progress updates — never jumps instantly |

### A5.6 Chat Bubble (AI Doubt Solver)
| Role | Free Theme | Premium Theme |
|---|---|---|
| User bubble | `#00D9FF` background, `#050608` text | `#FACC15` background, `#050608` text |
| AI bubble | `#1A1D24` background, `#F3F4F6` text (same for both plans — the AI's own responses are always neutral, only the *user's* bubble reflects their plan color) |
| Bubble Radius | 18px, with the corner nearest the sender's avatar slightly less rounded (6px) to create a "speech" pointer effect |
| Max Width | 75% of the chat container width |
| Timestamp | 12px, Text Muted, shown on hover/tap rather than always-visible (keeps the chat visually clean) |

### A5.7 Status Badges *(new — needed for plan labels, topic status, etc.)*
| Type | Style |
|---|---|
| Success (e.g. "Completed") | `#22C55E` text on `rgba(34,197,94,0.12)` background |
| Warning (e.g. "In Progress") | `#F59E0B` text on `rgba(245,158,11,0.12)` background |
| Error (e.g. "Payment Failed") | `#EF4444` text on `rgba(239,68,68,0.12)` background |
| Info (e.g. "New") | `#3B82F6` text on `rgba(59,130,246,0.12)` background |
| Plan Badge — Free | `#00D9FF` text on `rgba(0,217,255,0.12)` background |
| Plan Badge — Premium | `#FACC15` text on `rgba(250,204,21,0.12)` background |
| Padding / Radius | 4px 12px / 999px (pill shape) |

---

## A6. Theme Switching Logic (Free vs Premium)

- The plan theme (Cyan vs Gold) should be driven by a single variable set at the app-shell level (e.g. a CSS custom property `--accent-color` and `--accent-glow`), read from the student's `plan` field on login — never hardcoded per-component.
- If a student's subscription lapses mid-session, the theme should visually revert to Free (Cyan) only after they've been notified — don't silently swap colors under them without explanation (see the Error Handling doc, Section 4.5).
- Do not let a student manually pick their theme independent of their actual plan — the color is a status indicator, not a preference toggle. (A separate light/dark mode toggle, if ever added, would be a different setting entirely — out of scope for now since the product is dark-first only.)

---

# PART B — THIRD-PARTY API & INTEGRATION SPECIFICATION

This section documents every external service Marg AI depends on: what it does, which endpoints get called, what data goes out, and what comes back. Treat this as the contract between your frontend, your backend, and the outside world.

## B1. Supabase (Auth + Database + Storage)

**What it does:** Supabase is the backbone of the app — it handles user accounts (Auth), stores all app data (Postgres Database), and can store files like exported PDFs (Storage).

### B1.1 Supabase Auth
| Item | Detail |
|---|---|
| Purpose | Sign-up, login, session management, password reset |
| Key endpoints (via Supabase JS SDK) | `auth.signUp()`, `auth.signInWithPassword()`, `auth.signInWithOAuth({provider:'google'})`, `auth.signOut()`, `auth.resetPasswordForEmail()`, `auth.onAuthStateChange()` |
| Data sent | Email, password (for email signup); OAuth redirect handles Google — no password ever touches your servers for Google users |
| Data received | A session object containing a JWT access token, a refresh token, and the user's ID (`user.id`), plus basic profile info (email, email-verified status) |
| Where the token goes | Stored securely by the Supabase SDK (httpOnly cookie via `@supabase/ssr` recommended for Next.js) and automatically attached to every subsequent database request |
| Failure responses to handle | `invalid_credentials`, `email_not_confirmed`, `user_already_exists`, `over_request_rate_limit` — map each to the plain-English messages defined in the Error Handling document |

### B1.2 Supabase Database (Postgres)
| Item | Detail |
|---|---|
| Purpose | Stores Users, Roadmaps, Topics, Resources, Chat History, Subscriptions |
| Key calls | Standard REST/JS SDK calls: `.from('roadmaps').select()`, `.insert()`, `.update()`, `.delete()`, filtered automatically by Row-Level Security policies (see the Security & Access document, Section 3) |
| Data sent | Structured JSON matching each table's schema (e.g. `{ user_id, title, estimated_time, status }` for a new roadmap) |
| Data received | The matching row(s) as JSON, or a Postgres error object (e.g. `row-level security policy violation`, `duplicate key value`) |
| Real-time (optional) | Supabase Realtime can push live updates to the dashboard (e.g. "roadmap generation complete") via `.channel().on('postgres_changes', ...)` — subscribe on the Topics table filtered by the student's own roadmap ID |

### B1.3 Supabase Storage
| Item | Detail |
|---|---|
| Purpose | Store generated PDF roadmap exports (Premium feature) and any user-uploaded assets (e.g. profile picture, if added later) |
| Key calls | `storage.from('exports').upload()`, `storage.from('exports').createSignedUrl()` |
| Data sent | The generated PDF file (binary), a target file path scoped to the student's user ID |
| Data received | A signed, time-limited URL the student can use to download the file — never a permanently public URL, since roadmap exports may contain personal data |

---

## B2. Google OAuth (Sign-In)

| Item | Detail |
|---|---|
| What it does | Lets students log in using their existing Google account instead of creating a new password |
| Integration path | Handled through Supabase Auth's built-in OAuth provider — you configure a Google Cloud OAuth Client ID/Secret inside the Supabase dashboard; you do not call Google's API directly from your frontend |
| Endpoint called (by Supabase, behind the scenes) | Google's OAuth 2.0 `/authorize` and `/token` endpoints |
| Data sent | Your app's redirect URL, requested scopes (`email`, `profile`) |
| Data received | An authorization code exchanged for the student's email, name, and profile picture, which Supabase converts into a normal Supabase session |
| Your responsibility | Register your production and preview domain URLs in the Google Cloud Console's "Authorized redirect URIs," or login will fail silently in production even though it works locally |

---

## B3. AI Provider(s) — Gemini API & OpenAI API

Marg AI's tech stack lists both — the realistic setup is: pick **one as primary** (Gemini is the cheaper, faster default for most of the roadmap/summary generation; OpenAI as a fallback or for specific tasks where its output quality is preferred, e.g. more nuanced doubt-solving). Below is written to cover both, since your stack lists both.

### B3.1 Gemini API (Google AI)
| Item | Detail |
|---|---|
| What it does | Powers roadmap generation, topic summaries, mind map structure generation, and can power the Doubt Solver |
| Endpoint | `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-[model-version]:generateContent` (confirm the current recommended model name in Google's docs before launch, since model names update over time) |
| Auth | API key passed as a query parameter or header — **never exposed to the frontend**; all calls go through your own Next.js API route, which holds the key server-side only |
| Data sent | A structured prompt containing: the student's profile (level, goal, hours/day, learning style), the specific task (e.g. "generate a 6-week roadmap for X"), and formatting instructions telling the model to return clean JSON |
| Data received | A JSON (or text) response containing the generated roadmap/summary/mind-map structure, which your backend validates before saving to Supabase (never save AI output directly without checking it's well-formed — see Error Handling doc, Section 4.3) |
| Rate/cost controls | Track token usage per request; enforce your own internal daily/monthly caps per student (especially Free plan) independent of Google's own rate limits, so costs stay predictable |

### B3.2 OpenAI API
| Item | Detail |
|---|---|
| What it does | Same category of tasks as Gemini — likely used as either the primary Doubt Solver engine or a fallback if Gemini fails/is rate-limited |
| Endpoint | `POST https://api.openai.com/v1/chat/completions` (or the Responses API, `POST https://api.openai.com/v1/responses`, depending on which the team standardizes on) |
| Auth | Bearer token (API key) in the `Authorization` header, server-side only, same rule as Gemini |
| Data sent | A messages array: system prompt (defines the AI's mentor persona + the student's current roadmap context), plus the student's question |
| Data received | The model's text response, plus usage metadata (tokens used) for cost tracking |
| Fallback logic | If Gemini times out or errors, the backend should retry once, then fall back to OpenAI (or vice versa) rather than showing the student an error immediately — see Error Handling doc, Section 4.4 |

**Important data-privacy note for both AI providers:** Only send what's needed for that specific request (the student's learning profile and question) — never send full account data, email, or payment info to either AI provider. Review each provider's data-retention policy (both offer options to opt out of using API data for model training) and select that opt-out, given this product handles data from students, some of whom may be minors.

---

## B4. Payment Provider *(not yet specified in your stack — required before Premium can launch)*

You have Free/Premium pricing defined but no payment processor listed yet. Recommendation: **Razorpay** if your primary market is Indian college students (better local payment methods — UPI, cards, netbanking), or **Stripe** if you expect a meaningfully global/international student base. Many early-stage Indian EdTech products end up using both eventually; pick one for launch.

| Item | Detail |
|---|---|
| What it does | Handles the actual charge, card storage, and subscription billing cycle — so you never touch raw card data |
| Key endpoints | Creating a subscription/order (`POST /v1/subscriptions` or `/v1/orders` depending on provider), verifying the payment signature server-side, and listening to webhooks for `payment.captured`, `subscription.activated`, `subscription.cancelled`, `payment.failed` |
| Data sent | Plan ID, student's user ID (as internal reference metadata — never send email/name unless required for invoicing), amount, currency |
| Data received | A payment/subscription status object; webhooks deliver the source of truth — **never upgrade a student to Premium based on a frontend "success" redirect alone**, always wait for the server-side webhook confirmation (see Error Handling doc, Section 4.5) |
| Security requirement | Verify every webhook's signature before trusting it — this confirms the request genuinely came from the payment provider and not a spoofed call |

---

## B5. YouTube Data API *(recommended addition — needed to reliably power "Best Video" recommendations)*

| Item | Detail |
|---|---|
| What it does | Lets you verify a recommended video/playlist still exists, is not private/deleted, and pull its current title/thumbnail rather than hardcoding stale data |
| Endpoint | `GET https://www.googleapis.com/youtube/v3/videos?part=status,snippet&id={video_id}` |
| Auth | API key, server-side only |
| Data sent | The video or playlist ID stored in your Resources table |
| Data received | Video status (public/private/deleted), title, thumbnail — used in a periodic background job to flag broken links (ties directly into Error Handling doc, Section 4.3) |

---

## B6. Email Delivery *(recommended addition — needed for verification, OTP, password reset, and billing notices)*

Supabase Auth includes basic email sending, but for reliable delivery at scale (and better-looking emails), most teams pair it with a dedicated provider such as **Resend** or **SendGrid**.

| Item | Detail |
|---|---|
| What it does | Sends verification emails, OTP codes, password reset links, subscription receipts, and card-expiry warnings |
| Endpoint (example: Resend) | `POST https://api.resend.com/emails` |
| Data sent | Recipient email, template ID or HTML body, dynamic fields (student name, verification link/OTP code) |
| Data received | A delivery confirmation ID, or an error (invalid address, delivery failure) to log and retry |

---

## B7. Error Monitoring *(recommended addition)*

| Item | Detail |
|---|---|
| What it does | Captures backend and frontend errors in real time so your team knows about failures before students report them |
| Suggested tool | Sentry |
| Integration | SDK installed in both the Next.js frontend and API routes; automatically reports unhandled exceptions with stack traces, user context (anonymized — no personal data in error logs), and the request that caused it |
| Data sent | Error stack trace, route/URL, timestamp, anonymized user ID (never email or personal details) |

---

## B8. Deployment — Vercel

| Item | Detail |
|---|---|
| What it does | Hosts the Next.js frontend and API routes, handles CI/CD from your Git repository |
| Integration | Connect the GitHub repo; environment variables (Supabase keys, Gemini/OpenAI keys, payment provider keys, email provider keys) are set in Vercel's dashboard — **never committed to the codebase** |
| Note | All server-side-only keys (AI provider keys, payment secret keys) must be added as standard environment variables, not `NEXT_PUBLIC_` variables — the `NEXT_PUBLIC_` prefix exposes a variable to the browser, which would leak your keys |

---

## B9. Summary Table — All Integrations at a Glance

| Service | Purpose | Calls Made From |
|---|---|---|
| Supabase Auth | Login, signup, sessions | Frontend (via SDK) |
| Supabase Database | All app data, protected by RLS | Frontend (via SDK, RLS-enforced) + Backend |
| Supabase Storage | PDF exports | Backend only |
| Google OAuth | Social login | Supabase (configured, not called directly) |
| Gemini API | Roadmap/summary/mindmap generation | Backend (Next.js API routes) only |
| OpenAI API | Doubt Solver / fallback AI | Backend only |
| Payment Provider (Razorpay/Stripe) | Subscription billing | Backend only, webhook-verified |
| YouTube Data API | Validate resource links | Backend (background job) |
| Email Provider (Resend/SendGrid) | Transactional email | Backend only |
| Sentry | Error monitoring | Frontend + Backend |
| Vercel | Hosting & deployment | N/A (infrastructure) |

**Golden rule across every integration:** No API key for any of these services should ever be visible in frontend code, browser network tabs, or a public Git repository. Every third-party call that requires a secret key is routed through your own backend (Next.js API routes), which then talks to the external service — the browser only ever talks to your own backend or to Supabase (which is designed to be safely called from the browser because of Row-Level Security).

---

*This document works hand-in-hand with the Security & Access Document — the design system here defines what students see, while that document defines what they're allowed to see and touch. Update both together whenever a new feature, role, or integration is added.*
