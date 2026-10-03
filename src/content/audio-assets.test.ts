import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import credits from '../../content/audio-credits.json';
import { loadVocabFixtures } from './vocab-fixtures';

const publicRoot = join(dirname(fileURLToPath(import.meta.url)), '../../public');
const references = loadVocabFixtures().map(fixture => fixture.entry).filter(entry => !!entry.audio.reference);

describe('shipped original audio', () => {
  it('ships a real WAV or OGG file for every local reference', () => {
    expect(references.length).toBeGreaterThan(0);
    for (const entry of references) {
      const path = entry.audio.reference!;
      expect(path).toMatch(/^audio\/reference\/[a-z0-9-]+\.(wav|ogg)$/);
      const bytes = readFileSync(join(publicRoot, path));
      expect(bytes.length, entry.id).toBeGreaterThan(100);
      expect(bytes.subarray(0, 4).toString(), entry.id).toBe(path.endsWith('.wav') ? 'RIFF' : 'OggS');
    }
  });
  it('includes one complete source and license record per reference', () => {
    expect(credits.length).toBe(references.length);
    expect(new Set(credits.map(credit => credit.id)).size).toBe(credits.length);
    for (const entry of references) {
      const credit = credits.find(credit => credit.id === entry.id);
      expect(credit?.author, entry.id).toBeTruthy();
      expect(credit?.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(credit?.license).toMatch(/^CC (BY|BY-SA)|^CC0/);
      expect(credit?.licenseUrl).toMatch(/^https?:\/\/creativecommons\.org\//);
    }
  });
});
