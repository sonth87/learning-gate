import {
  BOX_DAYS,
  XP,
  activeDays,
  addDays,
  catalogStatus,
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
import type { PmpCurriculum, PmpLearnView, PmpMindmapLink, PmpModule } from './types';

export {
  BOX_DAYS,
  XP,
  activeDays,
  addDays,
  catalogStatus,
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

export const PMP_RANKS: [number, string][] = [
  [0, 'PM Thực chiến (Đang hiệu chỉnh)'],
  [120, 'Người nắm Khung PMI'],
  [350, 'Tư duy Hệ thống & Giá trị'],
  [700, 'Bậc thầy Tách nhiễu Tình huống'],
  [1150, 'Accountable Servant Leader'],
  [1650, 'PMP® Mindset Strategist'],
];

export function rankOfPmp(xp: number): { name: string; toNext: number | null } {
  let name = PMP_RANKS[0][1];
  let toNext: number | null = null;
  for (const [threshold, label] of PMP_RANKS) {
    if (xp >= threshold) name = label;
    else if (toNext === null) toNext = threshold - xp;
  }
  return { name, toNext };
}

/** Sắp xếp nghiêm ngặt theo (level, order), tuyệt đối KHÔNG theo mã module */
export function sortedPmpModules(c: PmpCurriculum): PmpModule[] {
  return [...c.modules].sort((a, b) => a.level - b.level || a.order - b.order);
}

/**
 * Tiến độ của 1 module PMP:
 * 1) Đọc xong bài học tư duy (hoặc skip)
 * 2) Đạt quiz tự kiểm tra >= 70% (hoặc skip)
 * (Việc khám phá dẫn chứng bên PMP Mindmap được ghi nhận riêng để cộng XP & hiển thị thống kê,
 *  không khoá cứng tiến độ vì trạng thái luyện đề nằm trên origin riêng của Mindmap).
 */
export function pmpModuleProgress(s: WpState, m: PmpModule, passQuiz: number): [number, number] {
  const total = 1 + (m.quiz.length ? 1 : 0);
  if (isModuleSkipped(s, m.id)) return [total, total];
  let done = Number(lessonSatisfied(s, m.id));
  if (m.quiz.length) {
    done += Number(quizSatisfied(s, m.id, passQuiz));
  }
  return [done, total];
}

export function pmpModuleDone(s: WpState, m: PmpModule, passQuiz: number): boolean {
  const [d, t] = pmpModuleProgress(s, m, passQuiz);
  return d === t;
}

export function pmpCurrentLevel(s: WpState, c: PmpCurriculum): number {
  const mods = sortedPmpModules(c);
  for (const m of mods) if (!pmpModuleDone(s, m, c.passQuiz)) return m.level;
  return mods.length ? Math.max(...mods.map((m) => m.level)) + 1 : 0;
}

export function pmpEvidenceVisited(s: WpState, linkId: string): boolean {
  const st = catalogStatus(s, linkId);
  return st === 'done' || st === 'rewritten' || st === 'reading';
}

export function pmpModuleEvidenceProgress(s: WpState, m: PmpModule): [number, number] {
  const ids = m.evidenceLinkIds;
  const done = ids.filter((id) => pmpEvidenceVisited(s, id)).length;
  return [done, ids.length];
}

export function pmpDueCards(s: WpState, c: PmpCurriculum, moduleId?: string, includeAll = false) {
  const t = todayStr();
  const out: { id: string; front: string; back: string; moduleId: string }[] = [];
  for (const m of sortedPmpModules(c)) {
    if (moduleId && m.id !== moduleId) continue;
    if (!(includeAll || moduleId || lessonRead(s, m.id))) continue;
    for (const card of m.cards) {
      const rec = s.cards[card.id];
      if (!rec || rec.due <= t) out.push({ ...card, moduleId: m.id });
    }
  }
  return out;
}

export function pmpAllQuestions(c: PmpCurriculum): Map<string, WpQuestion> {
  const map = new Map<string, WpQuestion>();
  for (const m of c.modules) for (const q of m.quiz) map.set(q.id, q);
  return map;
}

export type PmpSkipTarget =
  | { kind: 'lesson'; id: string }
  | { kind: 'quiz'; id: string }
  | { kind: 'module'; id: string };

export interface PmpNextStep {
  text: string;
  view: PmpLearnView;
  skipTarget?: PmpSkipTarget;
}

export function pmpNextSteps(
  s: WpState,
  c: PmpCurriculum,
  linksMap: Record<string, PmpMindmapLink> | null
): PmpNextStep[] {
  const steps: PmpNextStep[] = [];
  let current: PmpModule | null = null;

  for (const m of sortedPmpModules(c)) {
    if (pmpModuleDone(s, m, c.passQuiz)) continue;
    current = m;
    if (!lessonSatisfied(s, m.id)) {
      steps.push({
        text: `Đọc cẩm nang tư duy ${m.id} · ${m.title}`,
        view: { name: 'module', id: m.id },
        skipTarget: { kind: 'lesson', id: m.id },
      });
    } else if (m.quiz.length && !quizSatisfied(s, m.id, c.passQuiz)) {
      steps.push({
        text: `Tự kiểm tra phản xạ ${m.id} (cần ≥ ${Math.round(c.passQuiz * 100)}%)`,
        view: { name: 'quiz', mode: 'module', moduleId: m.id },
        skipTarget: { kind: 'quiz', id: m.id },
      });
    }
    break;
  }

  if (current && lessonSatisfied(s, current.id) && linksMap) {
    const unvisited = current.evidenceLinkIds.find((id) => !pmpEvidenceVisited(s, id) && linksMap[id]);
    if (unvisited) {
      steps.push({
        text: `Đi xem dẫn chứng bên PMP Mindmap: ${linksMap[unvisited].label}`,
        view: { name: 'module', id: current.id },
      });
    }
  }

  const due = pmpDueCards(s, c).length;
  if (due) steps.push({ text: `Ôn ${due} thẻ phản xạ SRS đến hạn hôm nay`, view: { name: 'flash' } });
  if (s.quizWrong.length) {
    steps.push({
      text: `Phẫu thuật lại ${s.quizWrong.length} câu tình huống từng chọn nhầm`,
      view: { name: 'quiz', mode: 'review' },
    });
  }

  if (!steps.length) {
    steps.push({
      text: 'Bạn đã hoàn thành toàn bộ 16 module Tư duy PMP! Làm bài Quiz trộn tổng hợp để giữ nhịp thi',
      view: { name: 'quiz', mode: 'mix' },
    });
  }
  return steps;
}
