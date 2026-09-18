# apps/api — Altair's app

Not scaffolded yet on purpose — this is your codebase to set up your way (Node + Express + TypeScript,
per `docs/PLAN.md` §1). Start with:

```
npm init -y
npm install express cors dotenv
npm install -D typescript @types/express @types/cors @types/node tsx vitest
```

Read first:
- `docs/SPEC.md` §4 (data model), §5 (engine), §6 (LLM), §7 (API contract), §10 (additional features), and the "Data enrichment" note under §4.
- `docs/PLAN.md` §4 "Altair (`apps/api`)" for the build order.
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
