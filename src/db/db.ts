import Dexie, { type EntityTable } from 'dexie';
import type { VocabEntry, ProgressItem, ReviewEvent, MetaEntry, SkillProgress } from './schema';
import { migrateReviews } from '../srs/scheduling';

export class PersischDb extends Dexie {
  vocab!: EntityTable<VocabEntry, 'id'>;
  progress!: EntityTable<ProgressItem, 'vocabId'>;
  reviewLog!: EntityTable<ReviewEvent, 'id'>;
  meta!: EntityTable<MetaEntry, 'key'>;
  skillProgress!: Dexie.Table<SkillProgress, [string, string]>;

  constructor() {
    super('persisch-lernapp');
    this.version(1).stores({
      vocab: 'id, category',
      progress: 'vocabId, dueDate',
      reviewLog: '++id, vocabId, timestamp',
      meta: 'key',
    });
    this.version(2).stores({
      skillProgress: '[vocabId+mode], vocabId, mode, dueDate',
    }).upgrade(async tx => {
      const events = await tx.table('reviewLog').toArray() as ReviewEvent[];
      await tx.table('skillProgress').bulkPut(migrateReviews(events));
    });
  }
}

export const db = new PersischDb();

const CONTENT_VERSION_KEY = 'contentVersion';

/**
 * Re-seeds the vocab table from the bundled content whenever CURRENT_CONTENT_VERSION
 * increases. Progress/reviewLog are never touched here — only the read-mostly vocab copy.
 */
export async function seedVocabIfNeeded(vocab: VocabEntry[], currentContentVersion: string) {
  const meta = await db.meta.get(CONTENT_VERSION_KEY);
  if (meta?.value === currentContentVersion) return;

  await db.transaction('rw', db.vocab, db.meta, async () => {
    await db.vocab.clear();
    await db.vocab.bulkPut(vocab);
    await db.meta.put({ key: CONTENT_VERSION_KEY, value: currentContentVersion });
  });
}
