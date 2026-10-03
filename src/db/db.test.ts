import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { db, seedVocabIfNeeded } from './db';
import type { VocabEntry } from './schema';
import { recordReview, getSession } from '../srs/reviewProgress';
const entry = { id: 'test-word', german: 'Hallo', confidence: 'confirmed', category: 'begruessung-small-talk', audio: {}, transliterationColloquial: 'salâm', source: { origin: 'curated' } } as VocabEntry;
afterEach(async () => { db.close(); await Dexie.delete('persisch-lernapp'); });
describe('progress persistence and migration', () => {
  it('migrates v1 logs into separate skills and keeps legacy progress intact', async () => {
    const legacy = new Dexie('persisch-lernapp');
    legacy.version(1).stores({ vocab: 'id, category', progress: 'vocabId, dueDate', reviewLog: '++id, vocabId, timestamp', meta: 'key' });
    await legacy.table('progress').put({ vocabId: 'test-word', repetitions: 5, dueDate: '2027-01-01' });
    await legacy.table('reviewLog').add({ vocabId: 'test-word', mode: 'listening', grade: 4, timestamp: '2026-09-16T10:00:00Z' });
    legacy.close();
    await db.open();
    expect((await db.progress.get('test-word'))?.repetitions).toBe(5);
    expect((await db.skillProgress.get(['test-word', 'listening']))?.repetitions).toBe(1);
    expect(await db.skillProgress.get(['test-word', 'recording'])).toBeUndefined();
    expect(await db.reviewLog.count()).toBe(1);
  });
  it('keeps speaking due after a listening success and saves a log atomically', async () => {
    await db.open();
    await recordReview(entry.id, 'listening', 4, 'right');
    expect(await getSession([entry], 'listening')).toEqual([]);
    expect(await getSession([entry], 'recording')).toHaveLength(1);
    expect(await db.reviewLog.count()).toBe(1);
  });
  it('refreshes edited content without losing learning history', async () => {
    await db.open();
    await seedVocabIfNeeded([entry], JSON.stringify([entry]));
    await recordReview(entry.id, 'recording', 4, 'right');
    const edited = { ...entry, german: 'Guten Tag' };
    await seedVocabIfNeeded([edited], JSON.stringify([edited]));
    expect((await db.vocab.get(entry.id))?.german).toBe('Guten Tag');
    expect(await db.skillProgress.count()).toBe(1);
    expect(await db.reviewLog.count()).toBe(1);
  });
});
