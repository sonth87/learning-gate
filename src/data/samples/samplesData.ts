import { SampleProject } from '@/types/sample.types';
import { SAMPLE_PROJECTS_PART_1 } from './samplesPart1';
import { SAMPLE_PROJECTS_PART_2 } from './samplesPart2';
import { SAMPLE_PROJECTS_PART_3 } from './samplesPart3';
import { REAL_WORLD_AS_SAMPLE_PROJECTS } from './realWorldProjectsData';

export const CORE_BLUEPRINT_PROJECTS: SampleProject[] = [
  ...SAMPLE_PROJECTS_PART_1,
  ...SAMPLE_PROJECTS_PART_2,
  ...SAMPLE_PROJECTS_PART_3,
];

export const ALL_SAMPLE_PROJECTS: SampleProject[] = [
  ...CORE_BLUEPRINT_PROJECTS,
  ...REAL_WORLD_AS_SAMPLE_PROJECTS,
];
