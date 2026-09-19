# supabase/ — schema

`schema.sql` has the `programs` and `profiles` tables from `docs/SPEC.md` §4 (includes the §10
additions: `programs.image_url`, `programs.campus_life_note`, `profiles.favorites`). Applied to a
live Supabase project; `programs` is seeded from `apps/api/data/programs.json` via
`apps/api/scripts/seed-programs.ts` (`npm run seed` in `apps/api`), re-runnable and safe to repeat
after editing that file.
