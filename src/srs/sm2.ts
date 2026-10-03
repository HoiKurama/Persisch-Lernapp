import type { Grade } from '../db/schema';

export interface Sm2State {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export const INITIAL_SM2_STATE: Sm2State = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
};

const MIN_EASE_FACTOR = 1.3;

/**
 * Classic SM-2 (SuperMemo-2). Given the current scheduling state and a 0-5
 * recall-quality grade, returns the next state. Grade < 3 counts as a fail:
 * repetitions and interval reset, but the ease factor still updates.
 */
export function sm2(state: Sm2State, grade: Grade): Sm2State {
  const easeDelta = 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02);
  const easeFactor = Math.max(MIN_EASE_FACTOR, state.easeFactor + easeDelta);

  if (grade < 3) {
    return { easeFactor, interval: 1, repetitions: 0 };
  }

  const repetitions = state.repetitions + 1;
  let interval: number;
  if (repetitions === 1) {
    interval = 1;
  } else if (repetitions === 2) {
    interval = 6;
  } else {
    // Per the original SM-2 spec, the interval multiplier is the ease factor
    // as it stood BEFORE this review's update, not the freshly updated one.
    interval = Math.round(state.interval * state.easeFactor);
  }

  return { easeFactor, interval, repetitions };
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
