import { FlashcardItem } from '@/types/assessment.types';
import { FLASHCARDS_STAGE_1_TO_2 } from './cardsStage1To2';
import { FLASHCARDS_STAGE_3_TO_7 } from './cardsStage3To7';

export const ALL_FLASHCARDS: FlashcardItem[] = [
  ...FLASHCARDS_STAGE_1_TO_2,
  ...FLASHCARDS_STAGE_3_TO_7,
];

export { FLASHCARDS_STAGE_1_TO_2, FLASHCARDS_STAGE_3_TO_7 };
