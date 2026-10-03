import { describe, expect, it } from 'vitest';
import { SITUATIONS } from './situations';
import { loadVocabFixtures } from '../content/vocab-fixtures';

describe('situation content', () => {
  it('uses existing confirmed expressions with a unique response per situation', () => {
    const entries = loadVocabFixtures().map(fixture => fixture.entry);
    expect(SITUATIONS.length).toBeGreaterThan(0);
    for (const situation of SITUATIONS) {
      expect(situation.steps.length).toBeGreaterThan(1);
      expect(new Set(situation.steps.map(step => step.vocabId)).size).toBe(situation.steps.length);
      for (const step of situation.steps) {
        const entry = entries.find(entry => entry.id === step.vocabId);
        expect(entry?.confidence, step.vocabId).toBe('confirmed');
        expect(step.context.length).toBeGreaterThan(0);
      }
    }
  });
});
