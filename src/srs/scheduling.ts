import type { Grade, ReviewEvent, ReviewMode, SkillProgress, VocabEntry } from '../db/schema';
import { addDays, INITIAL_SM2_STATE, sm2 } from './sm2';
import { hasPlayableAudio } from '../lib/audio';

export interface PracticeStep {
  entry: VocabEntry;
  phase: 'learn' | 'review';
  retry: boolean;
}

/** Introduce unheard expressions before recalling them, with other words in between. */
export function buildPracticePlan(entries: VocabEntry[], progress: SkillProgress[], ordered = false): PracticeStep[] {
  const known = new Set(progress.map(item => item.vocabId));
  const introductions = entries.filter(entry => !known.has(entry.id) && hasPlayableAudio(entry.audio));
  const review = (entry: VocabEntry): PracticeStep => ({ entry, phase: 'review', retry: false });
  if (ordered) return [
    ...introductions.map((entry): PracticeStep => ({ entry, phase: 'learn', retry: false })),
    ...entries.map(review),
  ];
  return [
    ...entries.filter(entry => known.has(entry.id)).map(review),
    ...introductions.map((entry): PracticeStep => ({ entry, phase: 'learn', retry: false })),
    ...entries.filter(entry => !known.has(entry.id)).map(review),
  ];
}

export function nextProgress(vocabId: string, mode: ReviewMode, grade: Grade, previous?: SkillProgress, now = new Date()): SkillProgress {
  const next = sm2(previous ?? INITIAL_SM2_STATE, grade);
  const sameDay = previous?.lastReviewedAt && new Date(previous.lastReviewedAt).toDateString() === now.toDateString();
  if (grade >= 3 && sameDay && previous.repetitions > 0) return { ...previous, lastReviewedAt: now.toISOString() };
  return {
    vocabId, mode, ...next,
    dueDate: (grade < 3 ? new Date(now.getTime() + 10 * 60_000) : addDays(now, next.interval)).toISOString(),
    lastReviewedAt: now.toISOString(),
  };
}

export function migrateReviews(events: ReviewEvent[]): SkillProgress[] {
  const progress = new Map<string, SkillProgress>();
  for (const event of [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp))) {
    const key = `${event.vocabId}:${event.mode}`;
    progress.set(key, nextProgress(event.vocabId, event.mode, event.grade, progress.get(key), new Date(event.timestamp)));
  }
  return [...progress.values()];
}

/** Due reviews first; at most five new items, ten items overall. */
export function selectSession(vocab: VocabEntry[], progress: SkillProgress[], now = Date.now(), limit = 10, newLimit = 5): VocabEntry[] {
  const byId = new Map(progress.map(item => [item.vocabId, item]));
  const due = vocab.filter(entry => byId.has(entry.id) && Date.parse(byId.get(entry.id)!.dueDate) <= now)
    .sort((a, b) => Date.parse(byId.get(a.id)!.dueDate) - Date.parse(byId.get(b.id)!.dueDate));
  const fresh = vocab.filter(entry => !byId.has(entry.id) && entry.confidence === 'confirmed');
  return [...due, ...fresh.slice(0, newLimit)].slice(0, limit);
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function listeningOptions(pool: VocabEntry[], correct: VocabEntry): VocabEntry[] {
  const seen = new Set([correct.german.trim().toLocaleLowerCase('de')]);
  const alternatives = [
    ...shuffle(pool.filter(entry => entry.category === correct.category)),
    ...shuffle(pool.filter(entry => entry.category !== correct.category)),
  ].filter(entry => {
    const meaning = entry.german.trim().toLocaleLowerCase('de');
    if (entry.id === correct.id || seen.has(meaning)) return false;
    seen.add(meaning);
    return true;
  });
  return shuffle([correct, ...alternatives.slice(0, 3)]);
}
