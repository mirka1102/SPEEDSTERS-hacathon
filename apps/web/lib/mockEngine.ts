import type {
  Answers,
  BudgetBand,
  Diagnosis,
  ExamScore,
  FactorScores,
  Field,
  Label,
  Plan,
  Program,
  Recommendation,
  Roadmap,
  RoadmapPhase,
  Task,
} from "@shared/types";

// ---------------------------------------------------------------------------
// Weights (SPEC.md §5 / task-1 brief Step 4)
// ---------------------------------------------------------------------------

export function getWeights(answers: Answers): {
  field: number;
  budget: number;
  academic: number;
  exams: number;
  country: number;
  language: number;
} {
  if (answers.scholarshipNeed === "essential") {
    return { field: 0.2, budget: 0.32, academic: 0.15, exams: 0.15, country: 0.1, language: 0.08 };
  }
  return { field: 0.25, budget: 0.25, academic: 0.15, exams: 0.15, country: 0.12, language: 0.08 };
}

// ---------------------------------------------------------------------------
// Factor scores
// ---------------------------------------------------------------------------

const ADJACENT_FIELD: Partial<Record<Field, Field>> = {
  cs: "eng",
  eng: "cs",
  business: "natsci",
  natsci: "business",
};

function fieldScore(fields: Field[], programField: Program["field"]): number {
  if (fields.includes("undecided")) return 0.7;
  if (fields.includes(programField)) return 1;
  if (fields.some((f) => ADJACENT_FIELD[f] === programField)) return 0.6;
  return 0;
}

const BUDGET_BAND_USD: Record<BudgetBand, number> = {
  "<5k": 5000,
  "5-15k": 15000,
  "15-30k": 30000,
  "30-50k": 50000,
  "50k+": 80000,
};

function budgetScore(answers: Answers, program: Program): number {
  const cost = program.tuitionUsdYear + program.livingUsdYear;
  const budgetNumber = BUDGET_BAND_USD[answers.budgetUsdYear];
  const ratio = cost === 0 ? 2 : budgetNumber / cost;
  let score = Math.min(1, ratio);
  if (score < 1 && program.scholarshipAvailable) {
    score = Math.min(1, score + 0.25);
  }
  return score;
}

function academicScore(answers: Answers, program: Program): number {
  const diff = answers.gpa - program.gpaMin4;
  let score = diff >= 0.3 ? 1 : diff >= 0 ? 0.8 : diff >= -0.3 ? 0.5 : 0.2;
  if (answers.achievements === "national" || answers.achievements === "international") {
    score = Math.min(1, score + 0.1);
  }
  return score;
}

function examComponentScore(exam: ExamScore | null, min: number | null): number {
  if (min == null) return 1; // no requirement -> contributes 1
  if (exam == null) return 0.2;
  if ("status" in exam) return exam.status === "planning" ? 0.4 : 0.2;
  return exam.value >= min ? 1 : 0.5;
}

function examsScore(answers: Answers, program: Program): number {
  let englishComponent: number;
  if (program.ieltsMin == null && program.toeflMin == null) {
    englishComponent = 1;
  } else {
    const candidates: number[] = [];
    if (program.ieltsMin != null) candidates.push(examComponentScore(answers.ielts, program.ieltsMin));
    if (program.toeflMin != null) candidates.push(examComponentScore(answers.toefl, program.toeflMin));
    englishComponent = Math.max(...candidates);
  }
  const satComponent = program.satRequired ? examComponentScore(answers.sat, program.satMin) : 1;
  return (englishComponent + satComponent) / 2;
}

function countryScore(answers: Answers, program: Program): number {
  if ((answers.countries as string[]).includes(program.country)) return 1;
  if (answers.countries.includes("open_to_any")) return 0.7;
  return 0.2;
}

function hasOtherLanguageAtB1Plus(answers: Answers, language: string): boolean {
  return answers.otherLanguages.some(
    (o) => o.language === language && (o.level === "B1" || o.level === "B2" || o.level === "C1"),
  );
}

function languageScore(answers: Answers, program: Program): number {
  if (program.language === "en") {
    const ieltsOk = !!answers.ielts && "value" in answers.ielts && answers.ielts.value >= 6;
    const toeflOk = !!answers.toefl && "value" in answers.toefl && answers.toefl.value >= 80;
    const selfOk = answers.englishSelf === "B2" || answers.englishSelf === "C1";
    if (ieltsOk || toeflOk || selfOk) return 1;
    if (answers.englishSelf === "B1") return 0.6;
    return 0.3;
  }
  return hasOtherLanguageAtB1Plus(answers, program.language) ? 0.8 : 0.3;
}

