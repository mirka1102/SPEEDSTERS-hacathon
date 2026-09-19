# SPEEDSTERS — Personal Admission Route

LOCUS Startup Hackathon 2026, Case 02 (LOCUSCASE2). An AI service that turns a Kazakhstani
student's profile into a personalized university admission route: diagnosis → ranked program
recommendations with "why" → comparison → dated roadmap → one next action. Two-person team:
a frontend/UX dev and a backend dev.

**Read `docs/SPEC.md` and `docs/PLAN.md` before making any non-trivial change.** They are the
actual spec and build plan — this file is just the fast-orientation summary. If something here
and something there disagree, `docs/SPEC.md` / `docs/PLAN.md` win; update this file to match.

## Repo layout

```
apps/web/            Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui — frontend
apps/api/             Node + Express + TypeScript — backend
packages/shared/types.ts   THE CONTRACT — Answers, Program, Plan, Profile, etc.
supabase/             schema.sql
docs/SPEC.md          product spec: journey, data model, engine formulas, API, honesty rules
docs/PLAN.md          stack, git workflow, build order, definition of "MVP done", risks
```

## Commands

```
cd apps/web
npm run dev      # http://localhost:3000
npm run build    # production build + typecheck
npm run lint
```

See `apps/api/README.md` for backend setup commands.

## The one hard rule

**`packages/shared/types.ts` is the seam between the two apps.** Both import from it (`@shared/*`
in `apps/web`). Never redefine these shapes locally in either app. If it needs to change, message
the other person before merging.

## Git workflow (see `docs/PLAN.md` §3 for full detail)

- `main` is always runnable.
- Branch names: `feat/web-*` (frontend), `feat/api-*` (backend), `chore/*` for shared
  infra/scaffolding.
- Small commits, merge yourself after a quick self-check — no waiting on review.
- Never commit `.env` / `.env.local` (already gitignored). Keys go in local env / host env vars
  only.
- Commit often with real messages — the case's judging explicitly may check git history.

## Non-negotiable constraints (from the case, see `docs/SPEC.md` §9)

- Never show a fabricated "% chance of admission." Fit score + label only, with a disclaimer.
- Every factual number (tuition, deadline, min score) needs a source URL or an explicit `demo`
  badge — no invented precision.
- No auth, no payments, no course/lesson library — those are explicitly out of scope for this
  case.
- The LLM (`/api/explain`) only phrases the engine's already-computed facts; it never invents
  numbers. A templated fallback must always render if the LLM call fails or the key is missing —
  the demo can never stall or go blank.
- The one dev-time exception: `apps/api/scripts/enrich-programs.ts` (offline only, never called
  by the running app) may use an LLM with web search to fill gaps in the researched program data,
  but only when it finds a real source — otherwise the field stays `demo`.

## Current status

- **`apps/web` is feature-complete** against `docs/PLAN.md`'s full build order (all 17 steps):
  the whole 7-step journey (`/` → `/profile` → `/diagnosis` → `/recommendations` → `/compare` →
  `/roadmap`), the `ProfileDrawer` (edit budget/countries/exam scores from any screen 3+, plan
  recomputes live), `/program/[id]`, `/favorites`, `/p/[id]` (returning-user link), a
  Timeline/Calendar toggle with per-task `.ics` export. 69 Vitest tests, clean `tsc --noEmit`,
  clean `eslint`.
- **`apps/api` is built**: Express, engine (score/label/select/diagnosis/roadmap),
  Supabase db layer, routes for plan/programs/profile/explain, 11 Vitest tests. A live Supabase
  project is provisioned and seeded (`supabase/schema.sql` applied, `apps/api/data/programs.json`
  seeded via `npm run seed`) — `POST /api/plan` and `GET /api/programs` verified working
  end-to-end against it.
- **Real backend is wired into the frontend**: `apps/web/lib/usePlanData.ts` (`usePlan` /
  `usePrograms`) is the seam every screen reads through. It calls the real API when
  `NEXT_PUBLIC_API_BASE_URL` is set and falls back to the bundled mock engine (silently, with a
  small non-blocking `ApiErrorNotice`) on any failure — so the app runs with zero setup
  (mock-only) or against the real backend, and never renders blank either way.
- `apps/web/.env.example` and `apps/api/.env.example` document the required variables (no
  secrets committed — verify with `git status` before committing that only `.env.example` files
  are staged, never `.env`/`.env.local`).
- `apps/api/data/programs.json` has the full ~25 spec'd programs (5 per country × 5 countries,
  every field covered across ≥2 countries), seeded to Supabase, logged in `apps/api/data/SOURCES.md`.
- Real Claude LLM phrasing (`POST /api/explain`) is wired into Diagnosis/Recommendations/
  ProgramDetail via `apps/web/lib/usePlanData.ts`'s `useExplanation` hook; falls back to the local
  deterministic templates (`lib/diagnosisText.ts`, `lib/whyText.ts`) on any failure.
- No live deployment; the team is submitting the repo directly rather than a hosted URL — see
  README.md "Run instructions" for local setup (two services, no auth, minutes to run).
