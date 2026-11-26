import {
  BOX_DAYS,
  XP,
  activeDays,
  addDays,
  gradeQuestion,
  isLessonSkipped,
  isModuleSkipped,
  isQuizSkipped,
  lessonRead,
  lessonSatisfied,
  quizBest,
  quizSatisfied,
  streak,
  todayStr,
  type QuestionResult,
} from '@/features/workpath/logic';
import type { WpQuestion, WpState } from '@/features/workpath/types';
import { parseSdLesson } from './scale/sdLessonBuilder';
import type { SdCurriculum, SdLearnView, SdModule } from './types';

export {
  BOX_DAYS,
  XP,
  activeDays,
  addDays,
  gradeQuestion,
  isLessonSkipped,
  isModuleSkipped,
  isQuizSkipped,
  lessonRead,
  lessonSatisfied,
  quizBest,
  quizSatisfied,
  streak,
  todayStr,
};
export type { QuestionResult };

/**
 * Cấp bậc tạm theo ngưỡng XP của PMP (06 §7: ngưỡng chính thức chốt sau M6).
 * TODO(T4.1/M6): chỉnh ngưỡng khi có XP từ activity.
 */
export const SD_RANKS: [number, string][] = [
  [0, 'Người mới vào nghề'],
  [120, 'Nắm thành phần cơ bản'],
  [350, 'Phân tích được điểm nghẽn'],
  [700, 'Thiết kế khối xây dựng lõi'],
  [1150, 'Xử lý được lỗi phân tán'],
  [1650, 'System Design Strategist'],
];

export function rankOfSd(xp: number): { name: string; toNext: number | null } {
  let name = SD_RANKS[0][1];
  let toNext: number | null = null;
  for (const [threshold, label] of SD_RANKS) {
    if (xp >= threshold) name = label;
    else if (toNext === null) toNext = threshold - xp;
  }
  return { name, toNext };
}

/** Sắp xếp nghiêm ngặt theo (level, order), không theo mã module. */
export function sortedSdModules(c: SdCurriculum): SdModule[] {
  return [...c.modules].sort((a, b) => a.level - b.level || a.order - b.order);
}

/** Một activity được coi là hoàn thành cổng (gate) khi đã passed, skipped hoặc đã xem lời giải (06 §4). */
export function isActivitySatisfied(s: WpState, activityId: string): boolean {
  const rec = s.exercises[activityId];
  if (!rec) return false;
  return rec.status === 'passed' || rec.status === 'skipped' || Boolean(rec.solutionViewed);
}

/** Lấy danh sách activityId có `gate: 'required'` trong lesson.md của module. */
export function requiredActivityIdsOfModule(m: SdModule): string[] {
  const steps = parseSdLesson(m.lesson ?? '');
  const out: string[] = [];
  for (const st of steps) {
    if (st.block?.activity && st.block.gate === 'required') {
      out.push(st.block.activity);
    }
  }
  return out;
}

/** Tiến độ một module: đọc xong bài (hoặc bỏ qua), đạt quiz ≥ passQuiz (nếu có quiz) và xong mọi activity required (06 §4). */
export function sdModuleProgress(s: WpState, m: SdModule, passQuiz: number): [number, number] {
  const reqActs = requiredActivityIdsOfModule(m);
  const total = 1 + (m.quiz.length ? 1 : 0) + reqActs.length;
  if (isModuleSkipped(s, m.id)) return [total, total];
  let done = Number(lessonSatisfied(s, m.id));
  if (m.quiz.length) done += Number(quizSatisfied(s, m.id, passQuiz));
  for (const aid of reqActs) {
    if (isActivitySatisfied(s, aid)) done += 1;
  }
  return [done, total];
}

export function sdModuleDone(s: WpState, m: SdModule, passQuiz: number): boolean {
  const [d, t] = sdModuleProgress(s, m, passQuiz);
  return d === t;
}

/** Level của module đầu tiên chưa xong; xong hết thì trả level cao nhất + 1. */
export function sdCurrentLevel(s: WpState, c: SdCurriculum): number {
  const mods = sortedSdModules(c);
  for (const m of mods) if (!sdModuleDone(s, m, c.passQuiz)) return m.level;
  return mods.length ? Math.max(...mods.map((m) => m.level)) + 1 : 0;
}

export function sdDueCards(s: WpState, c: SdCurriculum, moduleId?: string, includeAll = false) {
  const t = todayStr();
  const out: { id: string; front: string; back: string; moduleId: string }[] = [];
  for (const m of sortedSdModules(c)) {
    if (moduleId && m.id !== moduleId) continue;
    if (!(includeAll || moduleId || lessonRead(s, m.id))) continue;
    for (const card of m.cards) {
      const rec = s.cards[card.id];
      if (!rec || rec.due <= t) out.push({ ...card, moduleId: m.id });
    }
  }
  return out;
}

export function sdAllQuestions(c: SdCurriculum): Map<string, WpQuestion> {
  const map = new Map<string, WpQuestion>();
  for (const m of c.modules) for (const q of m.quiz) map.set(q.id, q);
  return map;
}

export type SdSkipTarget =
  | { kind: 'lesson'; id: string }
  | { kind: 'quiz'; id: string }
  | { kind: 'module'; id: string };

export interface SdNextStep {
  text: string;
  view: SdLearnView;
  skipTarget?: SdSkipTarget;
}

export function sdNextSteps(s: WpState, c: SdCurriculum): SdNextStep[] {
  const steps: SdNextStep[] = [];
  for (const m of sortedSdModules(c)) {
    if (sdModuleDone(s, m, c.passQuiz)) continue;
    if (!lessonSatisfied(s, m.id)) {
      steps.push({
        text: `Đọc bài ${m.id} · ${m.title}`,
        view: { name: 'module', id: m.id },
        skipTarget: { kind: 'lesson', id: m.id },
      });
    } else if (m.quiz.length && !quizSatisfied(s, m.id, c.passQuiz)) {
      steps.push({
        text: `Làm quiz ${m.id} (cần ≥ ${Math.round(c.passQuiz * 100)}%)`,
        view: { name: 'quiz', mode: 'module', moduleId: m.id },
        skipTarget: { kind: 'quiz', id: m.id },
      });
    }
    break;
  }

  const due = sdDueCards(s, c).length;
  if (due) steps.push({ text: `Ôn ${due} thẻ đến hạn hôm nay`, view: { name: 'flash' } });
  if (s.quizWrong.length) {
    steps.push({
      text: `Ôn lại ${s.quizWrong.length} câu từng trả lời sai`,
      view: { name: 'quiz', mode: 'review' },
    });
  }
  if (!steps.length) {
    steps.push({
      text: `Bạn đã hoàn thành ${c.modules.length} bài hiện có. Làm quiz trộn để giữ nhịp`,
      view: { name: 'quiz', mode: 'mix' },
    });
  }
  return steps;
}
