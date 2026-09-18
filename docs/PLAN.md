# Team Plan — who does what, in parallel, without breaking each other

Two people. **Frontend/UX (you)** builds `apps/web`. **Backend (Altair)** builds `apps/api` +
data + engine. Read `SPEC.md` first — it's the contract. `packages/shared/types.ts` is the code
version of that contract.

---

## 1. Stack (decided)

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + TypeScript** | your call — fast, component-driven, good mobile defaults |
| Backend | **Node.js + Express + TypeScript** | Altair's call — separate service, own deploy, no coupling to frontend internals |
| Styling | **Tailwind + shadcn/ui** (disclosed in README) | fast, consistent, mobile-first |
| DB | **Supabase (Postgres)** | `programs` + `profiles` tables, generous free tier, SQL |
| Engine | plain TypeScript in `apps/api/src/engine/` | deterministic, unit-testable, no network |
| LLM | Claude (Anthropic API) via `POST /api/explain`, key server-side only | phrasing only, template fallback if missing/slow |
| Contract | `packages/shared/types.ts`, imported by both apps | prevents shape drift between two codebases |
| Tests | Vitest for the engine | fixture profiles → expected top picks & labels |

Two services talking over REST + CORS, not one Next.js app with API routes — deliberately chosen
so each of you owns a codebase end to end.

## 2. Repo layout

```
apps/
  web/                       your app
    app/
      page.tsx                  step 1  landing
      profile/page.tsx          step 2  questionnaire
      diagnosis/page.tsx        step 3
      recommendations/page.tsx  step 4
      compare/page.tsx          step 5
      roadmap/page.tsx          step 6 + 7 (next action on top)
      p/[id]/page.tsx           returning user → loads profile → /roadmap
      program/[id]/page.tsx     program detail — photo, campus life, full facts (SPEC §10)
      favorites/page.tsx        bookmarked programs (SPEC §10)
    components/
      ui/                       shadcn (generated)
      shell/                    StepIndicator, ProfileDrawer, AppShell
      program/                  ProgramCard, FactorBars, SourceBadge, LabelBadge, ScholarshipBadge,
                                 BookmarkButton, ProgramGallery, CampusLifeCard
      roadmap/                  Timeline, TimelineItem, NextActionCard, ProgressBar, CalendarView
      questionnaire/            one component per screen
    lib/
      api.ts                    getPlan / explain / saveProfile / loadProfile (mock ↔ real switch)
      store.ts                  answers + selections + progress + favorites; localStorage persistence
      ics.ts                    builds a downloadable .ics for one roadmap deadline
    mock/
      programs.json  plan.json  realistic mock data conforming to shared types (incl. image_url,
                                 campus_life_note)

  api/                       Altair's app
    src/
      server.ts                 Express app, CORS, route wiring
      routes/
        programs.ts  profile.ts  plan.ts  explain.ts
      engine/
        score.ts                factor scores + weights + fit
        label.ts                safety / match / reach
        select.ts                top picks with diversity
        diagnosis.ts             strengths / limitations / stats
        roadmap.ts               task generation
        index.ts                 buildPlan(answers, programs) → Plan
        __tests__/
      llm/
        prompts.ts  explain.ts  fallback.ts
      db/
        supabase.ts  programs.ts  profiles.ts
    data/
      programs.json              seed → inserted into Supabase
      SOURCES.md                 one line per program: url, what was checked, date

packages/
  shared/
    types.ts                   THE CONTRACT — Answers, Program, Plan, Profile, etc.

supabase/
  schema.sql                   tables from SPEC §4

docs/
  SPEC.md  PLAN.md
```

## 3. Git workflow

- `main` = always runnable. Branch off it: `feat/web-*` (you), `feat/api-*` (Altair).
- Small PRs/commits, merge yourself after a quick self-check; don't wait on review.
- **Rule:** if you touch `packages/shared/types.ts`, message the other person before merging.
- Commit messages: `feat(web): questionnaire screens`, `feat(engine): budget factor`,
  `data: add 5 Turkey programs`, `fix: ...`.
- Commit often with real messages from both accounts — the case says git history may be checked.
- Never commit `.env` / `.env.local`. Keep an `.env.example` listing variable names only.

## 4. Build order (milestone-based, not clock-based — go in this order, merge often)

### You (`apps/web`) — unblocks nothing else, so start immediately
1. Scaffold: `create-next-app`, Tailwind, shadcn init, the folder layout above.
2. Write `packages/shared/types.ts` together with Altair first — a 15-minute call, not a solo guess.
3. `mock/programs.json` + `mock/plan.json` conforming to those types; `lib/api.ts` returning mocks; `lib/store.ts` with localStorage.
4. Design tokens (colors incl. label colors, type scale, radius, spacing) — pick name/accent/font first, don't overthink it.
5. `AppShell` + `StepIndicator` + landing (`/`).
6. Questionnaire screens (`/profile`) + autosave — done when you can go through all screens, back/next, values persist on refresh, mobile is clean.
7. Diagnosis (`/diagnosis`) — summary card, strengths/limitations, goal, skeleton slot for LLM text.
8. Recommendations (`/recommendations`) — cards with fit score, label badge, factor bars, why-text slot, source badge, select → Compare.
9. Compare (`/compare`) — column table, rows ordered by weights, best-in-row highlight, CTA to roadmap.
10. Roadmap + NextAction (`/roadmap`) — timeline by phase, category chips, checkbox toggles progress, next action updates live.
11. ProfileDrawer — edit budget/country/exam from any screen → plan re-runs → UI updates. This is the single most jury-visible feature; don't skip it.
12. States: skeleton / empty / error / offline on every data screen.
13. `/p/[id]` — opens roadmap for a saved profile (share/return link).
14. `ProgramDetail` (`/program/[id]`) — gallery/photo, campus-life note, full requirement/cost
    breakdown, scholarship detail, sources. Linked from every ProgramCard.
