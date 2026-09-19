# apps/api — backend

Express + TypeScript backend. Setup:

```
npm install
cp .env.example .env   # fill in SUPABASE_URL / SUPABASE_ANON_KEY
npm run seed            # upserts data/programs.json into Supabase
npm run dev              # http://localhost:4000
npm test
```

Read first:
- `docs/SPEC.md` §4 (data model), §5 (engine), §6 (LLM), §7 (API contract), §10 (additional features), and the "Data enrichment" note under §4.
- `docs/PLAN.md` §4 (backend build order).
- `packages/shared/types.ts` — the contract. Import from there (`import type { Program, Plan } from "../../packages/shared/types"`), don't redefine these shapes locally. Ping the other person before changing that file.

Suggested layout (from `docs/PLAN.md`):
```
src/
  server.ts
  routes/       programs.ts  profile.ts  plan.ts  explain.ts
  engine/       score.ts  label.ts  select.ts  diagnosis.ts  roadmap.ts  index.ts  __tests__/
  llm/          prompts.ts  explain.ts  fallback.ts
  db/           supabase.ts  programs.ts  profiles.ts
scripts/
  enrich-programs.ts   (offline, dev-time only — see SPEC.md §4)
data/
  programs.json  SOURCES.md
```
