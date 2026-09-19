# Steer — Personal Admission Route

LOCUS Startup Hackathon 2026, Case 02 (**LOCUSCASE2**).

## 1. Task

A Kazakhstani school student (grade 9–11) has no single place to turn "I want to study abroad"
into an actual plan. They don't know which programs realistically fit their grades, exam scores,
budget, and target countries, why one program suits them better than another, or what to actually
do — and by when — to get there.

## 2. Solution

Steer turns a short questionnaire into a **route**, not a list:

1. **Diagnosis** — a structured read of where the student stands: strengths, limitations, and the
   goal they answered, in plain language.
2. **Recommendations** — 3+ ranked programs, each with a 0–100 fit score, a Safety/Match/Reach
   label, a factor breakdown (field, budget, grades, exams, country, language), and an honest
   "why it fits you" sentence. Never a fabricated admission percentage.
3. **Compare** — 2–3 selected programs side by side, rows ordered by what *that student's own
   answers* weighted highest.
4. **Roadmap** — a dated, phase-grouped plan (exams → documents → deadlines → activities) with one
   clearly highlighted next action and progress tracking.

Edit budget, target countries, or an exam score from the profile drawer on any screen from step 3
onward, and the whole route recomputes live — this is the single most jury-visible feature.

Beyond the case's 7-step minimum: a program detail page (photos, campus-life note, full
requirement/cost breakdown, scholarship detail, sources), a favorites/bookmarks page independent
of the Compare selection, and a Timeline/Calendar toggle on the roadmap with a per-task `.ics`
download.

## 3. Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| Database | Supabase (Postgres) — `programs` + `profiles` tables |
| Engine | Plain TypeScript, deterministic, unit-tested (`apps/api/src/engine/`) |
| LLM | Claude (Anthropic API, `claude-3-haiku`) via `POST /api/explain` — phrasing only, template
      fallback if the key is missing, the call fails, or times out |
| Contract | `packages/shared/types.ts`, imported by both apps |
| Tests | Vitest — 69 frontend tests, 11 backend tests, all passing |

Two independent services over REST + CORS, each with its own codebase, so frontend and backend
could be built and deployed separately.

## 4. Architecture

```
apps/
  web/            Next.js frontend — the 7-step journey, profile drawer, favorites, program
                   detail, calendar. lib/api.ts is the mock/real-backend seam; lib/usePlanData.ts
                   is the hook every screen reads through (usePlan / usePrograms) — it calls the
                   real backend when NEXT_PUBLIC_API_BASE_URL is set and silently falls back to
                   the bundled mock engine + mock/programs.json on any failure, so no screen is
                   ever blank.
  api/            Express backend — engine/ (score → label → select → diagnosis → roadmap),
                   db/ (Supabase client + mappers), routes/ (plan, programs, profile, explain),
                   llm/ (Claude phrasing + template fallback).
packages/
  shared/types.ts THE CONTRACT — Answers, Program, Plan, Profile, etc. Both apps import from here;
                   never redefine these shapes locally.
supabase/
  schema.sql       programs + profiles tables.
docs/
  SPEC.md          Full product spec: journey, data model, engine formulas, API, honesty rules.
  PLAN.md          Stack rationale, git workflow, build order, definition of "MVP done".
```

The engine (`apps/api/src/engine/`) is a pure, network-free scoring pipeline: it weighs each
program against the student's answers on field match, budget, grades, exams, country, and
language, labels it Safety/Match/Reach, and generates the roadmap tasks — all deterministic and
unit-tested, so results are reproducible and explainable, never a black box.

## 5. Run instructions

There's no root package manager workspace — run each app from its own folder.

**Backend** (`apps/api`):
```
cd apps/api
npm install
cp .env.example .env        # fill in SUPABASE_URL / SUPABASE_ANON_KEY (see supabase/schema.sql)
npm run seed                 # upserts data/programs.json into Supabase
npm run dev                  # http://localhost:4000
```

**Frontend** (`apps/web`):
```
cd apps/web
npm install
cp .env.example .env.local   # optional — see below
npm run dev                  # http://localhost:3000
```

`NEXT_PUBLIC_API_BASE_URL` in `apps/web/.env.local` is **optional**. Set it to
`http://localhost:4000` to run against the real backend and Supabase; leave it unset to run
entirely against the bundled mock engine with zero setup. Either way the app is immediately
usable — this was a deliberate choice so frontend and backend development never blocked each
other (see `docs/PLAN.md` §4 "Integration checkpoints").

