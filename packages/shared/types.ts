// THE CONTRACT between apps/web and apps/api.
// Source of truth: docs/SPEC.md §3 (questionnaire), §4 (data model), §5 (engine), §7 (API).
// Changing this file requires pinging the other person before merging (see docs/PLAN.md §3).

// ---------- §3 Questionnaire / Answers ----------

export type Grade = "9" | "10" | "11" | "graduated";
export type Intake = "Fall 2027" | "Fall 2028";
export type Field =
  | "cs"
  | "eng"
  | "business"
  | "natsci"
  | "design"
  | "undecided";
export type ExamScore = { value: number } | { status: "planning" | "none" };
export type EnglishSelf = "A2" | "B1" | "B2" | "C1";
export type Country = "US" | "UK" | "DE" | "KR" | "TR";
export type StudyLanguage = "english_only" | "open_to_learning";
export type BudgetBand = "<5k" | "5-15k" | "15-30k" | "30-50k" | "50k+";
export type ScholarshipNeed = "essential" | "preferred" | "not_needed";
export type Activity =
  | "volunteering"
  | "sports"
  | "clubs"
  | "projects"
  | "work"
  | "none";

export interface Answers {
  grade: Grade;
  intake: Intake;
  fields: Field[]; // max 2
  interests: string[]; // free tags, optional
  gpa: number; // KZ 5-point scale, 3.0-5.0
  achievements: "none" | "school" | "regional" | "national" | "international";
  ielts: ExamScore | null;
  toefl: ExamScore | null;
  sat: ExamScore | null;
  englishSelf: EnglishSelf | null; // only asked if no IELTS/TOEFL
  otherLanguages: { language: "de" | "ko" | "tr"; level: "A1" | "A2" | "B1" | "B2" | "C1" }[];
  countries: (Country | "open_to_any")[];
  studyLanguage: StudyLanguage;
  budgetUsdYear: BudgetBand;
  scholarshipNeed: ScholarshipNeed;
  activities: Activity[];
  hoursPerWeek: 2 | 5 | 10 | 15;
}

// ---------- §4 Data model ----------

export interface Program {
  id: string;
  university: string;
  program: string;
  country: Country;
  city: string;
  field: Exclude<Field, "undecided">;
  language: "en" | "de" | "ko" | "tr";
  tuitionUsdYear: number;
  livingUsdYear: number;
  scholarshipAvailable: boolean;
  scholarshipNote: string | null;
  gpaMin4: number;
  ieltsMin: number | null;
  toeflMin: number | null;
  satRequired: boolean;
  satMin: number | null;
  otherRequirements: string[]; // e.g. ["TestAS", "portfolio"]
  selectivity: 1 | 2 | 3; // 1 = highly selective, 3 = accessible
  applicationDeadline: string; // ISO date
  intake: Intake;
  sourceUrl: string;
  dataStatus: "verified" | "demo";
  // §10 additional features
  imageUrl: string | null;
  campusLifeNote: string | null;
}

export interface Profile {
  id: string; // uuid
  createdAt: string;
  updatedAt: string;
  answers: Answers;
  selectedPrograms: string[]; // program ids chosen for compare/roadmap
  favorites: string[]; // §10 bookmarked program ids, independent of selectedPrograms
  progress: Record<string, string>; // { [taskId]: doneAtIso }
}

// ---------- §5 Engine output ----------

export interface FactorScores {
  field: number; // 0..1
  budget: number;
  academic: number;
  exams: number;
  country: number;
  language: number;
}

export type Label = "safety" | "match" | "reach";

export interface Recommendation {
  program: Program;
  factors: FactorScores;
  fitScore: number; // 0..100
  label: Label;
  stretch?: boolean; // true if hard filters were relaxed to reach 3 results
  whyText?: string; // filled by /api/explain; template fallback if absent
}

export interface Diagnosis {
  strengths: { key: string; value?: string | number }[];
  limitations: { key: string; value?: string | number }[];
  goal: { fields: Field[]; countries: (Country | "open_to_any")[]; intake: Intake };
  stats: {
    programsConsidered: number;
    programsFit: number;
    cheapestFitCostUsd: number | null;
  };
  diagnosisText?: string; // filled by /api/explain; template fallback if absent
}

export type TaskCategory =
  | "exam"
  | "document"
  | "deadline"
  | "academic"
  | "activity"
  | "finance";

export interface Task {
  id: string;
  category: TaskCategory;
  title: string;
  why: string;
  due: string; // ISO date
  programIds: string[];
  sourceUrl: string | "demo";
  done: boolean;
}

export type RoadmapPhase = "now" | "autumn" | "winter" | "spring" | "after_submission";

export interface Roadmap {
  tasks: Task[];
  phases: Record<RoadmapPhase, string[]>; // task ids grouped by phase
  nextActionTaskId: string | null;
  progressPct: number; // 0..100
}

export interface Plan {
  diagnosis: Diagnosis;
  recommendations: Recommendation[]; // top 3+, sorted by fitScore desc
  roadmap: Roadmap;
}

// ---------- §7 API ----------

export interface PlanRequest {
  answers: Answers;
  selected?: string[]; // program ids, for /api/plan when re-running after Compare
}

export interface ExplainRequest {
  plan: Plan;
  lang?: "ru" | "en";
}

export interface ExplainResponse {
  diagnosisText: string;
  whyText: Record<string, string>; // programId -> why text
}
