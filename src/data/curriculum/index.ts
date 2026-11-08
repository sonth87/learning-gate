import { LessonTopic, SkillLevel, StageId } from '@/types/curriculum.types';
import { STAGE_0_ZERO_FUNDAMENTAL_LESSONS } from './stage0ZeroToFundamental';
import { STAGE_1_LESSONS } from './stage1Fundamentals';
import { STAGE_2_LESSONS } from './stage2CoreMechanics';
import { STAGE_3_LESSONS } from './stage3Engineering';
import { STAGE_4_LESSONS } from './stage4FastApi';
import { STAGE_5_LESSONS } from './stage5Concurrency';
import { STAGE_6_LESSONS } from './stage6Specializations';
import { STAGE_7_LESSONS } from './stage7Production';

export const ALL_LESSONS: LessonTopic[] = [
  ...STAGE_0_ZERO_FUNDAMENTAL_LESSONS,
  ...STAGE_1_LESSONS,
  ...STAGE_2_LESSONS,
  ...STAGE_3_LESSONS,
  ...STAGE_4_LESSONS,
  ...STAGE_5_LESSONS,
  ...STAGE_6_LESSONS,
  ...STAGE_7_LESSONS,
];

export const LESSON_BY_ID: Record<string, LessonTopic> = ALL_LESSONS.reduce(
  (acc, lesson) => {
    acc[lesson.id] = lesson;
    return acc;
  },
  {} as Record<string, LessonTopic>
);

export function getLessonsByStage(stageId: StageId): LessonTopic[] {
  return ALL_LESSONS.filter((l) => l.stageId === stageId).sort(
    (a, b) => a.order - b.order
  );
}

export function getLessonsByLevel(level: SkillLevel): LessonTopic[] {
  return ALL_LESSONS.filter((l) => l.level === level).sort(
    (a, b) => a.order - b.order
  );
}