Tests: `npm test` in either `apps/web` or `apps/api`. Typecheck: `npx tsc --noEmit` in `apps/web`.

## 6. Jury test scenario

Matches `docs/SPEC.md` §5 "Definition of MVP done":

1. Land → start → questionnaire → diagnosis → 3+ recommendations with "why" → compare 2 →
   roadmap → next action visible.
2. Open the profile drawer, change **budget** → recommendations reorder/change.
3. Change **country**, add an **exam score** → labels or roadmap tasks change accordingly.
4. Tick the next action → progress % moves, next action advances.
5. Refresh the page → everything is still there. Open the saved-profile link (`/p/[id]`) in a new
   tab → same plan loads.
6. Every tuition/deadline figure shows a source link or a "demo data" badge.
7. With the LLM key removed, screens still render with template text — nothing blank or stuck.
8. No console errors on the main path. Mobile width (≥360px) doesn't break anything.

## 7. Roles

Two-person team:
- **Frontend/UX** — `apps/web`: the full 7-step journey, design system, profile drawer, favorites,
  program detail, calendar/ics, real-backend integration.
- **Backend (Altair)** — `apps/api` + Supabase + engine: program research, scoring/labeling/
  roadmap engine, REST API, LLM phrasing + fallback.

## 8. Sources

Program facts (tuition, deadlines, requirements) are sourced per-entry in `apps/api/data/programs.json`
via each program's own `source_url` field, shown as a source badge next to the figure on
Recommendations, Compare, and the program detail page. Where a real source wasn't confidently
found in time, the field is marked `data_status: "demo"` and rendered with an explicit "demo data"
badge instead of an invented number — see `docs/SPEC.md` §9 (honesty rules).

## 9. AI / API used

- **Claude (Anthropic API, `claude-3-haiku`)** via `apps/api/src/routes/explain.ts` +
  `src/llm/explain.ts` — takes the engine's already-computed facts (strengths, limitations,
  selected programs) and phrases them into natural-language diagnosis/why text. It never invents
  numbers; `src/llm/fallback.ts` renders template text whenever the API key is missing or the call
  fails/times out, so the product never depends on the LLM being available.
- The frontend currently generates its diagnosis/why-text itself via deterministic templates
  (`apps/web/lib/diagnosisText.ts`, `lib/whyText.ts`) rather than calling `/api/explain` — see
  Limitations.
- This README, code comments, and parts of the implementation were written with AI pair-programming
  assistance (Claude via Claude Code).

## 10. Disclosed ready-made components

- **shadcn/ui** — generated component primitives (`apps/web/components/ui/`), styled to this
  project's own design tokens.
- **Supabase** — hosted Postgres + client SDK (`@supabase/supabase-js`), not a custom database.
- **Anthropic SDK** (`@anthropic-ai/sdk`) for the `/api/explain` LLM call.
- No other scaffolding, templates, or boilerplate generators were used beyond `create-next-app`.

## 11. Limitations

- **Program data coverage**: `apps/api/data/programs.json` currently has a subset of the ~25
  spec'd programs (5 per country × 5 countries, across CS/Engineering/Business/Natural Sciences/
  Design) — ongoing work, not yet complete at submission time.
- **`/api/explain` isn't called by the frontend yet** — Diagnosis/Recommendations/ProgramDetail
  use their own template-based phrasing (`lib/diagnosisText.ts`, `lib/whyText.ts`), which already
  satisfies the "always renders, never invents numbers" rule without a network round-trip. Wiring
  real LLM phrasing in is the natural next step, not a blocker for the jury script.
- **No live deployment** — the team is submitting the repo directly rather than a hosted URL; see
  "Run instructions" above for local setup. Two services, no auth, so a fresh checkout is running
  in minutes.
- **`/p/[id]`** (returning-user link) resolves against `profileId` stored in `localStorage`, so it
  only works on the same device/browser that created it — no server-side profile lookup yet. The
  not-found state says this honestly rather than pretending otherwise.
- **No English UI toggle** — Russian-primary throughout, per `docs/SPEC.md` §1 (EN was a stated
  stretch goal, not MVP-blocking).
- **No retry/offline UI** beyond the automatic mock fallback described in Architecture — a failed
  real-backend call falls back silently to mock data with a small non-blocking notice, rather than
  offering a manual retry button.
