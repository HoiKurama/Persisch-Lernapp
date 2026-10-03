// Automated guard behind CLAUDE.md's hard rule #1: no Perso-Arabic script
// anywhere in content/vocab/*.json. Reuses the exact scanner logic from
// scripts/validate-vocab.ts (via shared/vocab-guard.ts) instead of
// reimplementing the Unicode-range check, so the two never drift apart.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERSO_ARABIC_PATTERN, collectStrings, type StringOccurrence } from '../../shared/vocab-guard';
import { loadVocabFixtures } from './vocab-fixtures';

const DIST_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist');
const DIST_TEXT_FILE_PATTERN = /\.(js|html|css|json|webmanifest)$/;

function walkTextFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTextFiles(full));
    else if (DIST_TEXT_FILE_PATTERN.test(entry.name)) out.push(full);
  }
  return out;
}

describe('no Perso-Arabic script in content/vocab', () => {
  const fixtures = loadVocabFixtures();

  it('finds vocab files to check (guards against this test silently checking nothing)', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it('the guard pattern itself actually matches real Perso-Arabic text (sanity check against a false-negative guard)', () => {
    expect(PERSO_ARABIC_PATTERN.test('سلام')).toBe(true);
    expect(PERSO_ARABIC_PATTERN.test('salam')).toBe(false);
  });

  it('contains no Perso-Arabic Unicode characters anywhere in any vocab entry', () => {
    const violations: string[] = [];
    for (const { file, entry } of fixtures) {
      const strings: StringOccurrence[] = [];
      collectStrings(entry, `${file} / ${entry.id ?? '(no id)'}`, strings);
      for (const { path, value } of strings) {
        if (PERSO_ARABIC_PATTERN.test(value)) {
          violations.push(`${path}: "${value}"`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  // PLAN.md documents the guard as covering both content/ AND dist/ (the
  // built output). This repo builds test -> validate-vocab -> build in that
  // order, so dist/ commonly does not exist yet when this test runs — in
  // that case there is nothing to check here (the content/ check above is
  // the primary, always-applicable guard) and this test passes trivially.
  // When dist/ IS present (e.g. re-running tests after a build), it gets
  // scanned for real.
  it('also finds no Perso-Arabic script in dist/ (built output), when a build is already present', () => {
    if (!existsSync(DIST_DIR)) return;

    const violations: string[] = [];
    for (const file of walkTextFiles(DIST_DIR)) {
      const content = readFileSync(file, 'utf-8');
      if (PERSO_ARABIC_PATTERN.test(content)) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });
});