15. `BookmarkButton` on `ProgramCard` + `/favorites` page — bookmarking works independent of
    Compare/Roadmap selection.
16. `ScholarshipBadge` on `ProgramCard`/`ProgramDetail` — surfaces existing `scholarship_note` data.
17. `CalendarView` — Timeline/Calendar toggle on `/roadmap`; `lib/ics.ts` + a download button per
    task for "remind me" (no backend notifications needed).

### Altair (`apps/api`) — start immediately, in parallel
1. Program research — the biggest task. Fill `data/programs.json` with ~25 programs across US/UK/DE/KR/TR per SPEC §4, **including `image_url` and `campus_life_note`** now that they're in the schema. Every field populated, `source_url`, `data_status`. Write `data/SOURCES.md` as you go.
1b. `scripts/enrich-programs.ts` — an LLM-with-web-search pass over `data/programs.json` that fills
    remaining gaps (missing tuition, deadline, campus note, etc.), each fill tagged with the source
    it found. No confident source → field stays `demo`, never guessed. Review the diff before
    committing. Dev-time only, never called by the running app (SPEC's Data enrichment note, §4).
2. Supabase: `supabase/schema.sql`, create tables, seed programs from JSON, `db/*` module.
3. Engine `engine/*` per SPEC §5 — score → label → select → diagnosis → roadmap. `buildPlan()` returns a `Plan`; write 3 fixture tests (tight budget, strong exam scores, undecided grade 9).
4. `POST /api/plan` — fixture answers in, JSON plan out, fast.
5. `POST/GET/PATCH /api/profile` — saves & loads answers, selections, favorites, progress.
6. `POST /api/explain` + fallback templates — returns phrased text; fallback fires when the LLM key is missing or the call fails/times out.
7. Sanity pass: change budget from high to low on a fixture and confirm the top picks change; change country; add an exam score. If nothing visibly changes, tune the weights. Document in SOURCES.md.

### Integration checkpoints (do these together, don't skip)
- **After step 2 of both lists** — types agreed and committed. This is the one thing that must happen before either of you goes deep.
- **Mid-build** — Altair's `/api/plan` + programs are ready. You flip `lib/api.ts` from mock to real. Walk the 7 steps together, fix any shape mismatches immediately.
- **Before polish** — `/api/explain` + profiles wired in; `/p/[id]` works end to end.
- **Before submission** — full jury-scenario rehearsal (see §5 below), on whatever you're demoing from (deployed or local). List every bug found, fix in priority order.

## 5. Definition of "MVP done" (must pass the jury's own test script)

1. Land → start → questionnaire → diagnosis → 3+ recommendations with "why" → compare 2 →
   roadmap → next action visible.
2. Open the profile drawer, change **budget** → recommendations reorder/change.
3. Change **country**, add an **exam score** → labels or roadmap tasks change accordingly.
4. Tick the next action → progress % moves, next action advances.
5. Refresh the page → everything is still there. Open the saved-profile link in a new tab → same.
6. Every tuition/deadline figure shows a source link or a demo badge.
7. With the LLM key removed, screens still render with fallback text — nothing blank or stuck.
8. No console errors on the main path. Mobile width doesn't break anything.

## 6. Deploy & submission (don't skip — the case requires a live link)

- Frontend → Vercel (trivial for Next.js). Backend → Render/Railway/Fly (or any host that runs a
  Node process) with the Supabase + LLM keys set as environment variables there, never in the repo.
- Point `apps/web`'s API base URL at the deployed backend via an env var.
- Do a full run-through on the *deployed* URLs, on a phone, before submitting — local-only success
  doesn't count.
- README must include: task, solution, stack, architecture, run instructions, the jury test
  scenario above, roles, sources, AI/API used, disclosed ready-made components, limitations.
- Submit on aistartify.com with code **LOCUSCASE2**, before the deadline.

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Program research eats the whole day | `demo` flag exists exactly for this; engine works fine on fewer verified rows |
| Types drift between the two apps | single `packages/shared/types.ts`, ping-before-merge rule, integration checkpoints |
| LLM slow/fails during the live demo | engine result renders first; LLM phrasing streams in or falls back; hard timeout |
| Supabase down during demo | localStorage mirror of the last plan; programs JSON bundled as fallback seed |
| Deploy left too late | deploy once basic flow works, redeploy on every meaningful merge after that |
| Scope creep beyond SPEC §10 (essay help, chat, AI tone picker, etc.) | not in MVP — goes on the "future development" slide only |
| Program detail/favorites/calendar (§10) eat time meant for the core 7 steps | core 7-step journey (steps 6–13 of your list) ships and is rehearsed *before* any of steps 14–17 start |
| Changing an answer doesn't visibly change results | dedicated sanity-pass step in Altair's list; tune weights on fixtures until it does |
