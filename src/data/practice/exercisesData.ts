import { PracticeExercise } from '@/types/practice.types';
import { PACK_1_EXERCISES } from './pack1ZeroAndSyntax';
import { PACK_2_EXERCISES } from './pack2CollectionsAndMemory';
import { PACK_3_EXERCISES } from './pack3MechanicsAndOop';
import { PACK_4_EXERCISES } from './pack4EngineeringAndBackend';
import { PACK_5_EXERCISES } from './pack5AsyncDataAndProduction';

export const ALL_EXERCISES: PracticeExercise[] = [
  ...PACK_1_EXERCISES,
  ...PACK_2_EXERCISES,
  ...PACK_3_EXERCISES,
  ...PACK_4_EXERCISES,
  ...PACK_5_EXERCISES,
];
