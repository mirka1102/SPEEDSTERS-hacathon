/**
 * One-time seed: reads data/programs.json (camelCase, matching packages/shared/types.ts) and
 * upserts it into Supabase's `programs` table (snake_case columns, supabase/schema.sql).
 *
 * Run with real SUPABASE_URL / SUPABASE_ANON_KEY set in apps/api/.env:
 *   cd apps/api && npx tsx scripts/seed-programs.ts
 *
 * Safe to re-run — upserts by `id`, so editing data/programs.json and re-running updates
 * existing rows instead of duplicating them.
 */
import fs from 'fs';
import path from 'path';
import { supabase } from '../src/db/supabase';
import type { Program } from '../../../packages/shared/types';

function toRow(p: Program) {
  return {
    id: p.id,
    university: p.university,
    program: p.program,
    country: p.country,
    city: p.city,
    field: p.field,
    language: p.language,
    tuition_usd_year: p.tuitionUsdYear,
    living_usd_year: p.livingUsdYear,
    scholarship_available: p.scholarshipAvailable,
    scholarship_note: p.scholarshipNote,
    gpa_min_4: p.gpaMin4,
    ielts_min: p.ieltsMin,
    toefl_min: p.toeflMin,
    sat_required: p.satRequired,
    sat_min: p.satMin,
    other_requirements: p.otherRequirements,
    selectivity: p.selectivity,
    application_deadline: p.applicationDeadline,
    intake: p.intake,
    source_url: p.sourceUrl,
    data_status: p.dataStatus,
    image_url: p.imageUrl,
    campus_life_note: p.campusLifeNote,
  };
}

async function main() {
  const dataPath = path.join(__dirname, '../data/programs.json');
  const programs: Program[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const rows = programs.map(toRow);

  const { error, count } = await supabase.from('programs').upsert(rows, { onConflict: 'id', count: 'exact' });
  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
  console.log(`Seeded ${count ?? rows.length} programs.`);
}

main();
