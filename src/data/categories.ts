import type { CategoryId } from '../db/schema';

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  'begruessung-small-talk': 'Begrüßung & Small Talk',
  'alltag-haus': 'Alltag & Haus',
  'reisen-unterwegs': 'Reisen & Unterwegs',
  'essen-trinken': 'Essen & Trinken',
  'zahlen-zeit': 'Zahlen, Zeit & Wochentage',
  'familie-beziehungen': 'Familie & Beziehungen',
  'gefuehle-meinungen': 'Gefühle & Meinungen',
  'schule-beruf': 'Schule & Beruf',
  'notfall-gesundheit': 'Notfall & Gesundheit',
};

export const CATEGORY_IDS = Object.keys(CATEGORY_LABELS) as CategoryId[];
