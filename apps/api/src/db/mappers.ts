import { Answers, Profile, Program } from '../../../../packages/shared/types';

// supabase-js returns raw Postgres rows in snake_case (per supabase/schema.sql), but every other
// part of the app (the engine, apps/web) speaks the camelCase shapes in packages/shared/types.ts.
// Without this mapping, every Program fetched from a real database would have `undefined`
// tuition/GPA/etc. and every score would come out NaN. Postgres NUMERIC columns (gpa_min_4,
// ielts_min) also come back as strings from postgrest, not numbers, so those need Number(...).

type ProgramRow = {
  id: string;
  university: string;
  program: string;
  country: string;
  city: string;
  field: string;
  language: string;
  tuition_usd_year: number;
  living_usd_year: number;
  scholarship_available: boolean;
  scholarship_note: string | null;
  gpa_min_4: string | number;
  ielts_min: string | number | null;
  toefl_min: number | null;
  sat_required: boolean;
  sat_min: number | null;
  other_requirements: string[] | null;
  selectivity: number;
  application_deadline: string;
  intake: string;
  source_url: string;
  data_status: string;
  image_url: string | null;
  campus_life_note: string | null;
};

export function mapProgramRow(row: ProgramRow): Program {
  return {
    id: row.id,
    university: row.university,
    program: row.program,
    country: row.country as Program['country'],
    city: row.city,
    field: row.field as Program['field'],
    language: row.language as Program['language'],
    tuitionUsdYear: row.tuition_usd_year,
    livingUsdYear: row.living_usd_year,
    scholarshipAvailable: row.scholarship_available,
    scholarshipNote: row.scholarship_note,
    gpaMin4: Number(row.gpa_min_4),
    ieltsMin: row.ielts_min != null ? Number(row.ielts_min) : null,
    toeflMin: row.toefl_min,
    satRequired: row.sat_required,
    satMin: row.sat_min,
    otherRequirements: row.other_requirements ?? [],
    selectivity: row.selectivity as Program['selectivity'],
    applicationDeadline: row.application_deadline,
    intake: row.intake as Program['intake'],
    sourceUrl: row.source_url,
    dataStatus: row.data_status as Program['dataStatus'],
    imageUrl: row.image_url,
    campusLifeNote: row.campus_life_note,
  };
}

type ProfileRow = {
  id: string;
  created_at: string;
  updated_at: string;
  answers: Answers;
  selected_programs: string[] | null;
  favorites: string[] | null;
  progress: Record<string, string> | null;
};

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    answers: row.answers,
    selectedPrograms: row.selected_programs ?? [],
    favorites: row.favorites ?? [],
    progress: row.progress ?? {},
  };
}

/** camelCase Profile fields -> snake_case columns, for inserts/updates. */
export function toProfileRow(partial: Partial<Profile>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (partial.id !== undefined) row.id = partial.id;
  if (partial.answers !== undefined) row.answers = partial.answers;
  if (partial.selectedPrograms !== undefined) row.selected_programs = partial.selectedPrograms;
  if (partial.favorites !== undefined) row.favorites = partial.favorites;
  if (partial.progress !== undefined) row.progress = partial.progress;
  return row;
}