function computeFactors(answers: Answers, program: Program): FactorScores {
  return {
    field: fieldScore(answers.fields, program.field),
    budget: budgetScore(answers, program),
    academic: academicScore(answers, program),
    exams: examsScore(answers, program),
    country: countryScore(answers, program),
    language: languageScore(answers, program),
  };
}

// ---------------------------------------------------------------------------
// Hard filters
// ---------------------------------------------------------------------------

function passesHardFilters(answers: Answers, program: Program): boolean {
  if (fieldScore(answers.fields, program.field) === 0) return false;
  if (answers.studyLanguage === "english_only" && program.language !== "en") {
    if (!hasOtherLanguageAtB1Plus(answers, program.language)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

function labelFor(program: Program, factors: FactorScores): Label {
  if (program.selectivity === 1 || factors.academic < 0.8 || factors.exams < 0.5) return "reach";
  if (program.selectivity === 3 && factors.academic === 1 && factors.exams >= 0.8 && factors.budget >= 0.9) {
    return "safety";
  }
  return "match";
}

// ---------------------------------------------------------------------------
// Scoring + selection
// ---------------------------------------------------------------------------

/**
 * Scores one program in isolation against the current answers — used by
 * Favorites (SPEC.md §10), which shows bookmarked programs independent of
 * whatever made it into the top recommendations, but still needs an honest,
 * up-to-date fit score for each rather than a fake placeholder.
 */
export function scoreProgramForAnswers(answers: Answers, program: Program): Recommendation {
  return scoreProgram(answers, program, getWeights(answers));
}

function scoreProgram(
  answers: Answers,
  program: Program,
  weights: ReturnType<typeof getWeights>,
): Recommendation {
  const factors = computeFactors(answers, program);
  const weightedSum =
    factors.field * weights.field +
    factors.budget * weights.budget +
    factors.academic * weights.academic +
    factors.exams * weights.exams +
    factors.country * weights.country +
    factors.language * weights.language;
  const fitScore = Math.round(weightedSum * 100);
  return { program, factors, fitScore, label: labelFor(program, factors) };
}

function scorePrograms(answers: Answers, programs: Program[]): Recommendation[] {
  const weights = getWeights(answers);
  const passingPrograms = programs.filter((p) => passesHardFilters(answers, p));
  const passingScored = passingPrograms.map((p) => scoreProgram(answers, p, weights));

  if (passingScored.length >= 3) return passingScored;

  // SPEC.md §5 fallback: "If fewer than 3 remain, relax filters and mark results stretch: true."
  // Backfill from the programs the hard filter dropped, best-fit first, marking each as stretch.
  const passingIds = new Set(passingPrograms.map((p) => p.id));
  const needed = 3 - passingScored.length;
  const relaxedScored = programs
    .filter((p) => !passingIds.has(p.id))
    .map((p) => ({ ...scoreProgram(answers, p, weights), stretch: true as const }))
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, needed);

  return [...passingScored, ...relaxedScored];
}

function selectRecommendations(scored: Recommendation[]): Recommendation[] {
  const sorted = [...scored].sort((a, b) => b.fitScore - a.fitScore);
  if (sorted.length <= 3) return sorted;

  let top3 = sorted.slice(0, 3);
  let pool = sorted.slice(3);
  const labels = new Set(top3.map((r) => r.label));
  if (labels.size === 1) {
    const targetLabel = top3[2].label;
    const idx = pool.findIndex((r) => r.label !== targetLabel && r.fitScore >= 55);
    if (idx !== -1) {
      const candidate = pool[idx];
      const displaced = top3[2];
      top3 = [top3[0], top3[1], candidate];
      pool = [...pool.slice(0, idx), displaced, ...pool.slice(idx + 1)];
    }
  }
  const rest = pool.slice(0, 3);
  return [...top3, ...rest].sort((a, b) => b.fitScore - a.fitScore);
}

// ---------------------------------------------------------------------------
// Diagnosis
// ---------------------------------------------------------------------------

function averageFactor(recommendations: Recommendation[], key: keyof FactorScores): number {
  if (recommendations.length === 0) return 0;
  return recommendations.reduce((sum, r) => sum + r.factors[key], 0) / recommendations.length;
}

function addDaysToDate(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function buildDiagnosis(
  answers: Answers,
  totalProgramsConsidered: number,
  allScored: Recommendation[],
  top3: Recommendation[],
): Diagnosis {
  const strengths: Diagnosis["strengths"] = [];
  const limitations: Diagnosis["limitations"] = [];

  if (averageFactor(top3, "field") >= 0.8) strengths.push({ key: "field_match" });
  if (averageFactor(top3, "budget") >= 0.8) strengths.push({ key: "budget_comfortable" });
  if (averageFactor(top3, "academic") >= 0.8) strengths.push({ key: "academic_strong" });
  if (averageFactor(top3, "exams") >= 0.8) {
    if (answers.ielts && "value" in answers.ielts) {
      strengths.push({ key: "ielts_strong", value: answers.ielts.value });
    } else if (answers.sat && "value" in answers.sat) {
      strengths.push({ key: "sat_strong", value: answers.sat.value });
    } else {
      strengths.push({ key: "exam_ready" });
    }
  }
  if (averageFactor(top3, "country") >= 0.8) {
    strengths.push({ key: answers.countries.includes("open_to_any") ? "country_flexible" : "country_match" });
  }
  if (averageFactor(top3, "language") >= 0.8) strengths.push({ key: "language_ready" });

  if (averageFactor(top3, "exams") <= 0.4) {
    const satMissing = answers.sat == null || "status" in answers.sat;
    if (satMissing) limitations.push({ key: "no_sat" });
  }
  if (averageFactor(top3, "budget") <= 0.4) limitations.push({ key: "budget_tight" });
  if (averageFactor(top3, "academic") <= 0.4) limitations.push({ key: "gpa_below_median" });
  if (
    averageFactor(top3, "language") <= 0.4 &&
    answers.englishSelf == null &&
    answers.ielts == null &&
    answers.toefl == null
  ) {
    limitations.push({ key: "english_untested" });
  }
  const fourMonthsFromNow = addDaysToDate(new Date(), 120);
  const soonDeadline = top3.find((r) => new Date(r.program.applicationDeadline) <= fourMonthsFromNow);
  if (soonDeadline) {
    limitations.push({ key: "late_timeline", value: soonDeadline.program.applicationDeadline });
  }

  const fitPrograms = allScored.filter((r) => r.fitScore >= 55);
  const cheapestFitCostUsd = fitPrograms.length
    ? Math.min(...fitPrograms.map((r) => r.program.tuitionUsdYear + r.program.livingUsdYear))
    : null;

  return {
    strengths,
    limitations,
    goal: { fields: answers.fields, countries: answers.countries, intake: answers.intake },
    stats: {
      programsConsidered: totalProgramsConsidered,
      programsFit: fitPrograms.length,
      cheapestFitCostUsd,
    },
  };
}

// ---------------------------------------------------------------------------
// Roadmap
// ---------------------------------------------------------------------------

type DraftTask = Omit<Task, "id" | "done">;

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function clampFuture(iso: string, todayIso: string): string {
  return iso < todayIso ? todayIso : iso;
}

type ExamTaskState = "missing" | "planning" | "below" | "ok" | "not_required";

function examTaskState(answer: ExamScore | null, min: number | null): ExamTaskState {
  if (min == null) return "not_required";
  if (answer == null) return "missing";
  if ("status" in answer) return answer.status === "planning" ? "planning" : "missing";
  return answer.value >= min ? "ok" : "below";
}

const STATE_RANK: Record<ExamTaskState, number> = {
  missing: 0,
  planning: 1,
  below: 2,
  ok: 3,
  not_required: 3,
};

function bestExamState(states: ExamTaskState[]): ExamTaskState {
  return states.reduce((best, s) => (STATE_RANK[s] > STATE_RANK[best] ? s : best));
}

function englishTaskFor(state: ExamTaskState): { title: string; offset: number } | null {
  switch (state) {
    case "missing":
      return { title: "Сдать экзамен по английскому (IELTS или TOEFL)", offset: 90 };
    case "planning":
      return { title: "Сдать запланированный экзамен по английскому", offset: 45 };
    case "below":
      return { title: "Пересдать экзамен по английскому, чтобы поднять балл", offset: 60 };
    default:
      return null;
  }
}

function satTaskFor(state: ExamTaskState): { title: string; offset: number } | null {
  switch (state) {
    case "missing":
      return { title: "Зарегистрироваться и сдать SAT", offset: 90 };
    case "planning":
      return { title: "Сдать запланированный SAT", offset: 45 };
    case "below":
      return { title: "Пересдать SAT, чтобы поднять балл", offset: 60 };
    default:
      return null;
  }
}

function programTasks(program: Program, answers: Answers, todayIso: string): DraftTask[] {
  const tasks: DraftTask[] = [];
  const deadline = program.applicationDeadline;

  if (program.ieltsMin != null || program.toeflMin != null) {
    const states: ExamTaskState[] = [];
    if (program.ieltsMin != null) states.push(examTaskState(answers.ielts, program.ieltsMin));
    if (program.toeflMin != null) states.push(examTaskState(answers.toefl, program.toeflMin));
    const state = bestExamState(states);
    const englishTask = englishTaskFor(state);
    if (englishTask) {
      tasks.push({
        category: "exam",
        title: englishTask.title,
        why: `${program.university} (${program.program}) требует балл за английский, которого пока нет.`,
        due: clampFuture(addDays(deadline, -englishTask.offset), todayIso),
        programIds: [program.id],
        sourceUrl: program.sourceUrl,
      });
    }
  }

  if (program.satRequired) {
    const state = examTaskState(answers.sat, program.satMin);
    const satTask = satTaskFor(state);
    if (satTask) {
      tasks.push({
        category: "exam",
        title: satTask.title,
        why: `${program.university} (${program.program}) требует SAT.`,
        due: clampFuture(addDays(deadline, -satTask.offset), todayIso),
        programIds: [program.id],
        sourceUrl: program.sourceUrl,
      });
    }
  }

  tasks.push({
    category: "document",
    title: `Подготовить документы для поступления в ${program.university}`,
    why: `Нужно для подачи на ${program.program} в ${program.university}.`,
    due: clampFuture(addDays(deadline, -30), todayIso),
    programIds: [program.id],
    sourceUrl: program.sourceUrl,
  });

  tasks.push({
    category: "deadline",
    title: `Подать заявку в ${program.university}`,
    why: `Дедлайн подачи заявки на ${program.program}.`,
    due: deadline,
    programIds: [program.id],
    sourceUrl: program.sourceUrl,
  });

  if (answers.gpa < program.gpaMin4) {
    tasks.push({
      category: "academic",
      title: "Подтянуть средний балл (GPA) перед подачей",
      why: "Твой текущий GPA ниже минимума, который требуют некоторые из подходящих программ.",
      due: clampFuture(addDays(deadline, -120), todayIso),
      programIds: [program.id],
      sourceUrl: "demo",
    });
  }

  if (answers.scholarshipNeed !== "not_needed" && program.scholarshipAvailable) {
    tasks.push({
      category: "finance",
      title: `Подать заявку на стипендию ${program.university}`,
      why: program.scholarshipNote ?? `Для ${program.program} доступна стипендия.`,
      due: clampFuture(addDays(deadline, -45), todayIso),
      programIds: [program.id],
      sourceUrl: program.sourceUrl,
    });
  }

  return tasks;
}

const FIELD_ACTIVITIES: Record<Field, [string, string]> = {
  cs: ["Собрать и опубликовать код-проект на GitHub", "Поучаствовать в хакатоне или опенсорс-проекте"],
  eng: [
    "Сделать практический проект (робототехника, CAD или прототип)",
    "Вступить в инженерный кружок или соревнование",
  ],
  business: [
    "Запустить небольшой предпринимательский проект или кейс-чемпионат",
    "Пройти онлайн-курс по бизнесу или финансам",
  ],
  natsci: [
    "Поучаствовать в олимпиаде по естественным наукам или в исследовательском проекте",
    "Пройти онлайн-курс по своему научному направлению",
  ],
  design: ["Собрать портфолио из 3-5 дизайн-проектов", "Поучаствовать в конкурсе по дизайну или искусству"],
  undecided: [
    "Попробовать короткий онлайн-курс по каждому направлению, которое рассматриваешь",
    "Пообщаться с человеком, который работает в интересном тебе направлении",
  ],
};

function activityTasks(programs: Program[], answers: Answers, todayIso: string): DraftTask[] {
  const primaryField: Field = answers.fields.includes("undecided") ? "undecided" : answers.fields[0] ?? "undecided";
  const [first, second] = FIELD_ACTIVITIES[primaryField];
  const due = clampFuture(addDays(todayIso, 14), todayIso);
  const programIds = programs.map((p) => p.id);
  const why = "Усиливает твою подготовку по этому направлению.";

  const tasks: DraftTask[] = [
    { category: "activity", title: first, why, due, programIds, sourceUrl: "demo" },
    { category: "activity", title: second, why, due, programIds, sourceUrl: "demo" },
  ];

  if (answers.activities.includes("none")) {
    tasks.push({
      category: "activity",
      title: "Начать любую внеучебную активность, чтобы усилить профиль",
      why: "Ты пока не отметил активностей, а приёмные комиссии ценят реальную вовлечённость.",
      due,
      programIds: [],
      sourceUrl: "demo",
    });
  }

  return tasks;
}

function buildPhases(tasks: Task[], programs: Program[]): Record<RoadmapPhase, string[]> {
  const phases: Record<RoadmapPhase, string[]> = { now: [], autumn: [], winter: [], spring: [], after_submission: [] };
  if (tasks.length === 0) return phases;

  const today = new Date();
  const nowEnd = addDaysToDate(today, 42);
  const nowEndMs = nowEnd.getTime();

  // The boundary for "after_submission" is the EARLIEST application deadline among the selected
  // programs, not the latest task due date in this list (which can never exceed its own max).
  // Anything due after that first deadline is effectively post-submission for that program —
  // e.g. a second program's later deadline, or a follow-up task, once you've already applied.
  const deadlineMsList = programs.map((p) => new Date(p.applicationDeadline).getTime());
  const earliestDeadlineMs = deadlineMsList.length > 0 ? Math.min(...deadlineMsList) : nowEndMs;

  const span = Math.max(0, earliestDeadlineMs - nowEndMs);
  const autumnEndMs = nowEndMs + span / 3;
  const winterEndMs = nowEndMs + (2 * span) / 3;

  for (const task of tasks) {
    const dueMs = new Date(task.due).getTime();
    if (dueMs > earliestDeadlineMs) phases.after_submission.push(task.id);
    else if (dueMs <= nowEndMs) phases.now.push(task.id);
    else if (dueMs <= autumnEndMs) phases.autumn.push(task.id);
    else if (dueMs <= winterEndMs) phases.winter.push(task.id);
    else phases.spring.push(task.id);
  }
  return phases;
}

function buildRoadmap(topPrograms: Program[], answers: Answers): Roadmap {
  const todayIso = new Date().toISOString().slice(0, 10);
  const drafts: DraftTask[] = [];

  for (const program of topPrograms) {
    drafts.push(...programTasks(program, answers, todayIso));
  }
  drafts.push(...activityTasks(topPrograms, answers, todayIso));

  const merged = new Map<string, DraftTask>();
  for (const draft of drafts) {
    const key = `${draft.category}::${draft.title}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...draft, programIds: [...draft.programIds] });
    } else {
      const programIds = Array.from(new Set([...existing.programIds, ...draft.programIds]));
      const due = draft.due < existing.due ? draft.due : existing.due;
      merged.set(key, { ...existing, programIds, due });
    }
  }

  const sortedDrafts = Array.from(merged.values()).sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));

  const tasks: Task[] = sortedDrafts.map((draft, index) => ({
    ...draft,
    id: `${draft.category}-${draft.programIds[0] ?? "general"}-${index}`,
    done: false,
  }));

  const phases = buildPhases(tasks, topPrograms);
  const nextActionTaskId = tasks.length > 0 ? tasks[0].id : null;
  // A freshly built plan has no persisted progress yet (that lives in the store), so every task
  // starts undone and progressPct is always 0 here.
  const progressPct = 0;

  return { tasks, phases, nextActionTaskId, progressPct };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * `selectedIds` mirrors PlanRequest.selected (SPEC.md §7): once the user has
 * chosen programs in Compare, the roadmap is built for *those*, not the
 * algorithmic top 3 — picking a safety + a reach shouldn't silently roadmap
 * only whichever scored highest. Falls back to top 3 before any selection
 * exists (Diagnosis/Recommendations, which call this with no third argument).
 */
export function buildMockPlan(answers: Answers, programs: Program[], selectedIds?: string[]): Plan {
  const scored = scorePrograms(answers, programs);
  const recommendations = selectRecommendations(scored);
  const top3 = recommendations.slice(0, 3);
  const diagnosis = buildDiagnosis(answers, programs.length, scored, top3);

  const roadmapPrograms =
    selectedIds && selectedIds.length > 0
      ? programs.filter((p) => selectedIds.includes(p.id))
      : top3.map((r) => r.program);
  const roadmap = buildRoadmap(roadmapPrograms, answers);

  return { diagnosis, recommendations, roadmap };
}
