// Schema-level checks for content/vocab/*.json, per CLAUDE.md hard rule #2
// (no invented vocab data): every entry needs a valid category, a valid
// source.origin, a valid confidence, an uncertaintyNote whenever confidence
// is "uncertain", and a globally unique id. Reuses shared/vocab-guard.ts's
// checks (kept in sync with scripts/validate-vocab.ts) rather than
// reimplementing them, then adds the cross-file duplicate-id check that
// only makes sense once every file is loaded together.
import { describe, it, expect } from 'vitest';
import { VALID_CATEGORIES, VALID_SOURCES, validateEntrySchema } from '../../shared/vocab-guard';
import { loadVocabFixtures, type VocabFixtureEntry } from './vocab-fixtures';

describe('vocab entry schema', () => {
  const fixtures = loadVocabFixtures();

  it('finds vocab entries to validate (guards against this test silently checking nothing)', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it('every entry passes id/category/german/transliterationColloquial/source/confidence checks', () => {
    const errors: string[] = [];
    for (const { file, entry } of fixtures) {
      validateEntrySchema(entry, `${file} / ${entry.id ?? '(no id)'}`, errors);
    }
    expect(errors).toEqual([]);
  });

  it('has no duplicate ids across all vocab files combined', () => {
    const seenIds = new Map<string, string>();
    const duplicates: string[] = [];
    for (const { file, entry } of fixtures) {
      if (!entry.id) continue;
      const prevFile = seenIds.get(entry.id);
      if (prevFile) duplicates.push(`"${entry.id}" in both ${prevFile} and ${file}`);
      else seenIds.set(entry.id, file);
    }
    expect(duplicates).toEqual([]);
  });

  it('every category actually used is one of the documented CategoryId values', () => {
    const usedCategories = new Set(fixtures.map(({ entry }) => entry.category));
    for (const category of usedCategories) {
      expect(VALID_CATEGORIES).toContain(category);
    }
  });

  it('every source.origin actually used is one of the documented SourceOrigin values', () => {
    const usedOrigins = new Set(fixtures.map(({ entry }) => entry.source?.origin));
    for (const origin of usedOrigins) {
      expect(VALID_SOURCES).toContain(origin);
    }
  });

  it('every "uncertain" entry carries a non-empty uncertaintyNote (never invent silently)', () => {
    const uncertainWithoutNote: string[] = fixtures
      .filter(({ entry }) => entry.confidence === 'uncertain' && !entry.uncertaintyNote?.trim())
      .map(({ file, entry }) => `${file} / ${entry.id}`);
    expect(uncertainWithoutNote).toEqual([]);
  });

  it('every entry has at least one non-empty transliteration and a German meaning', () => {
    const bad: string[] = fixtures
      .filter(({ entry }) => !entry.transliterationColloquial?.trim() || !entry.german?.trim())
      .map(({ file, entry }) => `${file} / ${entry.id}`);
    expect(bad).toEqual([]);
  });

  it('groups entries per category so an empty category file would be noticed', () => {
    const perCategory = new Map<string, VocabFixtureEntry[]>();
    for (const fixture of fixtures) {
      const list = perCategory.get(fixture.entry.category) ?? [];
      list.push(fixture);
      perCategory.set(fixture.entry.category, list);
    }
    for (const category of VALID_CATEGORIES) {
      expect(perCategory.get(category)?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
