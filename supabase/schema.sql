-- SPEEDSTERS-hacathon Supabase Schema
-- Based on docs/SPEC.md

-- Enums (for documentation purposes, using TEXT for simplicity as specified in PLAN/SPEC unless STRICT is required)

CREATE TABLE programs (
    id TEXT PRIMARY KEY,
    university TEXT NOT NULL,
    program TEXT NOT NULL,
    country TEXT NOT NULL, -- 'US' | 'UK' | 'DE' | 'KR' | 'TR'
    city TEXT NOT NULL,
    field TEXT NOT NULL, -- 'cs' | 'eng' | 'business' | 'natsci' | 'design'
    language TEXT NOT NULL, -- 'en' | 'de' | 'ko' | 'tr'
    tuition_usd_year INTEGER NOT NULL,
    living_usd_year INTEGER NOT NULL,
    scholarship_available BOOLEAN NOT NULL,
    scholarship_note TEXT,
    gpa_min_4 NUMERIC NOT NULL,
    ielts_min NUMERIC,
    toefl_min INTEGER,
    sat_required BOOLEAN NOT NULL,
    sat_min INTEGER,
    other_requirements TEXT[],
    selectivity INTEGER NOT NULL, -- 1 = highly selective, 3 = accessible
    application_deadline DATE NOT NULL,
    intake TEXT NOT NULL,
    source_url TEXT NOT NULL,
    data_status TEXT NOT NULL, -- 'verified' | 'demo'
    image_url TEXT NOT NULL,
    campus_life_note TEXT
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answers JSONB NOT NULL,
    selected_programs TEXT[],
    favorites TEXT[],
    progress JSONB
);
