# AI Workplace Productivity Assistant

**Workday Wordsmith Copilot** — a clean, modern SaaS web app that helps professionals automate everyday workplace tasks with AI: draft emails in seconds, get structured research briefs, and chat with an assistant that remembers your conversations.

**Live app:** https://workday-wordsmith-copilot.lovable.app
**Edit in Lovable:** https://lovable.dev/projects/12eddc7a-6e56-45d3-9f3c-735f826ad996

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Responsible AI](#responsible-ai)
- [Scripts](#scripts)
- [Deployment](#deployment)

---

## Features

### Smart Email Generator

Pick an email type (Follow-up, Meeting request, Project update, Introduction, Thank you, Request for help, Apology, Announcement, Feedback, Custom), the recipient and your relationship to them (Colleague, Manager, Direct report, Executive, Client, Vendor / partner, Candidate, New contact), a tone (Professional, Friendly, Formal, Persuasive, Concise, Empathetic) and a length (Short / Medium / Detailed). Add your key points and get a draft with a subject line.

### AI Research Assistant

Enter a topic and optional key question, then choose an audience (Executive leadership, My team, Technical specialists, Clients / stakeholders, General audience), a depth (Quick overview, Standard brief, Deep dive), focus areas (Key concepts, Current trends, Pros & cons, Risks & challenges, Best practices, Market landscape, Key statistics, Action steps) and an output format (Executive brief, Bullet summary, SWOT analysis, Comparison table). Every brief ends with a **"What to verify"** section.

> The research assistant answers from general knowledge and does **not** search the live web — it is told never to fabricate sources, links or statistics.

### AI Chat

Unlimited separate conversations, each saved to your account. Replies stream in token by token, the conversation list is always available (a slide-over sheet on phones), and deleting a conversation removes its messages with it.

### Dashboard

A greeting with your name, quick links into each tool, counts of your saved work, a 7-day activity chart, and your most recent emails, briefs and conversations.

### Structured, editable prompts

The email and research tools show exactly what is sent to the AI, in a fixed five-part framework:

```text
ROLE → CONTEXT → TASK → REQUIREMENTS → OUTPUT FORMAT
```

You can edit that prompt before generating, then reset it back to the generated version at any time.

### Editable outputs

Every draft is fully editable. On top of that: one-click refine presets (e.g. "Shorter", "More formal"), a free-text refine box, undo of the last AI change, copy, download (`.txt` for emails, `.md` for briefs), regenerate, and start-new.

### Saved work and settings

Drafts save to your account and reopen from the library or a `?doc=` link. Your display name and job title (Settings) fill in the sign-off on generated emails.

### Responsive and accessible

Collapsible icon sidebar, mobile sheet navigation, dark mode tokens, and keyboard-friendly shadcn/ui components throughout.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | TanStack Start v1 (React 19, Vite 8, file-based routing, SSR) |
| Language | TypeScript (strict, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`) |
| Styling | Tailwind CSS v4 (`@theme` tokens in `src/styles.css`), shadcn/ui + Radix UI |
| Fonts | Sora (display) · Manrope (body) |
| Backend | Lovable Cloud (Supabase): auth, Postgres with row-level security, realtime |
| Auth | Email/password, Google, Sign in with Lovable |
| AI | Lovable AI Gateway (`@lovable.dev/ai-gateway`), model `openai/gpt-6-astra` |
| Chat streaming | AI SDK (`ai`, `@ai-sdk/react`) UI message stream |
| Data fetching | TanStack Query |
| Charts | Recharts |
| Toasts | Sonner |
| Testing | Vitest + Testing Library |

---

## Getting started

### Prerequisites

- Node.js 20+ (and npm, or [bun](https://bun.sh))
- A Lovable Cloud backend (already connected to this repository)

### Install and run

```sh
git clone <this-repository-url>
cd workday-wordsmith-copilot
npm install        # or: bun install
npm run dev        # or: bun run dev
```

The dev server runs at http://localhost:8080.

### Build and preview

```sh
npm run build
npm run preview
```

### Lint, format, test

```sh
npm run lint
npm run format
npm run test         # vitest run
npm run test:watch
```

---

## Environment variables

Server-side (read only inside server handlers, never in browser code):

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_PROJECT_ID=
```

Browser-side (exposed to the client bundle):

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

These are generated and maintained by Lovable Cloud — do not edit `src/integrations/supabase/*` or `.env` by hand. Secrets such as `LOVABLE_API_KEY` are managed in Lovable's secret store and must never be committed or read from browser code.

---

## Project structure

```text
src/
├─ components/
│  ├─ ai-elements/          # conversation, message, prompt-input, shimmer
│  ├─ ui/                   # shadcn/ui primitives
│  ├─ app-shell.tsx         # sidebar shell for signed-in pages
│  ├─ app-sidebar.tsx       # navigation + account menu
│  ├─ generator-workspace.tsx  # shared email/research workspace
│  ├─ structured-prompt.tsx # visible, editable prompt
│  ├─ saved-documents.tsx   # document library
│  ├─ responsible-ai-notice.tsx
│  ├─ brand.tsx, page-header.tsx
│  └─ chat/thread-list.tsx
├─ integrations/
│  ├─ lovable/
│  └─ supabase/             # generated clients (do not edit)
├─ lib/
│  ├─ ai.server.ts          # model, system prompts, responsible-AI rules
│  ├─ ai.functions.ts       # generateContent / refineContent server functions
│  ├─ prompts.ts            # structured prompt builders + title derivation
│  ├─ queries.ts            # TanStack Query options
│  └─ utils.ts
├─ routes/
│  ├─ __root.tsx            # html shell, fonts, meta, toaster
│  ├─ index.tsx             # landing page
│  ├─ auth.tsx              # sign in / sign up / reset
│  ├─ reset-password.tsx
│  ├─ api/chat.ts           # streaming chat server route
│  └─ _authenticated/       # client-only gated app pages
│     ├─ route.tsx          # auth gate + AppShell
│     ├─ dashboard.tsx
│     ├─ email.tsx
│     ├─ research.tsx
│     ├─ chat.tsx           # layout with thread list
│     ├─ chat.index.tsx     # open newest thread or create one
│     ├─ chat.$threadId.tsx
│     ├─ responsible-ai.tsx
│     └─ settings.tsx
├─ styles.css               # Tailwind v4 theme tokens + utilities
├─ test/                    # vitest suites
├─ router.tsx, start.ts, server.ts
drizzle/migrations/         # schema migration
supabase/config.toml        # managed config
```

---

## Architecture

### Routing

TanStack Start file-based routing. `src/routeTree.gen.ts` is auto-generated — never edit it. The root layout is `src/routes/__root.tsx`; a `src/routes/_app/index.tsx` or Next.js-style layout is not used.

| Path | Page |
| --- | --- |
| `/` | Landing page (aware of whether you're signed in) |
| `/auth` | Sign in / sign up / forgot password |
| `/reset-password` | Set a new password |
| `/dashboard` | Overview |
| `/email` | Email generator (`?doc=<id>` opens a saved draft) |
| `/research` | Research assistant (`?doc=<id>` opens a saved brief) |
| `/chat` | Redirects to your newest conversation |
| `/chat/$threadId` | A conversation |
| `/responsible-ai` | Guidelines |
| `/settings` | Name, job title, account |

### Authentication

The Supabase session lives in browser storage, so the gate for signed-in pages runs client-side: `src/routes/_authenticated/route.tsx` is `ssr: false`, redirects to `/auth` when there is no session, and renders the sidebar shell. Server functions that need the user call `requireSupabaseAuth`, and `src/start.ts` registers a client-side `functionMiddleware` (`attachSupabaseAuth`) that attaches the bearer token.

### AI calls

All model calls go through `@lovable.dev/ai-gateway`, imported **dynamically inside server handlers only**:

- `src/lib/ai.functions.ts` — `generateContent` and `refineContent` server functions (auth required, zod-validated, return `{ ok, text } | { ok: false, error }`).
- `src/routes/api/chat.ts` — POST handler that verifies the bearer token with `getClaims`, confirms the thread belongs to the caller, stores the user's message, rebuilds the full history from the database, then streams the reply.

Shared system prompts, the responsible-AI rule set, output extraction and friendly error messages live in `src/lib/ai.server.ts`. Keeping the SDK behind dynamic imports keeps it out of the browser bundle and gives one source of AI behaviour.

### Prompts

`src/lib/prompts.ts` builds every email and research prompt client-side in the fixed `ROLE → CONTEXT → TASK → REQUIREMENTS → OUTPUT FORMAT` shape, so the user can read and edit it before sending. `deriveTitle()` names saved documents from the email subject or the brief's first heading.

---

## Data model

All application tables live in `public`, are granted to `authenticated`, and have row-level security so users only ever see their own rows.

| Table | Purpose | Key columns |
| --- | --- | --- |
| `profiles` | One row per user, created on signup by a trigger | `id → auth.users`, `display_name`, `job_title` |
| `documents` | Saved emails and research briefs | `user_id`, `kind` (`email` \| `research`), `title`, `inputs jsonb`, `prompt`, `content` |
| `chat_threads` | One row per conversation | `user_id`, `title` (default "New conversation") |
| `chat_messages` | Messages in a thread | `thread_id` (FK, `ON DELETE CASCADE`), `user_id`, `message_id`, `role`, `parts jsonb`, `UNIQUE(thread_id, message_id)` |

`documents` and `chat_threads` keep `updated_at` current via a trigger; `chat_messages` is indexed on `(thread_id, created_at)` and `documents` on `(user_id, kind, updated_at DESC)`.

---

## Responsible AI

- A disclaimer appears on every AI tool, and full guidelines live at `/responsible-ai`.
- Every system prompt embeds the same rules: no invented facts, statistics, quotes, names, URLs or citations; assumptions marked for verification; no sensitive personal data; no discriminatory, biased or manipulative language; refusal of deceptive, harmful or illegal requests; no definitive legal, medical, financial or HR decisions.
- Research briefs always close with a **"What to verify"** list.
- All AI output is editable before it is saved, copied or downloaded — the human stays in the loop.

---

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over the whole project |
| `npm run format` | Prettier write |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |

---

## Deployment

This repository is connected to Lovable, which builds and publishes the app and manages the Cloud backend, migrations, auth providers and secrets. Pushing to the connected branch syncs the code back into the Lovable editor.

Prefer to self-host? Build with `npm run build` and serve the output from any Node-capable host, providing the environment variables above. Keep the AI gateway key server-side only.

---

## Notes for contributors

- Do not edit generated files: `src/routeTree.gen.ts`, `src/integrations/supabase/*`, `src/generated/ai-gateway/*`, `.env`, `supabase/config.toml`.
- Do not add or edit `drizzle/` or `supabase/migrations/` by hand — ask for a schema change through Lovable.
- Every new public table needs grants plus row-level security policies, or it is unreadable.
- Every AI feature must keep a visible responsible-AI notice and an editable output.

Built with [Lovable](https://lovable.dev).
