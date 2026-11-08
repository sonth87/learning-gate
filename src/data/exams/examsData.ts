import { ExamSet } from '@/types/assessment.types';
import { EXAM_SETS_PART_1 } from './examSetsPart1';
import { EXAM_SETS_PART_2 } from './examSetsPart2';
import { EXAM_SETS_PART_3 } from './examSetsPart3ZeroSetupAndTooling';
import { EXAM_SETS_PART_4 } from './examSetsPart4FundamentalCore';
import { EXAM_SETS_PART_5 } from './examSetsPart5BasicStructuresOop';
import { EXAM_SETS_PART_6 } from './examSetsPart6StdlibAndEcosystem';
import { EXAM_SETS_PART_7 } from './examSetsPart7AdvancedInternalsAsync';
import { EXAM_SETS_PART_8 } from './examSetsPart8ProMasterHeroProduction';

export const ALL_EXAMS: ExamSet[] = [
  ...EXAM_SETS_PART_3,
  ...EXAM_SETS_PART_4,
  ...EXAM_SETS_PART_1,
  ...EXAM_SETS_PART_5,
  ...EXAM_SETS_PART_6,
  ...EXAM_SETS_PART_2,
  ...EXAM_SETS_PART_7,
  ...EXAM_SETS_PART_8,
];
