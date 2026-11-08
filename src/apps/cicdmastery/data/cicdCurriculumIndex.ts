import { CicdLesson } from '../types/cicd.types';
import { LESSONS_STAGE_0_TO_1 } from './lessonsStage0To1';
import { LESSONS_STAGE_2_TO_3 } from './lessonsStage2To3';
import { LESSONS_STAGE_4_TO_5 } from './lessonsStage4To5';

export const ALL_CICD_LESSONS: CicdLesson[] = [
  ...LESSONS_STAGE_0_TO_1,
  ...LESSONS_STAGE_2_TO_3,
  ...LESSONS_STAGE_4_TO_5,
];

export const CICD_LESSON_BY_ID: Record<string, CicdLesson> = Object.fromEntries(
  ALL_CICD_LESSONS.map((l) => [l.id, l])
);
