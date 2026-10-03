import { describe, it, expect } from 'vitest';
import { sm2, INITIAL_SM2_STATE, addDays } from './sm2';

describe('sm2', () => {
  it('produces the classic 1 -> 6 -> interval*EF sequence on repeated perfect grades', () => {
    let state = INITIAL_SM2_STATE;
    state = sm2(state, 5);
    expect(state.interval).toBe(1);
    expect(state.repetitions).toBe(1);

    state = sm2(state, 5);
    expect(state.interval).toBe(6);
    expect(state.repetitions).toBe(2);

    const easeAfterTwo = state.easeFactor;
    state = sm2(state, 5);
    expect(state.repetitions).toBe(3);
    expect(state.interval).toBe(Math.round(6 * easeAfterTwo));
  });

  it('resets repetitions and interval to 1 on a failing grade (<3), but still updates ease factor', () => {
    let state = { easeFactor: 2.5, interval: 6, repetitions: 2 };
    state = sm2(state, 1);
    expect(state.repetitions).toBe(0);
    expect(state.interval).toBe(1);
    expect(state.easeFactor).toBeLessThan(2.5);
  });

  it('never lets the ease factor drop below the 1.3 floor even after repeated failures', () => {
    let state = INITIAL_SM2_STATE;
    for (let i = 0; i < 20; i++) {
      state = sm2(state, 0);
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('increases the ease factor slightly on a grade of 5 and leaves it unchanged on a grade of 4', () => {
    const afterPerfect = sm2(INITIAL_SM2_STATE, 5);
    expect(afterPerfect.easeFactor).toBeGreaterThan(INITIAL_SM2_STATE.easeFactor);

    const afterGood = sm2(INITIAL_SM2_STATE, 4);
    expect(afterGood.easeFactor).toBeCloseTo(INITIAL_SM2_STATE.easeFactor, 5);
  });

  it('addDays advances a date by the given number of days without mutating the input', () => {
    const start = new Date('2026-01-01T00:00:00.000Z');
    const result = addDays(start, 6);
    expect(result.getUTCDate()).toBe(7);
    expect(start.getUTCDate()).toBe(1);
  });

  it('treats grade 3 as a pass (repetitions advance, no reset) even though the ease factor still decreases', () => {
    const state = { easeFactor: 2.5, interval: 6, repetitions: 2 };
    const next = sm2(state, 3);
    expect(next.repetitions).toBe(3);
    expect(next.interval).toBe(Math.round(6 * 2.5));
    expect(next.easeFactor).toBeLessThan(2.5);
  });

  it('resets on grade 2 (still a fail below the <3 threshold), same as grade 1 and 0', () => {
    const state = { easeFactor: 2.5, interval: 6, repetitions: 2 };
    const next = sm2(state, 2);
    expect(next.repetitions).toBe(0);
    expect(next.interval).toBe(1);
  });

  it('does not mutate the input state object', () => {
    const state = { easeFactor: 2.5, interval: 6, repetitions: 2 };
    const snapshot = { ...state };
    sm2(state, 5);
    expect(state).toEqual(snapshot);
  });

  it('uses the PRE-update ease factor to scale this review\'s interval, not the freshly recomputed one', () => {
    // Regression test for the ordering documented in sm2.ts: a grade that
    // itself changes the ease factor must not use that new ease factor to
    // scale this same review's interval.
    const state = { easeFactor: 2.0, interval: 10, repetitions: 3 };
    const next = sm2(state, 3); // grade 3 lowers the ease factor
    expect(next.easeFactor).toBeLessThan(2.0);
    expect(next.interval).toBe(Math.round(10 * 2.0));
  });

  it('stays at interval 1 / repetitions 0 across repeated consecutive failures', () => {
    let state = INITIAL_SM2_STATE;
    state = sm2(state, 1);
    state = sm2(state, 0);
    state = sm2(state, 2);
    expect(state.repetitions).toBe(0);
    expect(state.interval).toBe(1);
  });

  it('resumes the classic 1 -> 6 sequence after recovering from a failure, regardless of the pre-failure state', () => {
    let state = { easeFactor: 2.2, interval: 20, repetitions: 5 };
    state = sm2(state, 0);
    expect(state.repetitions).toBe(0);
    state = sm2(state, 5);
    expect(state.repetitions).toBe(1);
    expect(state.interval).toBe(1);
    state = sm2(state, 5);
    expect(state.repetitions).toBe(2);
    expect(state.interval).toBe(6);
  });

  it('addDays does not mutate the input Date and correctly crosses a month boundary', () => {
    const start = new Date('2026-01-28T00:00:00.000Z');
    const result = addDays(start, 5);
    expect(result.getUTCMonth()).toBe(1); // February (0-indexed)
    expect(result.getUTCDate()).toBe(2);
    expect(start.getUTCMonth()).toBe(0);
    expect(start.getUTCDate()).toBe(28);
  });
});
