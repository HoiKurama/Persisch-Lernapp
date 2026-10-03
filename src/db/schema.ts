export type CategoryId =
  | 'begruessung-small-talk'
  | 'alltag-haus'
  | 'reisen-unterwegs'
  | 'essen-trinken'
  | 'zahlen-zeit'
  | 'familie-beziehungen'
  | 'gefuehle-meinungen'
  | 'schule-beruf'
  | 'notfall-gesundheit';

export type SourceOrigin = 'fsi-dli' | 'wiktionary' | 'tatoeba' | 'curated';

export interface ExampleSentence {
  transliteration: string;
  german: string;
  source?: SourceOrigin;
  tatoebaId?: string;
}

/**
 * A single vocabulary entry. No field may ever hold Perso-Arabic script —
 * this is enforced structurally (no such field exists) and checked by
 * scripts/validate-vocab.ts against the Unicode ranges U+0600-06FF,
 * U+FB50-FDFF, U+FE70-FEFF.
 */
export interface VocabEntry {
  id: string;
  category: CategoryId;
  german: string;
  /** Primary display form: colloquial spoken Persian, e.g. "nun" for bread. */
  transliterationColloquial: string;
  /** Only set when it diverges from the colloquial form, e.g. "nân". */
  transliterationLiterary?: string;
  exampleSentence?: ExampleSentence;
  audio: { dilara?: string; farid?: string; reference?: string };
  source: { origin: SourceOrigin; note?: string };
  confidence: 'confirmed' | 'uncertain';
  /** Required when confidence is 'uncertain' — never invent silently. */
  uncertaintyNote?: string;
  tags?: string[];
}

export type ReviewMode = 'flashcard' | 'recording' | 'listening';
export type Grade = 0 | 1 | 2 | 3 | 4 | 5;
export type Verdict = 'right' | 'close' | 'wrong';

/** Legacy progress is retained for migration and backups. */
export interface ProgressItem {
  vocabId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueDate: string;
  lastReviewedAt?: string;
}

export interface ReviewEvent {
  id?: number;
  vocabId: string;
  timestamp: string;
  mode: ReviewMode;
  grade: Grade;
  verdict?: Verdict;
}

export interface SkillProgress extends ProgressItem {
  mode: ReviewMode;
}

export interface MetaEntry {
  key: string;
  value: string | number;
}
