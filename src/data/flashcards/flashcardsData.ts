import { FlashcardItem } from '@/types/assessment.types';
import { FLASHCARDS_FUNDAMENTAL_ZERO_TO_SETUP } from './cardsFundamentalZeroToSetup';
import { FLASHCARDS_STAGE_1_TO_2 } from './cardsStage1To2';
import { FLASHCARDS_BASIC_AND_STDLIB } from './cardsBasicAndStdlib';
import { FLASHCARDS_STAGE_3_TO_7 } from './cardsStage3To7';
import { FLASHCARDS_ADVANCED_INTERNALS } from './cardsAdvancedArchitectureAndInternals';
import { FLASHCARDS_PRO_MASTER_HERO } from './cardsProMasterHeroProduction';

export const ALL_FLASHCARDS: FlashcardItem[] = [
  ...FLASHCARDS_FUNDAMENTAL_ZERO_TO_SETUP,
  ...FLASHCARDS_STAGE_1_TO_2,
  ...FLASHCARDS_BASIC_AND_STDLIB,
  ...FLASHCARDS_STAGE_3_TO_7,
  ...FLASHCARDS_ADVANCED_INTERNALS,
  ...FLASHCARDS_PRO_MASTER_HERO,
];

export {
  FLASHCARDS_FUNDAMENTAL_ZERO_TO_SETUP,
  FLASHCARDS_STAGE_1_TO_2,
  FLASHCARDS_BASIC_AND_STDLIB,
  FLASHCARDS_STAGE_3_TO_7,
  FLASHCARDS_ADVANCED_INTERNALS,
  FLASHCARDS_PRO_MASTER_HERO,
};
