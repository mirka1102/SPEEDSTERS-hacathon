import { Answers, ExamScore, Field, Program, RoadmapPhase, Roadmap, Task } from '../../../../packages/shared/types';

// Mirrors apps/web/lib/mockEngine.ts's buildRoadmap (SPEC.md §5): dated tasks per selected
// program (exam prep, documents, deadline, GPA gap, scholarship) plus generic activity tasks,
// deduped, sorted by due date, and grouped into phases.

type DraftTask = Omit<Task, 'id' | 'done'>;

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function clampFuture(iso: string, todayIso: string): string {
  return iso < todayIso ? todayIso : iso;
}

type ExamTaskState = 'missing' | 'planning' | 'below' | 'ok' | 'not_required';

function examTaskState(answer: ExamScore | null, min: number | null): ExamTaskState {
  if (min == null) return 'not_required';
  if (answer == null) return 'missing';
  if ('status' in answer) return answer.status === 'planning' ? 'planning' : 'missing';
  return answer.value >= min ? 'ok' : 'below';
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
    case 'missing':
      return { title: 'Сдать экзамен по английскому (IELTS или TOEFL)', offset: 90 };
    case 'planning':
      return { title: 'Сдать запланированный экзамен по английскому', offset: 45 };
    case 'below':
      return { title: 'Пересдать экзамен по английскому, чтобы поднять балл', offset: 60 };
    default:
      return null;
  }
}

function satTaskFor(state: ExamTaskState): { title: string; offset: number } | null {
  switch (state) {
    case 'missing':
      return { title: 'Зарегистрироваться и сдать SAT', offset: 90 };
    case 'planning':
      return { title: 'Сдать запланированный SAT', offset: 45 };
    case 'below':
      return { title: 'Пересдать SAT, чтобы поднять балл', offset: 60 };
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
        category: 'exam',
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
        category: 'exam',
        title: satTask.title,
        why: `${program.university} (${program.program}) требует SAT.`,
        due: clampFuture(addDays(deadline, -satTask.offset), todayIso),
        programIds: [program.id],
        sourceUrl: program.sourceUrl,
      });
    }
  }

  tasks.push({
    category: 'document',
    title: `Подготовить документы для поступления в ${program.university}`,
    why: `Нужно для подачи на ${program.program} в ${program.university}.`,
    due: clampFuture(addDays(deadline, -30), todayIso),
    programIds: [program.id],
    sourceUrl: program.sourceUrl,
  });

  tasks.push({
    category: 'deadline',
    title: `Подать заявку в ${program.university}`,
    why: `Дедлайн подачи заявки на ${program.program}.`,
    due: deadline,
    programIds: [program.id],
    sourceUrl: program.sourceUrl,
  });

  if (answers.gpa < program.gpaMin4) {
    tasks.push({
      category: 'academic',
      title: 'Подтянуть средний балл (GPA) перед подачей',
      why: 'Твой текущий GPA ниже минимума, который требуют некоторые из подходящих программ.',
      due: clampFuture(addDays(deadline, -120), todayIso),
      programIds: [program.id],
      sourceUrl: 'demo',
    });
  }

  if (answers.scholarshipNeed !== 'not_needed' && program.scholarshipAvailable) {
    tasks.push({
      category: 'finance',
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
  cs: ['Собрать и опубликовать код-проект на GitHub', 'Поучаствовать в хакатоне или опенсорс-проекте'],
  eng: [
    'Сделать практический проект (робототехника, CAD или прототип)',
    'Вступить в инженерный кружок или соревнование',
  ],
  business: [
    'Запустить небольшой предпринимательский проект или кейс-чемпионат',
    'Пройти онлайн-курс по бизнесу или финансам',
  ],
  natsci: [
    'Поучаствовать в олимпиаде по естественным наукам или в исследовательском проекте',
    'Пройти онлайн-курс по своему научному направлению',
  ],
  design: ['Собрать портфолио из 3-5 дизайн-проектов', 'Поучаствовать в конкурсе по дизайну или искусству'],
  undecided: [
    'Попробовать короткий онлайн-курс по каждому направлению, которое рассматриваешь',
    'Пообщаться с человеком, который работает в интересном тебе направлении',
  ],
};

function activityTasks(programs: Program[], answers: Answers, todayIso: string): DraftTask[] {
  const primaryField: Field = answers.fields.includes('undecided') ? 'undecided' : answers.fields[0] ?? 'undecided';
  const [first, second] = FIELD_ACTIVITIES[primaryField];
  const due = clampFuture(addDays(todayIso, 14), todayIso);
  const programIds = programs.map((p) => p.id);
  const why = 'Усиливает твою подготовку по этому направлению.';

  const tasks: DraftTask[] = [
    { category: 'activity', title: first, why, due, programIds, sourceUrl: 'demo' },
    { category: 'activity', title: second, why, due, programIds, sourceUrl: 'demo' },
  ];

  if (answers.activities.includes('none')) {
    tasks.push({
      category: 'activity',
      title: 'Начать любую внеучебную активность, чтобы усилить профиль',
      why: 'Ты пока не отметил активностей, а приёмные комиссии ценят реальную вовлечённость.',
      due,
      programIds: [],
      sourceUrl: 'demo',
    });
  }

  return tasks;
}

function buildPhases(tasks: Task[], programs: Program[]): Record<RoadmapPhase, string[]> {
  const phases: Record<RoadmapPhase, string[]> = { now: [], autumn: [], winter: [], spring: [], after_submission: [] };
  if (tasks.length === 0) return phases;

  const today = new Date();
  const nowEnd = new Date(today);
  nowEnd.setUTCDate(nowEnd.getUTCDate() + 42);
  const nowEndMs = nowEnd.getTime();

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

export function generateRoadmap(programs: Program[], answers: Answers): Roadmap {
  const todayIso = new Date().toISOString().slice(0, 10);
  const drafts: DraftTask[] = [];

  for (const program of programs) {
    drafts.push(...programTasks(program, answers, todayIso));
  }
  drafts.push(...activityTasks(programs, answers, todayIso));

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
    id: `${draft.category}-${draft.programIds[0] ?? 'general'}-${index}`,
    done: false,
  }));

  const phases = buildPhases(tasks, programs);
  const nextActionTaskId = tasks.length > 0 ? tasks[0].id : null;

  return { tasks, phases, nextActionTaskId, progressPct: 0 };
}
