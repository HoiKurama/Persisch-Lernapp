// Validates every content/vocab/*.json file against the VocabEntry shape and,
// critically, scans all string values for Perso-Arabic script. This is the
// automated guard behind the app's hard "no Arabic script anywhere" requirement
// — it must pass before content is considered shippable, and CI/tests should
// run it (see src/content/no-perso-arabic.test.ts, src/content/vocab-schema.test.ts,
// which reuse the same checks via shared/vocab-guard.ts).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { VocabEntry } from '../src/db/schema';
import { validateEntry } from '../shared/vocab-guard';

const VOCAB_DIR = join(import.meta.dirname, '..', 'content', 'vocab');

function main() {
  const errors: string[] = [];
  const seenIds = new Map<string, string>();
  let totalEntries = 0;

  let files: string[];
  try {
    files = readdirSync(VOCAB_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    console.error(`Could not read ${VOCAB_DIR}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error(`No vocab files found in ${VOCAB_DIR}`);
    process.exit(1);
  }

  for (const file of files) {
    const raw = readFileSync(join(VOCAB_DIR, file), 'utf-8');
    let entries: VocabEntry[];
    try {
      entries = JSON.parse(raw);
    } catch (e) {
      errors.push(`${file}: invalid JSON (${(e as Error).message})`);
      continue;
    }
    if (!Array.isArray(entries)) {
      errors.push(`${file}: expected a top-level array`);
      continue;
    }
    for (const entry of entries) {
      totalEntries++;
      const ctx = `${file} / ${entry.id ?? '(no id)'}`;
      validateEntry(entry, ctx, errors);
      if (entry.id) {
        const prevFile = seenIds.get(entry.id);
        if (prevFile) errors.push(`Duplicate id "${entry.id}" in ${file} and ${prevFile}`);
        else seenIds.set(entry.id, file);
      }
    }
  }

  if (errors.length > 0) {
    console.error(`Vocab validation FAILED — ${errors.length} problem(s):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`Vocab validation OK — ${totalEntries} entries across ${files.length} file(s), no Perso-Arabic script found.`);
}

main();
