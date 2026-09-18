# Frontend MVP (7-step journey) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `apps/web` frontend for Steer's 7-step admission-route journey (landing →
questionnaire → diagnosis → recommendations → compare → roadmap → next action), working against
mock data, with an Apple-style, restrained visual design and a working "profile changes →
recommendations visibly recompute" interaction (the case's central, jury-tested UX requirement).

**Architecture:** Next.js App Router pages per step, backed by a pure-function mock scoring
engine (`lib/mockEngine.ts`) that mirrors the real backend's formulas from `SPEC.md` §5 closely
enough to demonstrate real reactivity before `apps/api` exists. `lib/store.ts` holds
answers/selections/favorites/progress in `localStorage`; `lib/api.ts` is the single seam that
later swaps the mock engine for real `POST /api/plan` calls — nothing above that seam should need
to change when the swap happens.

**Tech stack:** Next.js 16 (App Router) + TypeScript, Tailwind v4, shadcn/ui (already installed:
button, card, badge, progress, slider, checkbox, radio-group, sheet, table, skeleton, tooltip,
sonner), lucide-react, Vitest + @testing-library/react for tests.

**Spec:** `docs/SPEC.md` (product spec — journey, questionnaire fields, data model, engine
formulas, honesty rules) and `docs/PLAN.md` (stack, build order). `packages/shared/types.ts` is
the binding type contract — every task imports from there, never redefines these shapes.

## Global Constraints

- **Design system (binding on every visual task):** background `#FAFAFC`, ink `#14121F`, muted
  ink `#6B6B7A`, hairline `#E7E5EA`, brand accent = the existing `--primary` (indigo/violet)
  Tailwind token, fit labels = the existing `bg-label-safety`/`bg-label-match`/`bg-label-reach`
  tokens. Font: Manrope only (`font-sans`), no second typeface. Use whitespace and 1px hairline
  borders (`border-[var(--hairline)]` or `border-border`) for separation — **not** drop shadows or
  uniform rounded "SaaS card" treatment on everything. The top/best recommendation gets visually
  more weight than the others; recommendation cards are never a numbered sequence (they aren't
  one). Roadmap phases and questionnaire steps ARE sequences — sequential treatment is correct
  there. No ALL-CAPS labels, no eyebrow labels above headings, no arrow (→) suffixed on buttons,
  no middle-dot-joined meta strings. Every implementer subagent must load the
  `example-skills:frontend-design` skill before writing any JSX and follow its restraint
  principles (one bold move per screen, quiet everywhere else, real copy not lorem ipsum).
- **Mobile-first (SPEC.md §2):** every screen must look correct at 375px width before it's
  considered done. Check with the browser's device toolbar or by resizing to 375px; this is not
  optional polish.
- **Honesty rules (SPEC.md §9):** never render a fabricated "% chance of admission." Every
  tuition/deadline/score figure shows a source link or a `demo` badge — mock data must include
  `sourceUrl`/`dataStatus` so this is testable, not hand-waved.
- **No dead ends (SPEC.md §2):** every screen has a forward CTA and a way back. Empty/error
  states get a CTA too, not just an icon and text.
- **Types:** import everything from `packages/shared/types.ts` (path alias `@shared/*`). Do not
  locally redeclare `Program`, `Answers`, `Plan`, `Profile`, etc.
- **No placeholder copy:** every string a user reads must be real, considered copy in the
  interface's voice (active verbs, plain language) — not "Lorem ipsum" or "TODO: write copy."

---

### Task 1: Mock scoring engine + shared lib (store, api)

