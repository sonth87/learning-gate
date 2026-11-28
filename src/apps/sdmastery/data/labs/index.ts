/* Catalog các bài Lab bổ sung (ngoài 5 bài gốc trong labChallenges.ts), chia file theo cấp độ. */
import type { LabChallengeSpec } from '../labChallenges';
import { ADVANCED_LABS } from './advanced';
import { BEGINNER_LABS } from './beginner';
import { EXPERT_LABS } from './expert';
import { INTERMEDIATE_LABS } from './intermediate';

export const LAB_EXTRA_CHALLENGES: LabChallengeSpec[] = [
  ...BEGINNER_LABS,
  ...INTERMEDIATE_LABS,
  ...ADVANCED_LABS,
  ...EXPERT_LABS,
];
