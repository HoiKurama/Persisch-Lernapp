import { describe, it, expect } from 'vitest';
import type { ReviewEvent, VocabEntry } from '../db/schema';
import { buildPracticePlan, listeningOptions, migrateReviews, nextProgress, selectSession } from './scheduling';
const now = new Date('2026-09-16T12:00:00Z');
const entries = Array.from({ length: 20 }, (_, i) => ({ id: 'word-' + i, german: 'Bedeutung ' + i, confidence: 'confirmed', category: 'alltag-haus' } as VocabEntry));
describe('oral learning scheduling', () => {
  it('introduces new audio before recall while prioritizing known reviews', () => {
    const fresh = entries.slice(0, 2).map(entry => ({ ...entry, audio: { reference: 'test.wav' } }));
    const known = { ...entries[2], audio: {} };
    const plan = buildPracticePlan([...fresh, known], [nextProgress(known.id, 'recording', 1)]);
    expect(plan.map(step => `${step.entry.id}:${step.phase}`)).toEqual([
      'word-2:review', 'word-0:learn', 'word-1:learn', 'word-0:review', 'word-1:review',
    ]);
  });
  it('keeps role-play responses in conversational order after introductions', () => {
    const fresh = { ...entries[0], audio: { reference: 'test.wav' } };
    const known = { ...entries[1], audio: {} };
    const silent = { ...entries[2], audio: {} };
    const plan = buildPracticePlan([fresh, known, silent], [nextProgress(known.id, 'recording', 4)], true);
    expect(plan.map(step => `${step.entry.id}:${step.phase}`)).toEqual([
      'word-0:learn', 'word-0:review', 'word-1:review', 'word-2:review',
    ]);
  });
  it('limits new words and prioritizes overdue reviews', () => {
    const due = nextProgress(entries[12].id, 'recording', 1, undefined, new Date(now.getTime() - 3_600_000));
    const result = selectSession(entries, [due], now.getTime());
    expect(result).toHaveLength(6);
    expect(result[0].id).toBe(entries[12].id);
    expect(selectSession(entries, [], now.getTime())).toHaveLength(5);
  });
  it('does not introduce uncertain content', () => {
    expect(selectSession([{ ...entries[0], confidence: 'uncertain' }], [])).toEqual([]);
  });
  it('does not show future reviews', () => {
    expect(selectSession([entries[0]], [nextProgress(entries[0].id, 'listening', 4, undefined, now)], now.getTime())).toEqual([]);
  });
  it('repeats a failed expression after ten minutes', () => {
    expect(Date.parse(nextProgress('a', 'recording', 1, undefined, now).dueDate) - now.getTime()).toBe(600_000);
  });
  it('does not inflate intervals on repeated same-day success', () => {
    const first = nextProgress('a', 'recording', 4, undefined, now);
    const second = nextProgress('a', 'recording', 4, first, new Date(now.getTime() + 60_000));
    expect(second.repetitions).toBe(1); expect(second.dueDate).toBe(first.dueDate);
  });
  it('reconstructs skills from logs without granting speaking credit for reading', () => {
    const events: ReviewEvent[] = [
      { vocabId: 'a', mode: 'flashcard', grade: 4, timestamp: now.toISOString() },
      { vocabId: 'a', mode: 'listening', grade: 4, timestamp: now.toISOString() },
    ];
    const migrated = migrateReviews(events);
    expect(migrated.map(item => item.mode)).toEqual(['flashcard', 'listening']);
    expect(migrated.every(item => item.repetitions === 1)).toBe(true);
  });
  it('offers unique meanings even with duplicate content', () => {
    const pool = [...entries, { ...entries[0], id: 'duplicate' }];
    const options = listeningOptions(pool, entries[0]);
    expect(options).toHaveLength(4);
    expect(new Set(options.map(entry => entry.german)).size).toBe(4);
    expect(options.filter(entry => entry.id === entries[0].id)).toHaveLength(1);
  });
});