**Files:**
- Create: `apps/web/lib/mockEngine.ts`
- Create: `apps/web/lib/mockEngine.test.ts`
- Create: `apps/web/lib/store.ts`
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/mock/programs.json` (12 realistic programs, enough field/country spread to
  make budget/country changes visibly reorder results — see Step 3 for the exact shape)
- Modify: `apps/web/package.json` (add `vitest`, `@testing-library/react`,
  `@testing-library/jest-dom`, `jsdom` as devDependencies; add `"test": "vitest run"` script)
- Create: `apps/web/vitest.config.ts`

**Interfaces:**
- Consumes: `Answers`, `Program`, `Plan`, `Recommendation`, `FactorScores`, `Label`, `Diagnosis`,
  `Roadmap`, `Task`, `Profile` from `@shared/types` (already defined in
  `packages/shared/types.ts` — read that file before starting).
- Produces (used by every later task):
  - `buildMockPlan(answers: Answers, programs: Program[]): Plan` in `lib/mockEngine.ts`
  - `getPlan(answers: Answers): Plan` in `lib/api.ts` (calls `buildMockPlan` with the bundled
    mock programs — this is the seam later tasks and the real backend integration both call
    through)
  - `useProfileStore()` hook in `lib/store.ts` returning
    `{ answers: Answers, setAnswers: (a: Partial<Answers>) => void, selectedPrograms: string[],
    setSelectedPrograms: (ids: string[]) => void, favorites: string[], toggleFavorite: (id: string) => void,
    progress: Record<string, string>, toggleTaskDone: (taskId: string) => void }`,
    backed by `localStorage` under key `"steer.profile.v1"`, hydrating on mount (guard for SSR:
    return defaults on the server, sync from `localStorage` in a `useEffect`).
  - `DEFAULT_ANSWERS: Answers` exported from `lib/store.ts` — a fully-populated valid default
    (grade "11", intake "Fall 2027", fields ["cs"], gpa 4.2, achievements "none", ielts null,
    toefl null, sat null, englishSelf "B2", otherLanguages [], countries ["open_to_any"],
    studyLanguage "english_only", budgetUsdYear "15-30k", scholarshipNeed "preferred",
    activities ["none"], hoursPerWeek 5, interests []) so every screen has something sane to
    render before the user touches the questionnaire.

- [ ] **Step 1: Write the mock program data**

Create `apps/web/mock/programs.json` with exactly these 12 programs (this exact set is what the
fixture tests in Step 2 assert against — do not change values without updating the tests). Use
this TypeScript shape (matches `Program` in `@shared/types`) written as JSON:

```json
[
  {"id":"mit-eecs","university":"MIT","program":"BSc EECS","country":"US","city":"Cambridge","field":"cs","language":"en","tuitionUsdYear":57000,"livingUsdYear":21000,"scholarshipAvailable":true,"scholarshipNote":"Need-based aid for admitted students","gpaMin4":3.9,"ieltsMin":7.0,"toeflMin":100,"satRequired":true,"satMin":1500,"otherRequirements":[],"selectivity":1,"applicationDeadline":"2027-01-01","intake":"Fall 2027","sourceUrl":"https://mitadmissions.org","dataStatus":"verified","imageUrl":null,"campusLifeNote":"Dense, project-driven campus culture in Cambridge, MA."},
  {"id":"asu-cs","university":"Arizona State University","program":"BSc Computer Science","country":"US","city":"Tempe","field":"cs","language":"en","tuitionUsdYear":29000,"livingUsdYear":14000,"scholarshipAvailable":true,"scholarshipNote":"Merit scholarships up to 100% for international students","gpaMin4":3.0,"ieltsMin":6.0,"toeflMin":80,"satRequired":false,"satMin":null,"otherRequirements":[],"selectivity":3,"applicationDeadline":"2027-05-01","intake":"Fall 2027","sourceUrl":"https://asu.edu","dataStatus":"verified","imageUrl":null,"campusLifeNote":"Large sunny campus, big international student community."},
  {"id":"purdue-business","university":"Purdue University","program":"BSc Business (Krannert)","country":"US","city":"West Lafayette","field":"business","language":"en","tuitionUsdYear":31000,"livingUsdYear":13000,"scholarshipAvailable":true,"scholarshipNote":"Dean's scholarships for strong applicants","gpaMin4":3.4,"ieltsMin":6.5,"toeflMin":88,"satRequired":true,"satMin":1250,"otherRequirements":[],"selectivity":2,"applicationDeadline":"2027-01-15","intake":"Fall 2027","sourceUrl":"https://purdue.edu","dataStatus":"demo","imageUrl":null,"campusLifeNote":"Midwestern college town, strong Greek and sports culture."},
  {"id":"imperial-computing","university":"Imperial College London","program":"BEng Computing","country":"UK","city":"London","field":"cs","language":"en","tuitionUsdYear":42000,"livingUsdYear":18000,"scholarshipAvailable":false,"scholarshipNote":null,"gpaMin4":3.8,"ieltsMin":6.5,"toeflMin":92,"satRequired":false,"satMin":null,"otherRequirements":[],"selectivity":1,"applicationDeadline":"2027-01-25","intake":"Fall 2027","sourceUrl":"https://imperial.ac.uk","dataStatus":"verified","imageUrl":null,"campusLifeNote":"Central London campus, fast-paced and international."},
  {"id":"manchester-mecheng","university":"University of Manchester","program":"BEng Mechanical Engineering","country":"UK","city":"Manchester","field":"eng","language":"en","tuitionUsdYear":33000,"livingUsdYear":15000,"scholarshipAvailable":true,"scholarshipNote":"Manchester Global Excellence scholarships","gpaMin4":3.4,"ieltsMin":6.0,"toeflMin":78,"satRequired":false,"satMin":null,"otherRequirements":[],"selectivity":2,"applicationDeadline":"2027-01-25","intake":"Fall 2027","sourceUrl":"https://manchester.ac.uk","dataStatus":"verified","imageUrl":null,"campusLifeNote":"Big student city, strong music and sports scene."},
  {"id":"coventry-business","university":"Coventry University","program":"BA Business Management","country":"UK","city":"Coventry","field":"business","language":"en","tuitionUsdYear":18000,"livingUsdYear":11000,"scholarshipAvailable":true,"scholarshipNote":"International scholarship up to 3000 GBP","gpaMin4":2.8,"ieltsMin":5.5,"toeflMin":72,"satRequired":false,"satMin":null,"otherRequirements":[],"selectivity":3,"applicationDeadline":"2027-06-01","intake":"Fall 2027","sourceUrl":"https://coventry.ac.uk","dataStatus":"demo","imageUrl":null,"campusLifeNote":"Compact, affordable city, large international student base."},
  {"id":"tum-informatics","university":"TU Munich","program":"BSc Informatics","country":"DE","city":"Munich","field":"cs","language":"en","tuitionUsdYear":0,"livingUsdYear":13000,"scholarshipAvailable":false,"scholarshipNote":"No tuition fee for this program","gpaMin4":3.6,"ieltsMin":6.5,"toeflMin":88,"satRequired":false,"satMin":null,"otherRequirements":["TestAS recommended"],"selectivity":2,"applicationDeadline":"2027-05-31","intake":"Fall 2027","sourceUrl":"https://tum.de","dataStatus":"verified","imageUrl":null,"campusLifeNote":"Major tech hub city, high quality of life, competitive housing market."},
  {"id":"rwth-mecheng","university":"RWTH Aachen","program":"BSc Mechanical Engineering","country":"DE","city":"Aachen","field":"eng","language":"de","tuitionUsdYear":0,"livingUsdYear":11000,"scholarshipAvailable":false,"scholarshipNote":"No tuition fee for this program","gpaMin4":3.4,"ieltsMin":null,"toeflMin":null,"satRequired":false,"satMin":null,"otherRequirements":["German B2 certificate"],"selectivity":2,"applicationDeadline":"2027-07-15","intake":"Fall 2027","sourceUrl":"https://rwth-aachen.de","dataStatus":"verified","imageUrl":null,"campusLifeNote":"Small student-heavy city near the Dutch and Belgian borders."},
  {"id":"kaist-cs","university":"KAIST","program":"BSc Computer Science","country":"KR","city":"Daejeon","field":"cs","language":"en","tuitionUsdYear":4000,"livingUsdYear":9000,"scholarshipAvailable":true,"scholarshipNote":"Full scholarships common for international students","gpaMin4":3.7,"ieltsMin":6.5,"toeflMin":90,"satRequired":false,"satMin":null,"otherRequirements":[],"selectivity":1,"applicationDeadline":"2026-12-15","intake":"Fall 2027","sourceUrl":"https://kaist.ac.kr","dataStatus":"verified","imageUrl":null,"campusLifeNote":"Research-intensive campus, strong robotics and AI labs."},
  {"id":"koc-engineering","university":"Koç University","program":"BSc Industrial Engineering","country":"TR","city":"Istanbul","field":"eng","language":"en","tuitionUsdYear":16000,"livingUsdYear":8000,"scholarshipAvailable":true,"scholarshipNote":"Merit scholarships cover up to full tuition","gpaMin4":3.5,"ieltsMin":6.5,"toeflMin":87,"satRequired":true,"satMin":1300,"otherRequirements":[],"selectivity":2,"applicationDeadline":"2027-02-01","intake":"Fall 2027","sourceUrl":"https://ku.edu.tr","dataStatus":"verified","imageUrl":null,"campusLifeNote":"Hilltop campus outside Istanbul, close-knit international community."},
  {"id":"bilkent-cs","university":"Bilkent University","program":"BSc Computer Engineering","country":"TR","city":"Ankara","field":"cs","language":"en","tuitionUsdYear":12000,"livingUsdYear":6000,"scholarshipAvailable":true,"scholarshipNote":"Full and partial scholarships for strong applicants","gpaMin4":3.3,"ieltsMin":6.0,"toeflMin":80,"satRequired":false,"satMin":null,"otherRequirements":[],"selectivity":2,"applicationDeadline":"2027-03-01","intake":"Fall 2027","sourceUrl":"https://bilkent.edu.tr","dataStatus":"verified","imageUrl":null,"campusLifeNote":"Green, self-contained campus in the capital."},
  {"id":"sabanci-natsci","university":"Sabancı University","program":"BSc Natural Sciences","country":"TR","city":"Istanbul","field":"natsci","language":"en","tuitionUsdYear":14000,"livingUsdYear":7500,"scholarshipAvailable":true,"scholarshipNote":"Need- and merit-based scholarships available","gpaMin4":3.2,"ieltsMin":6.0,"toeflMin":80,"satRequired":false,"satMin":null,"otherRequirements":[],"selectivity":2,"applicationDeadline":"2027-02-15","intake":"Fall 2027","sourceUrl":"https://sabanciuniv.edu","dataStatus":"demo","imageUrl":null,"campusLifeNote":"Forested campus outside Istanbul, small classes."}
]
```

- [ ] **Step 2: Write the failing mock-engine tests**

Create `apps/web/lib/mockEngine.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildMockPlan } from "./mockEngine";
import programs from "../mock/programs.json";
import type { Answers, Program } from "@shared/types";

