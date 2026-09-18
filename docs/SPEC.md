# Product Spec — Personal Admission Route (LOCUS Case 02)

Working title: _TBD_ — pick a real name before building screens; it appears in the header/logo everywhere.
Case: LOCUSCASE2 · Deadline: **Sep 19, 2026, 12:00 Astana**

---

## 0. One-paragraph pitch

A Kazakhstani school student (grade 9–11) answers a short questionnaire about themselves —
grades, exams, interests, countries, budget — and gets back not a list of universities, but a
**route**: a diagnosis of where they stand, a ranked shortlist of programs abroad that actually
fit with an honest explanation of *why*, a side-by-side comparison, and a dated step-by-step
roadmap (exams → documents → deadlines → activities) with one clearly highlighted next action.
Change an answer (budget, country, exam score) and the whole route visibly recomputes.

## 1. Audience & scope

- **Audience:** student in Kazakhstan, grade 9–11 (or just graduated), aiming for a
  **bachelor's degree abroad**, intake Fall 2027/2028.
- **Countries in MVP dataset:** USA, UK, Germany, South Korea, Turkey — deliberately spread
  across tuition cost (expensive → free), exam requirements (SAT vs none), and teaching language,
  so that changing budget / country / exam produces a *visibly* different result.
- **Programs:** ~25 total, ~5 per country, covering CS/IT, Engineering, Business/Economics,
  Natural Sciences, Design/Arts — every field has multiple options across at least 2 countries.
- **Language:** RU primary; EN toggle is a stretch goal, not MVP-blocking.
- **Out of scope (case boundary):** lessons, courses, mock tests, teacher dashboard, payments,
  auth, admission probability guarantees. Anything extra goes on the "future development" slide.

## 2. The 7-step journey (this is what the jury walks)

Persistent shell on every step: a step indicator, and from step 3 onward a **"Your profile"
drawer/panel** — edit any key answer without leaving the screen; results recompute instantly.
This is the "change budget and watch it react" requirement turned into a visible feature.

| # | Route | User gets | Key UI |
|---|---|---|---|
| 1 | `/` | Why this exists, what they'll get, how long it takes. One CTA. | Hero, "you will get" cards, CTA |
| 2 | `/profile` | Multi-screen questionnaire (see §3) with progress, back/next, autosave | Stepper, one question group per screen, mobile-first |
| 3 | `/diagnosis` | Profile summary · strengths · limitations · goal sentence · edit links | Summary card, strengths/limitations columns, goal banner, CTA |
| 4 | `/recommendations` | Top 3+ programs (with "show more"), each with fit score, safety/match/reach label, factor breakdown, "why it fits you", source badge | Program cards, select 2–3 → Compare |
| 5 | `/compare` | 2–3 columns, rows ordered by what *this* user weighted highest | Sticky-header table, best-in-row highlight, CTA to roadmap |
| 6 | `/roadmap` | Dated plan grouped by phase: exams, documents, deadlines, academic steps, activities | Vertical timeline, category chips, progress bar |
| 7 | (top of `/roadmap`) | One next action, checkbox, progress %. Returning users land here via a saved profile link. | Sticky "Next step" card |

Mandatory UX rules from the case:
- Every screen shows where the user is, what's done, and what's next (named, not implied).
- No dead ends — every screen has a forward path and a way back; empty/error states get a CTA too.
- Recommendations always carry a "why" and a factor breakdown, never a bare list.
- Every factual number (tuition, deadline, min score) carries a source link or a "demo data" badge.
- Mobile (≥360px) is the primary layout; desktop is the widened version.

## 3. Questionnaire (step 2) — fields

Grouped into screens of 2–3 fields each, ~3 minutes total. Every field has a sane default so the
user can skip forward; "I don't know yet" is a valid answer and becomes a roadmap task.

| Group | Field | Type / options | Feeds |
|---|---|---|---|
| About you | `grade` | 9 / 10 / 11 / graduated | intake, timeline |
| | `intake` | Fall 2027 / Fall 2028 (default from grade) | deadlines |
| Direction | `fields` | multi (max 2): CS/IT, Engineering, Business/Econ, Natural Sciences, Design/Arts, Undecided | field fit, activities |
| | `interests` | free tags, optional | phrasing only |
| Academics | `gpa` | KZ 5-point scale (3.0–5.0) → normalized | academic fit |
| | `achievements` | none / school / regional / national / international | selectivity margin |
| Exams & languages | `ielts` / `toefl` | score / "planning" / "none" | exam readiness |
| | `sat` | score / "planning" / "none" | exam readiness |
| | `english_self` | A2–C1 (asked only if no IELTS/TOEFL) | language fit |
| Where | `countries` | multi: USA, UK, Germany, South Korea, Turkey, "open to any" | country fit |
| | `study_language` | English only / open to learning a language | hard filter |
| Budget & constraints | `budget_usd_year` | <5k / 5–15k / 15–30k / 30–50k / 50k+ | budget fit |
| | `scholarship_need` | essential / preferred / not needed | weights, roadmap |
| | `activities` | multi: volunteering, sports, clubs, projects, work, none | roadmap tasks |

## 4. Data model (Supabase / Postgres)

### `programs` (~25 rows, curated by Altair)

