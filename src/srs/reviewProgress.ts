import { db } from '../db/db';
import { buildPracticePlan, nextProgress, selectSession } from './scheduling';
import type { VocabEntry, ReviewMode, Grade, Verdict, SkillProgress } from '../db/schema';

export const GRADE_PASS: Grade = 4;
export const GRADE_FAIL: Grade = 1;

export async function recordReview(vocabId: string, mode: ReviewMode, grade: Grade, verdict: Verdict): Promise<SkillProgress> {
  let item!: SkillProgress;
  await db.transaction('rw', db.skillProgress, db.reviewLog, async () => {
    const previous = await db.skillProgress.get([vocabId, mode]);
    item = nextProgress(vocabId, mode, grade, previous);
    await db.skillProgress.put(item);
    await db.reviewLog.add({ vocabId, mode, grade, verdict, timestamp: item.lastReviewedAt! });
  });
  return item;
}

export async function getDueVocab(vocab: VocabEntry[], category?: VocabEntry['category'] | 'all', mode: ReviewMode = 'flashcard') {
  const progress = await db.skillProgress.where('mode').equals(mode).toArray();
  const byId = new Map(progress.map(item => [item.vocabId, item]));
  return vocab.filter(entry => !category || category === 'all' || category === entry.category)
    .filter(entry => !byId.has(entry.id) || Date.parse(byId.get(entry.id)!.dueDate) <= Date.now());
}

export async function getSession(vocab: VocabEntry[], mode: ReviewMode) {
  return selectSession(vocab, await db.skillProgress.where('mode').equals(mode).toArray());
}

export async function getPracticeSession(vocab: VocabEntry[], mode: ReviewMode, ordered = false) {
  const progress = await db.skillProgress.where('mode').equals(mode).toArray();
  return buildPracticePlan(ordered ? vocab.filter(entry => entry.confidence === 'confirmed') : selectSession(vocab, progress), progress, ordered);
}
