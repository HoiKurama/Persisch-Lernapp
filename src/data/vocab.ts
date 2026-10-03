import type { VocabEntry } from '../db/schema';
import { CATEGORY_IDS } from './categories';

// Eagerly bundles every content/vocab/*.json file, whatever the current count
// or set of category files — the content-curator track adds/replaces these
// independently, and this loader must not assume a fixed shape.
const modules = import.meta.glob<{ default: VocabEntry[] }>('../../content/vocab/*.json', {
  eager: true,
});

export const vocab: VocabEntry[] = Object.values(modules).flatMap((mod) => mod.default)
  .sort((a, b) => CATEGORY_IDS.indexOf(a.category) - CATEGORY_IDS.indexOf(b.category) || a.id.localeCompare(b.id));

/** Exact content identity: catches corrections, new audio, additions and removals. */
export const CONTENT_VERSION = JSON.stringify(vocab);
