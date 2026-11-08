import { ExamSet } from '@/types/assessment.types';
import { EXAM_SETS_PART_1 } from './examSetsPart1';
import { EXAM_SETS_PART_2 } from './examSetsPart2';

export const ALL_EXAMS: ExamSet[] = [...EXAM_SETS_PART_1, ...EXAM_SETS_PART_2];