const typedPrograms = programs as Program[];

function baseAnswers(overrides: Partial<Answers> = {}): Answers {
  return {
    grade: "11",
    intake: "Fall 2027",
    fields: ["cs"],
    interests: [],
    gpa: 4.5,
    achievements: "none",
    ielts: { value: 7.0 },
    toefl: null,
    sat: { value: 1500 },
    englishSelf: null,
    otherLanguages: [],
    countries: ["US", "UK", "DE", "KR", "TR"],
    studyLanguage: "english_only",
    budgetUsdYear: "50k+",
    scholarshipNeed: "not_needed",
    activities: ["projects"],
    hoursPerWeek: 10,
    ...overrides,
  };
}

describe("buildMockPlan", () => {
  it("returns at least 3 recommendations sorted by fit score descending", () => {
    const plan = buildMockPlan(baseAnswers(), typedPrograms);
    expect(plan.recommendations.length).toBeGreaterThanOrEqual(3);
    const scores = plan.recommendations.map((r) => r.fitScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("changing budget from high to low changes the top recommendation", () => {
    const richPlan = buildMockPlan(baseAnswers({ budgetUsdYear: "50k+" }), typedPrograms);
    const poorPlan = buildMockPlan(baseAnswers({ budgetUsdYear: "<5k", scholarshipNeed: "essential" }), typedPrograms);
    expect(richPlan.recommendations[0].program.id).not.toBe(poorPlan.recommendations[0].program.id);
  });

  it("restricting to one low-cost country changes the top pick vs. open-to-any", () => {
    const openPlan = buildMockPlan(baseAnswers(), typedPrograms);
    const turkeyOnlyPlan = buildMockPlan(baseAnswers({ countries: ["TR"] }), typedPrograms);
    expect(turkeyOnlyPlan.recommendations[0].program.country).toBe("TR");
    expect(openPlan.recommendations[0].program.id).not.toBe(turkeyOnlyPlan.recommendations[0].program.id);
  });

  it("labels MIT (selectivity 1) as reach and ASU (selectivity 3, easy fit) as safety for a strong low-budget-tolerant profile", () => {
    const plan = buildMockPlan(
      baseAnswers({ countries: ["US"], budgetUsdYear: "50k+", gpa: 4.8, sat: { value: 1560 }, ielts: { value: 8.0 } }),
      typedPrograms,
    );
    const mit = plan.recommendations.find((r) => r.program.id === "mit-eecs");
    const asu = plan.recommendations.find((r) => r.program.id === "asu-cs");
    expect(mit?.label).toBe("reach");
    expect(asu?.label).toBe("safety");
  });

  it("produces a roadmap with a next action and phases covering every task", () => {
    const plan = buildMockPlan(baseAnswers({ sat: { status: "none" } }), typedPrograms);
    expect(plan.roadmap.tasks.length).toBeGreaterThan(0);
    expect(plan.roadmap.nextActionTaskId).not.toBeNull();
    const allPhaseTaskIds = Object.values(plan.roadmap.phases).flat();
    expect(allPhaseTaskIds.sort()).toEqual(plan.roadmap.tasks.map((t) => t.id).sort());
  });

  it("marks every task's sourceUrl as either a real url or the literal string demo", () => {
    const plan = buildMockPlan(baseAnswers(), typedPrograms);
    for (const task of plan.roadmap.tasks) {
      expect(task.sourceUrl === "demo" || task.sourceUrl.startsWith("http")).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

```
cd apps/web
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add to `apps/web/package.json` `"scripts"`: `"test": "vitest run"`.

Create `apps/web/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { environment: "jsdom", globals: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@shared": path.resolve(__dirname, "../../packages/shared"),
    },
  },
});
```

Run: `npm test` — expected: FAIL with "Cannot find module './mockEngine'" (it doesn't exist yet).

- [ ] **Step 4: Implement `lib/mockEngine.ts`**

Implement `buildMockPlan` following `SPEC.md` §5 exactly:

- Hard filter: drop programs where the user's `fields` don't overlap `program.field` at all
  (unless `fields` includes `"undecided"`, which passes everything) AND drop programs whose
  `language !== "en"` when `studyLanguage === "english_only"` and the user has no matching
  `otherLanguages` entry for that program's language at B1+.
- Factor scores (0..1 each), computed per remaining program:
  - `field`: 1 if program.field is in answers.fields; 0.6 if adjacent (cs↔eng,
    business↔social/natsci); 0.7 for everything if `fields` includes `"undecided"`; else 0.
  - `budget`: `cost = tuitionUsdYear + livingUsdYear`. Map `budgetUsdYear` band to a number
    (`"<5k"→5000, "5-15k"→15000, "15-30k"→30000, "30-50k"→50000, "50k+"→80000`).
    `ratio = budgetNumber / cost` (cost=0 → ratio=2, capped). `score = Math.min(1, ratio)`; if
    `score < 1 && program.scholarshipAvailable`, add 0.25 capped at 1.
  - `academic`: `diff = gpa - program.gpaMin4`. `diff >= 0.3 → 1`; `diff >= 0 → 0.8`;
    `diff >= -0.3 → 0.5`; else `0.2`. If `achievements` is `"national"` or `"international"`,
    add 0.1 capped at 1.
  - `exams`: average, over each of {IELTS-or-TOEFL, SAT if `satRequired`}: has a numeric score
    `>=` the program's minimum → 1; has a numeric score below minimum → 0.5; `status:
    "planning"` → 0.4; `status: "none"` or missing → 0.2. A program with no exam
    requirement contributes 1 for that exam.
  - `country`: 1 if program.country is in answers.countries; 0.7 if answers.countries includes
    `"open_to_any"`; else 0.2.
  - `language`: program.language === "en" and (ielts.value >= 6 or toefl.value >= 80 or
    englishSelf >= "B2") → 1; englishSelf === "B1" → 0.6; program.language !== "en" and
    user has a matching otherLanguages entry at B1+ → 0.8, else 0.3.
- Weights (sum to 1): field 0.25, budget 0.25, academic 0.15, exams 0.15, country 0.12,
  language 0.08. If `scholarshipNeed === "essential"`, use field 0.20, budget 0.32 instead
  (everything else unchanged, weights still sum to 1: 0.20+0.32+0.15+0.15+0.12+0.08 = 1.02 —
  to keep the sum exact, subtract the 0.02 excess from `country` → 0.10).
- `fitScore = Math.round(weightedSum * 100)`.
- Label: `"reach"` if `selectivity === 1 || academic < 0.8 || exams < 0.5`; else `"safety"` if
  `selectivity === 3 && academic === 1 && exams >= 0.8 && budget >= 0.9`; else `"match"`.
- Sort by `fitScore` desc, take top 3 ensuring at least 2 distinct labels are represented among
  the top 3 when possible (if the top 3 all share one label, swap the 3rd for the best-scoring
  program of a different label, if that program's fitScore >= 55); return at least 3 and up to 6
  total recommendations (rest available for "show more").
- Diagnosis: `strengths` from factor scores >= 0.8 (map to a `{key, value}` per factor, e.g.
  `{key: "ielts_strong", value: answers.ielts?.value}` when the exams factor is high and IELTS is
  the reason), `limitations` from factor scores <= 0.4 using keys `"no_sat"`, `"budget_tight"`,
  `"gpa_below_median"`, `"english_untested"`, `"late_timeline"` (deadline within 4 months of
  today) as appropriate, `goal: { fields: answers.fields, countries: answers.countries, intake:
  answers.intake }`, `stats: { programsConsidered: programs.length, programsFit: <count with
  fitScore >= 55>, cheapestFitCostUsd: <min tuition+living among fitScore >= 55, or null> }`.
- Roadmap: for the union of the top 3 recommendations' programs, generate `Task` objects per
  SPEC.md §5.7's table (exam registration/sitting if below/missing minimum, documents, deadline,
  academic gap-closing if gpa below min, 2 activity suggestions by field + 1 generic if
  `activities` includes `"none"`, scholarship task if `scholarshipNeed !== "not_needed"`), with
  `id` = a stable slug (`${category}-${programId}-${index}`), `due` computed as an ISO date
  relative to that program's `applicationDeadline` per the offsets in SPEC.md §5.7, `sourceUrl`
  = the program's `sourceUrl` for deadline/document tasks tied to one program, or the literal
  string `"demo"` for generic tasks (activities, generic academic advice). Dedupe tasks with the
  same category+title combination across programs. Sort by `due` ascending. Group into
  `phases: { now: [...ids due within 6 weeks], autumn: [...], winter: [...], spring: [...],
  after_submission: [...ids due after every deadline] }` (use today's date +6 weeks for "now";
  divide the remainder evenly across autumn/winter/spring by month, anything past the latest
  deadline goes to `after_submission`). `nextActionTaskId` = earliest-due task where `done ===
  false` (or `null` if all done). `progressPct = Math.round(100 * doneCount / totalCount)`
  (0 if there are no tasks).

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`. Expected: all 6 tests in `mockEngine.test.ts` PASS. If the label test fails,
adjust the label thresholds first (not the test) — the thresholds above are the spec; re-check
your factor-score math before concluding the spec itself needs a different fixture.

- [ ] **Step 6: Implement `lib/store.ts` and `lib/api.ts`**

`lib/store.ts` — a React hook, no external state library needed:

```typescript
"use client";
import { useCallback, useEffect, useState } from "react";
import type { Answers } from "@shared/types";

const STORAGE_KEY = "steer.profile.v1";

export const DEFAULT_ANSWERS: Answers = {
  grade: "11",
  intake: "Fall 2027",
  fields: ["cs"],
  interests: [],
  gpa: 4.2,
  achievements: "none",
  ielts: null,
  toefl: null,
  sat: null,
  englishSelf: "B2",
  otherLanguages: [],
  countries: ["open_to_any"],
  studyLanguage: "english_only",
  budgetUsdYear: "15-30k",
  scholarshipNeed: "preferred",
  activities: ["none"],
  hoursPerWeek: 5,
};

interface StoredState {
  answers: Answers;
  selectedPrograms: string[];
  favorites: string[];
  progress: Record<string, string>;
}

function loadState(): StoredState {
  if (typeof window === "undefined") {
    return { answers: DEFAULT_ANSWERS, selectedPrograms: [], favorites: [], progress: {} };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { answers: DEFAULT_ANSWERS, selectedPrograms: [], favorites: [], progress: {} };
    const parsed = JSON.parse(raw);
    return {
      answers: { ...DEFAULT_ANSWERS, ...parsed.answers },
      selectedPrograms: parsed.selectedPrograms ?? [],
      favorites: parsed.favorites ?? [],
      progress: parsed.progress ?? {},
    };
  } catch {
    return { answers: DEFAULT_ANSWERS, selectedPrograms: [], favorites: [], progress: {} };
  }
}

export function useProfileStore() {
  const [state, setState] = useState<StoredState>({
    answers: DEFAULT_ANSWERS,
    selectedPrograms: [],
    favorites: [],
    progress: {},
  });

  useEffect(() => {
    setState(loadState());
  }, []);

  const persist = useCallback((next: StoredState) => {
    setState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  const setAnswers = useCallback(
    (partial: Partial<Answers>) => {
      persist({ ...state, answers: { ...state.answers, ...partial } });
    },
    [state, persist],
  );

  const setSelectedPrograms = useCallback(
    (ids: string[]) => persist({ ...state, selectedPrograms: ids }),
    [state, persist],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const has = state.favorites.includes(id);
      persist({
        ...state,
        favorites: has ? state.favorites.filter((f) => f !== id) : [...state.favorites, id],
      });
    },
    [state, persist],
  );

  const toggleTaskDone = useCallback(
    (taskId: string) => {
      const next = { ...state.progress };
      if (next[taskId]) delete next[taskId];
      else next[taskId] = new Date().toISOString();
      persist({ ...state, progress: next });
    },
    [state, persist],
  );

  return {
    answers: state.answers,
    setAnswers,
    selectedPrograms: state.selectedPrograms,
    setSelectedPrograms,
    favorites: state.favorites,
    toggleFavorite,
    progress: state.progress,
    toggleTaskDone,
  };
}
```

`lib/api.ts`:

```typescript
import type { Answers, Plan } from "@shared/types";
import { buildMockPlan } from "./mockEngine";
import programsData from "../mock/programs.json";
import type { Program } from "@shared/types";

const programs = programsData as Program[];

// Mock-only for now — swapping to the real backend later means changing only this function's
// body (a fetch to POST /api/plan), not any caller.
export function getPlan(answers: Answers): Plan {
  return buildMockPlan(answers, programs);
}

export function getPrograms(): Program[] {
  return programs;
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib apps/web/mock apps/web/package.json apps/web/package-lock.json apps/web/vitest.config.ts
git commit -m "feat(web): mock scoring engine, store, and api seam"
```

---

### Task 2: AppShell, StepIndicator, and the landing page

**Files:**
- Create: `apps/web/components/shell/AppShell.tsx`
- Create: `apps/web/components/shell/StepIndicator.tsx`
- Create: `apps/web/components/shell/StepIndicator.test.tsx`
- Modify: `apps/web/app/layout.tsx` (wrap children in `<AppShell>`, add `Toaster` from
  `components/ui/sonner`)
- Modify: `apps/web/app/page.tsx` (the landing page — replace the create-next-app starter content)

**Interfaces:**
- Consumes: nothing from earlier tasks except general project conventions.
- Produces:
  - `<AppShell>{children}</AppShell>` — a simple wrapper providing consistent max-width,
    padding, and a persistent top bar with the "Steer" wordmark linking to `/`. Does NOT render
    `StepIndicator` itself (each step page renders its own, since the landing page has no step).
  - `<StepIndicator current={2} total={7} labels={["Profile","Diagnosis","Recommendations","Compare","Roadmap"]} />`
    props: `current: number` (1-indexed, matching SPEC.md §2's 7 steps), `total: number`,
    `labels: string[]` (labels for steps 2 through 6 only — steps 1 and 7 aren't shown as numbered
    stops per SPEC.md, they're the entry and the sticky next-action instead). Renders a
    horizontal row of dots/segments with the current one visually emphasized using the `primary`
    color token, and a text label for the current step's name (not all labels shown at once on
    mobile — current step name plus "Step N of 5" text is enough).

- [ ] **Step 1: Write the StepIndicator test**

```typescript
// apps/web/components/shell/StepIndicator.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StepIndicator } from "./StepIndicator";

describe("StepIndicator", () => {
  it("shows the current step number and its label", () => {
    render(
      <StepIndicator
        current={3}
        total={5}
        labels={["Profile", "Diagnosis", "Recommendations", "Compare", "Roadmap"]}
      />,
    );
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText("Recommendations")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/web && npm test -- StepIndicator` — expected: FAIL, `StepIndicator` module not found.

- [ ] **Step 3: Implement `StepIndicator` and `AppShell`**

Load the `example-skills:frontend-design` skill's principles before writing this: restrained,
one accent color, no decorative numbering theater. `StepIndicator` should render `total` small
segments (a simple flex row of rounded-full spans, hairline-bordered, filled with `bg-primary`
up to and including `current`, `bg-border` after), plus the current label as real text ("Step 3
of 5 — Recommendations") below it, sized as a caption. `AppShell` renders a slim sticky header
(logo text "Steer" linking to `/`, hairline bottom border, no shadow) and a `<main>` with
consistent horizontal padding and a `max-w-2xl` centered container for content — this becomes
the shared frame every step's page renders inside.

Wire `AppShell` into `apps/web/app/layout.tsx` around `{children}`, and add
`<Toaster />` from `@/components/ui/sonner` once, inside `<body>`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- StepIndicator` — expected: PASS.

- [ ] **Step 5: Build the landing page**

Replace `apps/web/app/page.tsx` entirely. Requirements (SPEC.md §2 step 1): a short, real
explanation of the value (not generic marketing filler — name the actual thing: turning a
profile into a route, with a diagnosis, ranked programs with reasons, a comparison, and a dated
plan), a rough sense of how long the questionnaire takes, and one clear CTA into `/profile`. No
`StepIndicator` on this page (it's the entry, not a numbered step). Use this as the one bold
moment per the design skill's "spend your boldness in one place" — a confident headline is
enough; do not also add a hero image, gradient, AND three feature cards, pick what actually
carries the page. Write real copy grounded in the actual product (see `SPEC.md` §0's pitch for
the substance, but do not copy its exact sentences verbatim — write it for a first-time visitor,
not a spec reader).

- [ ] **Step 6: Manual check**

Run `npm run dev`, open `http://localhost:3000` at 375px width (browser device toolbar). Confirm:
the CTA is reachable without scrolling on mobile, there's no console error, and the page does not
look like a generic SaaS template (no eyebrow label, no eviction of the actual pitch in favor of
decoration). Take a screenshot if your environment supports it and critique it against the design
skill's restraint guidance before moving on.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/shell apps/web/app/layout.tsx apps/web/app/page.tsx
git commit -m "feat(web): app shell, step indicator, landing page"
```

---

### Task 3: Questionnaire (`/profile`)

**Files:**
- Create: `apps/web/app/profile/page.tsx`
- Create: `apps/web/components/questionnaire/Questionnaire.tsx`
- Create: `apps/web/components/questionnaire/Questionnaire.test.tsx`

**Interfaces:**
- Consumes: `useProfileStore()` from `lib/store.ts` (Task 1), `StepIndicator`/`AppShell` from
  Task 2, questionnaire field definitions from `SPEC.md` §3, `Answers` type from `@shared/types`.
- Produces: the `/profile` route. On finishing the last group, navigates to `/diagnosis` (use
  `useRouter().push("/diagnosis")` from `next/navigation`).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/components/questionnaire/Questionnaire.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Questionnaire } from "./Questionnaire";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("Questionnaire", () => {
  it("starts on the first group and advances to the next on clicking Next", () => {
    render(<Questionnaire />);
    expect(screen.getByText(/About you/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    expect(screen.getByText(/Direction/i)).toBeInTheDocument();
  });

  it("allows going back to the previous group", () => {
    render(<Questionnaire />);
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    fireEvent.click(screen.getByRole("button", { name: /Back/i }));
    expect(screen.getByText(/About you/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/web && npm test -- Questionnaire` — expected: FAIL, module not found.

- [ ] **Step 3: Implement `Questionnaire.tsx`**

Six groups exactly as named in `SPEC.md` §3: "About you", "Direction", "Academics", "Exams &
languages", "Where", "Budget & constraints". Internal state = current group index (0-5). Each
group renders the fields listed in SPEC.md §3 for it, using shadcn `RadioGroup`/`Checkbox`/
`Slider`/`Input` as fits each field's type, wired to `useProfileStore()`'s `answers` +
`setAnswers`. Every field must have the default from `DEFAULT_ANSWERS` (Task 1) already applied
so nothing is ever required to proceed — "Next" is never disabled. Render `<StepIndicator
current={2} total={7} labels={[...]} />` at the top (step 2 of the 7-step journey — see Task 2).
Group 0 has no "Back" button (nothing to go back to on the questionnaire itself — use the
`AppShell` header's logo link for that); the last group's "Next" button reads "See my diagnosis"
and navigates to `/diagnosis` instead of advancing the group index.

Apply the `example-skills:frontend-design` skill's guidance: one field group visible at a time
(not an intimidating wall of every field at once), generous spacing, real question phrasing (e.g.
"What's your GPA?" not "gpa:"), no ALL-CAPS field labels.

`apps/web/app/profile/page.tsx` is a one-line wrapper: `export default function ProfilePage() {
  return <Questionnaire />; }`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- Questionnaire` — expected: PASS.

- [ ] **Step 5: Manual check**

`npm run dev`, visit `/profile` at 375px width. Go through all 6 groups forward and back; refresh
mid-way and confirm answers persisted (via `localStorage` — check DevTools Application tab for
key `steer.profile.v1`). Confirm no field blocks progression.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/profile apps/web/components/questionnaire
git commit -m "feat(web): questionnaire (profile) screens with autosave"
```

---

### Task 4: Diagnosis and Recommendations

**Files:**
- Create: `apps/web/app/diagnosis/page.tsx`
- Create: `apps/web/app/recommendations/page.tsx`
- Create: `apps/web/components/program/ProgramCard.tsx`
- Create: `apps/web/components/program/FactorBars.tsx`
- Create: `apps/web/components/program/LabelBadge.tsx`
- Create: `apps/web/components/program/SourceBadge.tsx`
- Create: `apps/web/components/program/ProgramCard.test.tsx`

**Interfaces:**
- Consumes: `useProfileStore()`, `getPlan()` from `lib/api.ts` (Task 1), `Recommendation`,
  `Diagnosis`, `Label` from `@shared/types`.
- Produces:
  - `<LabelBadge label="safety" | "match" | "reach" />` — renders text "Safety"/"Match"/"Reach"
    on the matching `bg-label-*` token.
  - `<SourceBadge sourceUrl={string | "demo"} />` — renders a link if it's a URL, or a "Demo
    data" badge (using the `border`/`muted` tokens, not a color that implies "warning") if it's
    the literal string `"demo"`.
  - `<FactorBars factors={FactorScores} />` — six small horizontal bars (field/budget/academic/
    exams/country/language), each labeled and showing its 0-1 value as a percentage width.
  - `<ProgramCard recommendation={Recommendation} rank={number} onToggleFavorite?: (id: string) => void, isFavorite?: boolean />`
    — `rank === 1` renders visually larger/expanded (per the Global Constraints: the top pick
    gets real visual priority, not identical treatment). Shows university/program/city,
    `LabelBadge`, fit score, `FactorBars`, the `whyText` if present or else a plain templated
    sentence built from the factors (e.g. "Fits your budget and field, but your SAT score is
    below this program's usual range." — derive this from whichever factor is lowest), tuition/
    living cost with `SourceBadge`.
  - `/diagnosis` renders the plan's `diagnosis` (strengths, limitations, goal sentence built from
    `goal.fields`/`goal.countries`/`goal.intake`), with a CTA "See my recommendations" to
    `/recommendations`, and "Edit answers" linking back to `/profile`.
  - `/recommendations` renders `getPlan(answers).recommendations` as `ProgramCard`s (top 3
    visible, a "Show more" reveals the rest), lets the user select up to 3 via a checkbox/toggle
    on each card, and a sticky "Compare selected (N)" button navigating to `/compare` once 2+ are
    selected (disabled with a tooltip explaining why below 2).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/components/program/ProgramCard.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgramCard } from "./ProgramCard";
import type { Recommendation } from "@shared/types";

const sample: Recommendation = {
  program: {
    id: "test-1", university: "Test University", program: "BSc Testing", country: "US",
    city: "Testville", field: "cs", language: "en", tuitionUsdYear: 20000, livingUsdYear: 10000,
    scholarshipAvailable: false, scholarshipNote: null, gpaMin4: 3.0, ieltsMin: 6.0,
    toeflMin: 80, satRequired: false, satMin: null, otherRequirements: [], selectivity: 2,
    applicationDeadline: "2027-01-01", intake: "Fall 2027", sourceUrl: "https://example.com",
    dataStatus: "verified", imageUrl: null, campusLifeNote: null,
  },
  factors: { field: 1, budget: 0.8, academic: 0.9, exams: 0.7, country: 1, language: 1 },
  fitScore: 87,
  label: "match",
};

describe("ProgramCard", () => {
  it("shows the university name, fit score, and label", () => {
    render(<ProgramCard recommendation={sample} rank={1} />);
    expect(screen.getByText("Test University")).toBeInTheDocument();
    expect(screen.getByText(/87/)).toBeInTheDocument();
    expect(screen.getByText("Match")).toBeInTheDocument();
  });

  it("shows a source link when sourceUrl is a real url", () => {
    render(<ProgramCard recommendation={sample} rank={2} />);
    expect(screen.getByRole("link", { name: /source|example.com/i })).toBeInTheDocument();
  });

  it("shows a demo badge when dataStatus/sourceUrl indicate demo data", () => {
    const demoSample = { ...sample, program: { ...sample.program, sourceUrl: "demo" as const } };
    render(<ProgramCard recommendation={demoSample} rank={2} />);
    expect(screen.getByText(/demo/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/web && npm test -- ProgramCard` — expected: FAIL, module not found.

- [ ] **Step 3: Implement the program components, then the two pages**

Build `LabelBadge`, `SourceBadge`, `FactorBars` first (small, no dependencies on each other),
then `ProgramCard` composing them. Apply the Global Constraints: hairline border not shadow,
rank 1 visually larger (e.g. `md:col-span-2` in a grid, or simply larger padding/type scale — an
implementer's judgment call, but it must be visibly different from ranks 2/3, not just an
"order").

Then build `/diagnosis/page.tsx` and `/recommendations/page.tsx` per the Produces section above,
calling `getPlan(answers)` from `lib/api.ts` (Task 1) with the `answers` from `useProfileStore()`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ProgramCard` — expected: PASS.

- [ ] **Step 5: Manual check**

`npm run dev`, go through `/profile` → `/diagnosis` → `/recommendations` at 375px width. Confirm
the top card looks meaningfully different from the others, every tuition figure has a source or
demo badge, and selecting programs enables the compare CTA only at 2+.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/diagnosis apps/web/app/recommendations apps/web/components/program
git commit -m "feat(web): diagnosis and recommendations screens"
```

---

### Task 5: Compare (`/compare`)

**Files:**
- Create: `apps/web/app/compare/page.tsx`
- Create: `apps/web/app/compare/page.test.tsx`

**Interfaces:**
- Consumes: `useProfileStore()` (for `selectedPrograms`), `getPlan()` (Task 1), `ProgramCard`'s
  sibling components (`LabelBadge`, `SourceBadge`) from Task 4 for consistent presentation inside
  table cells.
- Produces: the `/compare` route. If `selectedPrograms.length < 2`, renders an empty state (per
  Global Constraints: a CTA, not a dead end) directing back to `/recommendations`. CTA "Build my
  roadmap" navigates to `/roadmap`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/app/compare/page.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ComparePage from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("ComparePage", () => {
  it("shows an empty-state CTA when fewer than 2 programs are selected", () => {
    render(<ComparePage />);
    expect(screen.getByRole("link", { name: /recommendations/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/web && npm test -- compare` — expected: FAIL (either module-not-found, or it
fails because `useProfileStore` has no selections by default — confirm the failure is because
the page doesn't exist yet, not a logic error, before proceeding).

- [ ] **Step 3: Implement `/compare/page.tsx`**

Rows = the factors that matter most to this user, ordered by the engine's weights (recompute
weights the same way `mockEngine.ts` does for `scholarshipNeed`, or export the weight table from
`mockEngine.ts` for reuse — prefer exporting `getWeights(answers)` from `mockEngine.ts` over
duplicating the logic). Columns = the 2-3 selected programs. Highlight the best value in each row
(e.g. a subtle `bg-accent` cell background, not a full re-color). Use a real `<Table>` from
shadcn for structure; on mobile, either let it scroll horizontally with a visible scroll
affordance, or stack into per-program cards with the same row labels — implementer's call, but it
must not silently clip content at 375px.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- compare` — expected: PASS.

- [ ] **Step 5: Manual check**

Select 2 programs on `/recommendations`, follow through to `/compare` at 375px, confirm the table
is usable (scrolls or stacks, doesn't clip), and the CTA reaches `/roadmap`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/compare
git commit -m "feat(web): compare screen"
```

---

### Task 6: Roadmap, next action, and the profile drawer (reactive recompute)

**Files:**
- Create: `apps/web/app/roadmap/page.tsx`
- Create: `apps/web/components/roadmap/Timeline.tsx`
- Create: `apps/web/components/roadmap/NextActionCard.tsx`
- Create: `apps/web/components/roadmap/NextActionCard.test.tsx`
- Create: `apps/web/components/shell/ProfileDrawer.tsx`
- Modify: `apps/web/components/shell/AppShell.tsx` (render `ProfileDrawer` trigger in the header,
  from step 3 onward — pass a prop or check `usePathname()` to decide when to show it)

**Interfaces:**
- Consumes: `useProfileStore()`, `getPlan()` (Task 1), `Task`/`Roadmap` types from `@shared/types`.
- Produces:
  - `<NextActionCard task={Task | null} onToggleDone: (id: string) => void />` — sticky card at
    the top of `/roadmap`, shows the task title/why/due date and a checkbox; if `task` is `null`
    (everything done), shows a real completion message, not an empty husk.
  - `<Timeline tasks={Task[]} phases={Roadmap["phases"]} onToggleDone: (id: string) => void />`
    — groups tasks by phase with real phase headings ("Now", "Autumn", "Winter", "Spring",
    "After you submit"), each task showing title/why/due/source-or-demo badge and a checkbox.
  - `<ProfileDrawer answers={Answers} onChange: (partial: Partial<Answers>) => void />` — a
    shadcn `Sheet` triggered from the header, editable budget/countries/exam scores (the fields
    that most visibly change results per SPEC.md §2), calling `onChange` live so the underlying
    `getPlan()` recomputes without a page reload.
  - `/roadmap` wires `NextActionCard` + `Timeline` + `ProfileDrawer` together: editing the
    drawer's fields updates `useProfileStore().answers`, which must cause `getPlan(answers)` to
    re-run and the timeline/next-action to visibly update in the same render (no manual refresh).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/components/roadmap/NextActionCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NextActionCard } from "./NextActionCard";
import type { Task } from "@shared/types";

const task: Task = {
  id: "exam-ielts-1", category: "exam", title: "Register for IELTS",
  why: "Imperial College requires IELTS 6.5+", due: "2026-11-01",
  programIds: ["imperial-computing"], sourceUrl: "https://imperial.ac.uk", done: false,
};

describe("NextActionCard", () => {
  it("shows the task title and calls onToggleDone when checked", () => {
    const onToggleDone = vi.fn();
    render(<NextActionCard task={task} onToggleDone={onToggleDone} />);
    expect(screen.getByText("Register for IELTS")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggleDone).toHaveBeenCalledWith("exam-ielts-1");
  });

  it("shows a real completion message when task is null", () => {
    render(<NextActionCard task={null} onToggleDone={vi.fn()} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByText(/done|complete/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/web && npm test -- NextActionCard` — expected: FAIL, module not found.

- [ ] **Step 3: Implement roadmap components, ProfileDrawer, and the page**

Build `NextActionCard` and `Timeline` first (straightforward props-in, JSX-out). Then
`ProfileDrawer`: a `Sheet` (shadcn) containing editable controls for `budgetUsdYear` (Slider or
RadioGroup, matching the questionnaire's own control for that field — reuse the same markup
pattern from Task 3, don't invent a second one), `countries` (checkboxes), and `ielts`/`sat`
score inputs, calling `onChange` on every edit (not just on a "Save" button — the case's own
jury script edits and expects immediate reaction).

`/roadmap/page.tsx`: reads `answers` from `useProfileStore()`, computes `const plan =
getPlan(answers)` directly in the component body (no extra memoization needed — `buildMockPlan`
runs in well under a frame), renders `<StepIndicator current={6} .../>`, `<ProfileDrawer
answers={answers} onChange={setAnswers} />` trigger, `<NextActionCard
task={plan.roadmap.tasks.find(t => t.id === plan.roadmap.nextActionTaskId) ?? null}
onToggleDone={toggleTaskDone} />`, then `<Timeline tasks={plan.roadmap.tasks}
phases={plan.roadmap.phases} onToggleDone={toggleTaskDone} />`. Because `answers` comes from the
store and `getPlan` is a pure function of it, editing the drawer re-renders this component with a
new `plan` automatically — verify this is actually true when you manually test it, not just
structurally plausible.

Add the `ProfileDrawer` trigger to `AppShell`'s header, but only rendered on
`/diagnosis`, `/recommendations`, `/compare`, and `/roadmap` (check `usePathname()` from
`next/navigation`; on `/` and `/profile` it should not appear — SPEC.md §2 places it "from step 3
onward").

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- NextActionCard` — expected: PASS.

- [ ] **Step 5: Manual check — this is the case's central jury test, verify it for real**

`npm run dev`, go to `/roadmap` at 375px width, open the profile drawer, change the budget to the
lowest band and change countries to a single cheap country. Confirm: the timeline's tasks
visibly change (different programs' deadlines/documents), the next action may change, and this
happens without a page reload. Then tick a task's checkbox and confirm the next action advances
and would-be progress % moves. Refresh the page and confirm the ticked task is still ticked.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/roadmap apps/web/components/roadmap apps/web/components/shell/ProfileDrawer.tsx apps/web/components/shell/AppShell.tsx
git commit -m "feat(web): roadmap, next action, and reactive profile drawer"
```
