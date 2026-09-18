# SPEEDSTERS — Personal Admission Route

LOCUS Startup Hackathon 2026, Case 02 (LOCUSCASE2). An AI service that turns a Kazakhstani
student's profile into a personalized university admission route: diagnosis → ranked program
recommendations with "why" → comparison → dated roadmap → one next action. Two-person team:
frontend/UX+frontend dev, and Altair on backend.

**Read `docs/SPEC.md` and `docs/PLAN.md` before making any non-trivial change.** They are the
actual spec and build plan — this file is just the fast-orientation summary. If something here
and something there disagree, `docs/SPEC.md` / `docs/PLAN.md` win; update this file to match.

## Repo layout

```
apps/web/            Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui — frontend
apps/api/             Node + Express + TypeScript — backend (Altair; not yet scaffolded)
packages/shared/types.ts   THE CONTRACT — Answers, Program, Plan, Profile, etc.
supabase/             schema.sql (not yet written — Altair)
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

`apps/api` has no commands yet — Altair scaffolds it himself; see `apps/api/README.md`.

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
  Timeline/Calendar toggle with per-task `.ics` export. Runs entirely against
  `lib/mockEngine.ts` + `apps/web/mock/programs.json` — no backend call happens yet.
  65 Vitest tests, clean `tsc --noEmit`, clean `eslint`, verified end-to-end in a real browser
  (no console errors, no horizontal overflow at 375px).
- **`apps/api` and `supabase/schema.sql` are not started** (Altair) — `apps/api/` still only has
  its scaffolding README. This is the critical path for real data and the real `/api/plan`
  endpoint; `apps/web/lib/api.ts` is the single seam to swap once it exists (see below).
- Swapping mock → real backend: change only the bodies of `getPlan`/`getPrograms` in
  `apps/web/lib/api.ts` to call the real API — no caller (`Diagnosis`, `Recommendations`,
  `Compare`, `Roadmap`, `Favorites`, `ProgramDetail`) needs to change.
- No deployment yet; the plan is to submit the repo directly rather than a live URL, per the
  team's own call — re-check `docs/PLAN.md` §6 / the submission checklist §11 before the
  Sep 19, 12:00 Astana deadline in case that changes.
