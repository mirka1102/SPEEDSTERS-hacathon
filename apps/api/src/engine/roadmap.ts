import { Answers, Recommendation, Roadmap, Task } from '../../../../packages/shared/types';

export function generateRoadmap(answers: Answers, selected: Recommendation[]): Roadmap {
    const tasks: Task[] = [];
    
    tasks.push({
        id: 'exam-prep',
        category: 'exam',
        title: 'Prepare for IELTS',
        why: 'Required by matched programs',
        due: '2026-11-01',
        programIds: selected.map(r => r.program.id),
        sourceUrl: 'demo',
        done: false
    });

    tasks.push({
        id: 'apply',
        category: 'deadline',
        title: 'Submit Application',
        why: 'Approaching deadline',
        due: '2027-01-15',
        programIds: selected.map(r => r.program.id),
        sourceUrl: 'demo',
        done: false
    });

    return {
        tasks,
        phases: { now: ['exam-prep'], autumn: [], winter: ['apply'], spring: [], after_submission: [] },
        nextActionTaskId: 'exam-prep',
        progressPct: 0
    };
}
