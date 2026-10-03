// Test-only fixture loader for content/vocab/*.json, shared by
// no-perso-arabic.test.ts and vocab-schema.test.ts so both exercise the exact
// same file set instead of two subtly different readdir calls. Not imported
// by any app code — only by tests in this folder.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { VocabEntry } from '../db/schema';

const VOCAB_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'content', 'vocab');

export interface VocabFixtureEntry {
  file: string;
  entry: VocabEntry;
}

/** Reads and parses every content/vocab/*.json file. Throws on missing dir/bad JSON — a test should fail loudly, not silently see zero entries. */
export function loadVocabFixtures(): VocabFixtureEntry[] {
  const files = readdirSync(VOCAB_DIR).filter((f) => f.endsWith('.json'));
  const result: VocabFixtureEntry[] = [];
  for (const file of files) {
    const raw = readFileSync(join(VOCAB_DIR, file), 'utf-8');
    const entries = JSON.parse(raw) as VocabEntry[];
    for (const entry of entries) result.push({ file, entry });
  }
  return result;
}
