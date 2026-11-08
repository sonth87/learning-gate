import { getDb } from './indexedDbClient';
import { FlashcardSrsState, SrsRating } from '@/types/assessment.types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateNextSrsState(
  cardId: string,
  current: FlashcardSrsState | undefined,
  rating: SrsRating
): FlashcardSrsState {
  const now = Date.now();
  const prevBox = current?.box ?? 0;
  const prevEase = current?.easeFactor ?? 2.5;
  const prevInterval = current?.intervalDays ?? 0;
  const reviewCount = (current?.reviewCount ?? 0) + 1;

  let box = prevBox;
  let easeFactor = prevEase;
  let intervalDays = 1;

  if (rating === 'again') {
    box = 0;
    easeFactor = Math.max(1.3, prevEase - 0.2);
    intervalDays = 0; // Review again immediately / within 10 mins
  } else if (rating === 'hard') {
    box = Math.max(1, prevBox);
    easeFactor = Math.max(1.3, prevEase - 0.15);
    intervalDays = prevInterval === 0 ? 1 : Math.max(1, Math.round(prevInterval * 1.2));
  } else if (rating === 'good') {
    box = Math.min(5, prevBox + 1);
    intervalDays = prevInterval === 0 ? 1 : Math.max(2, Math.round(prevInterval * easeFactor));
  } else if (rating === 'easy') {
    box = Math.min(5, prevBox + 2);
    easeFactor = prevEase + 0.15;
    intervalDays = prevInterval === 0 ? 3 : Math.max(4, Math.round(prevInterval * easeFactor * 1.3));
  }

  const nextReviewAt =
    intervalDays === 0 ? now + 10 * 60 * 1000 : now + intervalDays * DAY_MS;

  return {
    cardId,
    box,
    easeFactor,
    intervalDays,
    nextReviewAt,
    lastReviewedAt: now,
    reviewCount,
  };
}

export const srsRepo = {
  async getAllSrsStates(): Promise<Record<string, FlashcardSrsState>> {
    const db = await getDb();
    const list = await db.getAll('srs_states');
    return list.reduce((acc, item) => {
      acc[item.cardId] = item;
      return acc;
    }, {} as Record<string, FlashcardSrsState>);
  },

  async rateCard(cardId: string, rating: SrsRating): Promise<FlashcardSrsState> {
    const db = await getDb();
    const existing = await db.get('srs_states', cardId);
    const updated = calculateNextSrsState(cardId, existing, rating);
    await db.put('srs_states', updated);
    return updated;
  },
};