```
id                    text PK        e.g. "tum-informatics"
university            text
program               text
country               text           enum: US | UK | DE | KR | TR
city                  text
field                 text           enum: cs | eng | business | natsci | design
language              text           "en" | "de" | "ko" | "tr"
tuition_usd_year      int
living_usd_year       int
scholarship_available bool
scholarship_note      text
gpa_min_4             numeric
ielts_min             numeric null
toefl_min             int null
sat_required          bool
sat_min               int null
other_requirements    text[]         e.g. ["TestAS", "portfolio"]
selectivity           int            1 = highly selective, 3 = accessible
application_deadline  date
intake                text           "Fall 2027"
source_url            text
data_status           text           "verified" | "demo"
```

### `profiles` (anonymous, no auth)

```
id                uuid PK   (kept in localStorage; shareable link)
created_at, updated_at
answers           jsonb     the questionnaire object (§3)
selected_programs text[]
progress          jsonb     { [task_id]: done_at }
```

If Supabase is unreachable, the frontend still works from its localStorage copy of the last plan.

## 5. Engine (deterministic, in `apps/api`, no network)

Input: `answers`, `programs[]`. Output: `Plan { diagnosis, recommendations[], roadmap }`. Pure
functions, unit-testable, <100ms.

**Hard filters:** field_fit = 0 → excluded. Program not in English and user is English-only with
no matching language level → excluded. If fewer than 3 remain, relax filters and mark results
`stretch: true`.

**Factor scores (0–1 each):** field, budget, academic, exams, country, language — same style of
formula as before (ratio-based for budget, threshold-based for academic/exams, membership-based
for field/country/language).

**Weights (sum to 1), defaults:** field 0.25 · budget 0.25 · academic 0.15 · exams 0.15 ·
country 0.12 · language 0.08. `scholarship_need = essential` shifts weight toward budget.

**Fit score** = round(Σ weight × factor × 100). Shown to the user in Compare as "ordered by what
matters to you."

**Label:** `reach` if selectivity=1 or academic<0.8 or exams<0.5; `safety` if selectivity=3 and
academic=1 and exams≥0.8 and budget≥0.9; else `match`.

**Top-3+ selection:** sort by fit desc; ensure label diversity in the top 3 if possible; "show
more" reveals the rest.

**Diagnosis:** structured facts only — `strengths[]`, `limitations[]`, `goal`, `stats`. The LLM
only rephrases these, never invents new ones.

**Roadmap:** for the union of selected programs, generate dated tasks (exam registration/sitting,
documents, application deadlines, academic gap-closing, activities, scholarship applications),
deduped, sorted by due date, grouped into phases (Now / Autumn / Winter / Spring / After
submission). Next action = earliest undone task. Progress % = done / total.

## 6. AI (LLM phrasing only)

The LLM receives the engine's already-computed structured facts and writes, in the user's
language: (1) a 3–4 sentence diagnosis, (2) one "why it fits you" per recommendation referencing
the actual factor scores. It never invents numbers, never states admission probability, always
names the program's biggest limitation in one clause.

**Fallback:** if the call fails, is slow, or no API key is configured, a templated sentence built
from the same facts renders instead, with a small "AI explanation unavailable — showing summary"
note. The demo must never stall or show a blank screen.

## 7. API — the seam between `apps/web` and `apps/api`

```
GET   /api/programs
POST  /api/profile          { answers }              → { id }
GET   /api/profile/:id                                → Profile
PATCH /api/profile/:id      { ...partial }             → Profile
POST  /api/plan             { answers, selected? }     → Plan
POST  /api/explain          { plan }                   → { diagnosisText, whyText[] }
```

Types live in `packages/shared/types.ts`: `Answers`, `Program`, `FactorScores`, `Recommendation`,
`Diagnosis`, `Task`, `Roadmap`, `Plan`, `Profile`. Both apps import from there — it is the
contract. Changing it requires pinging the other person before merging.

`apps/web` develops against `apps/web/mock/plan.json` + `programs.json` conforming to those
types; a single flag/env var switches from mock to the real API.

## 8. Design system

- **Principle:** the visual system should make the *decision* easier — hierarchy is fit score →
  label → why → facts.
- **Color:** one accent/brand color, neutral scale, 3 semantic label colors (safety / match /
  reach), plus success/warning/error states.
- **Type:** one sans with Cyrillic support. Scale: display / h1 / h2 / body / caption.
- **Components:** Button, Card, Badge (label + source/demo), Progress, Stepper, Slider,
  Checkbox/Radio groups, Drawer/Sheet (profile edit), Table (compare), Skeleton, Toast, Tooltip.
- **Custom:** ProgramCard, FactorBars, TimelineItem, NextActionCard, StepIndicator, SourceBadge.
- **States required on every data screen:** loading (skeleton), empty (relaxed options + edit
  CTA), error (fallback + retry), offline (localStorage copy).

## 9. Honesty rules (the case explicitly forbids fake precision)

- Never show "% chance of admission." Show the fit score (our formula) + label, with a tooltip
  clarifying fit ≠ admission probability.
- Every factual number has a source URL or a "demo data" badge; README lists all sources.
- Unverified deadlines are marked `data_status = demo`.

## 10. Submission checklist (from the case)

- [ ] Live URL, working without login (deploy before the deadline — see PLAN.md)
- [ ] GitHub repo with real commit history from both members
- [ ] README: task, solution, stack, architecture, run instructions, jury test scenario, roles,
      sources, AI/API used, disclosed ready-made components, limitations
- [ ] Demo video ≤ 3 min
- [ ] Deck ≤ 8 slides PDF
- [ ] No secrets in repo (`.env` gitignored, keys stored locally / in host env vars)
- [ ] Submit on aistartify.com with code **LOCUSCASE2** before Sep 19, 12:00 Astana
