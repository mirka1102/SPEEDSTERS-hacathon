import { describe, it, expect } from 'vitest';
import { mapProfileRow, mapProgramRow, toProfileRow } from '../mappers';

describe('mapProgramRow', () => {
  it('maps every snake_case column to the camelCase Program shape', () => {
    const row = {
      id: 'tum-informatics',
      university: 'TUM',
      program: 'Informatics',
      country: 'DE',
      city: 'Munich',
      field: 'cs',
      language: 'en',
      tuition_usd_year: 0,
      living_usd_year: 12000,
      scholarship_available: false,
      scholarship_note: null,
      gpa_min_4: '3.60', // Postgres NUMERIC comes back as a string from postgrest
      ielts_min: '6.50',
      toefl_min: 88,
      sat_required: false,
      sat_min: null,
      other_requirements: null,
      selectivity: 2,
      application_deadline: '2027-05-31',
      intake: 'Fall 2027',
      source_url: 'https://tum.de',
      data_status: 'verified',
      image_url: null,
      campus_life_note: 'Major tech hub city.',
    };

    const program = mapProgramRow(row as never);
    expect(program.tuitionUsdYear).toBe(0);
    expect(program.livingUsdYear).toBe(12000);
    expect(program.scholarshipAvailable).toBe(false);
    // The whole point of this test: these must come back as numbers, not "3.60"/"6.50" strings,
    // or every downstream score comparison (`answers.gpa >= program.gpaMin4`) silently breaks.
    expect(program.gpaMin4).toBe(3.6);
    expect(typeof program.gpaMin4).toBe('number');
    expect(program.ieltsMin).toBe(6.5);
    expect(program.otherRequirements).toEqual([]);
  });
});

describe('mapProfileRow / toProfileRow', () => {
  it('round-trips a profile through snake_case columns and back', () => {
    const row = toProfileRow({
      id: 'p1',
      answers: { fields: ['cs'] } as never,
      selectedPrograms: ['a', 'b'],
      favorites: ['c'],
      progress: { t1: '2026-01-01T00:00:00.000Z' },
    });
    expect(row.selected_programs).toEqual(['a', 'b']);
    expect(row).not.toHaveProperty('selectedPrograms');

    const mapped = mapProfileRow({
      id: 'p1',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
      answers: { fields: ['cs'] } as never,
      selected_programs: ['a', 'b'],
      favorites: ['c'],
      progress: { t1: '2026-01-01T00:00:00.000Z' },
    });
    expect(mapped.selectedPrograms).toEqual(['a', 'b']);
    expect(mapped.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('defaults null array/object columns to empty rather than passing null through', () => {
    const mapped = mapProfileRow({
      id: 'p1',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      answers: {} as never,
      selected_programs: null,
      favorites: null,
      progress: null,
    });
    expect(mapped.selectedPrograms).toEqual([]);
    expect(mapped.favorites).toEqual([]);
    expect(mapped.progress).toEqual({});
  });
});
