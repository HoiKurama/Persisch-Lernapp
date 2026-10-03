// Pure (no node:fs / no process) vocab-entry validation logic shared between
// scripts/validate-vocab.ts (CLI, reads content/vocab/*.json from disk) and
// src/content/*.test.ts (Vitest, exercises the exact same checks). Keeping
// this module free of Node-only globals means it can be imported from src/
// (tsconfig.app has no "node" in its "types" array) without pulling
// Node-specific globals into that project's type-check — see
// shared/transliteration.ts for the same pattern.
import type { VocabEntry, CategoryId, SourceOrigin } from '../src/db/schema';

export const VALID_CATEGORIES: CategoryId[] = [
  'begruessung-small-talk',
  'alltag-haus',
  'reisen-unterwegs',
  'essen-trinken',
  'zahlen-zeit',
  'familie-beziehungen',
  'gefuehle-meinungen',
  'schule-beruf',
  'notfall-gesundheit',
];

export const VALID_SOURCES: SourceOrigin[] = ['fsi-dli', 'wiktionary', 'tatoeba', 'curated'];

// Arabic, Arabic Supplement, Arabic Presentation Forms A/B — covers Perso-Arabic script.
// Same ranges as shared/transliteration.ts's PERSO_ARABIC_PATTERN.
export const PERSO_ARABIC_PATTERN = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

export interface StringOccurrence {
  path: string;
  value: string;
}

/** Recursively collects every string value in `value`, tagged with a dotted/indexed path. */
export function collectStrings(value: unknown, path: string, out: StringOccurrence[]): void {
  if (typeof value === 'string') {
    out.push({ path, value });
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => collectStrings(item, `${path}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [key, val] of Object.entries(value)) {
      collectStrings(val, `${path}.${key}`, out);
    }
  }
}

/** Perso-Arabic-script scan only — no schema checks. Appends to `errors`. */
export function scanPersoArabic(entry: VocabEntry, context: string, errors: string[]): void {
  const strings: StringOccurrence[] = [];
  collectStrings(entry, context, strings);
  for (const { path, value } of strings) {
    if (PERSO_ARABIC_PATTERN.test(value)) {
      errors.push(`${context}: Perso-Arabic script found at ${path}: "${value}"`);
    }
  }
}

/** Structural/enum checks only (id, category, source.origin, confidence/uncertaintyNote) — no Perso-Arabic scan. */
export function validateEntrySchema(entry: VocabEntry, context: string, errors: string[]): void {
  if (!entry.id || !/^[a-z0-9-]+$/.test(entry.id)) errors.push(`${context}: invalid or missing id`);
  if (!VALID_CATEGORIES.includes(entry.category)) errors.push(`${context}: invalid category "${entry.category}"`);
  if (!entry.german) errors.push(`${context}: missing german`);
  if (!entry.transliterationColloquial) errors.push(`${context}: missing transliterationColloquial`);
  if (!entry.source || !VALID_SOURCES.includes(entry.source.origin)) {
    errors.push(`${context}: missing or invalid source.origin`);
  }
  if (entry.confidence !== 'confirmed' && entry.confidence !== 'uncertain') {
    errors.push(`${context}: confidence must be "confirmed" or "uncertain"`);
  }
  if (entry.confidence === 'uncertain' && !entry.uncertaintyNote) {
    errors.push(`${context}: confidence is "uncertain" but uncertaintyNote is missing`);
  }
}

/** Combined schema + Perso-Arabic check (what scripts/validate-vocab.ts runs per entry). */
export function validateEntry(entry: VocabEntry, context: string, errors: string[]): void {
  validateEntrySchema(entry, context, errors);
  scanPersoArabic(entry, context, errors);
}
