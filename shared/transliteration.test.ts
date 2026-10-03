import { describe, it, expect } from 'vitest';
import { toSkeleton, compareSkeletons, transliterateForDisplay } from './transliteration';

// Real Persian word pairs (Perso-Arabic script <-> our Latin transliteration
// scheme, â/š/ž per content/SOURCES.md). Chosen to exercise: an exact match,
// the documented â-to-u colloquial/literary sound shift (content/vocab's own
// "nun"/"nân" example), the و/ی consonant-vowel ambiguity, a realistic
// near-miss a Persian ASR could produce, and a clearly wrong word.

describe('toSkeleton', () => {
  it('reduces "salâm" (hello, سلام) to the same skeleton from both scripts', () => {
    expect(toSkeleton('سلام')).toBe(toSkeleton('salâm'));
    expect(toSkeleton('salâm')).toBe('slAm');
  });

  it('reduces "šomâ" (you, formal, شما) to the same skeleton from both scripts', () => {
    expect(toSkeleton('شما')).toBe(toSkeleton('šomâ'));
    expect(toSkeleton('šomâ')).toBe('SmA');
  });

  it('drops short vowels but keeps long vowels/consonants for "âb" (water, آب)', () => {
    expect(toSkeleton('آب')).toBe(toSkeleton('âb'));
    expect(toSkeleton('âb')).toBe('Ab');
  });

  it('folds the و/ی consonant-vowel ambiguity onto the long-vowel code on both scripts', () => {
    // xub/xoob (good, خوب) - و here is the long vowel u.
    expect(toSkeleton('خوب')).toBe(toSkeleton('xub'));
    // The same fold means a written "v"/"y" consonant lands on the identical
    // code as long u/i — a deliberate, documented trade-off (see module doc
    // in transliteration.ts), not an accident.
    expect(toSkeleton('vaqt')).toBe(toSkeleton('uaqt'));
  });

  it('is script-agnostic for digraph consonants (kh, sh, zh, gh, ch)', () => {
    expect(toSkeleton('xâne')).toBe(toSkeleton('khâne')); // house, خانه (kh spelling variant)
    expect(toSkeleton('šab')).toBe(toSkeleton('shab')); // night, شب
  });
});

describe('compareSkeletons', () => {
  it('verdicts an exact skeleton match as "right" with score 1', () => {
    const result = compareSkeletons(toSkeleton('salâm'), toSkeleton('سلام'));
    expect(result).toEqual({ verdict: 'right', score: 1 });
  });

  it('verdicts the literary/colloquial "nân"/"nun" (bread, نان) shift as "close", not a false-positive "right"', () => {
    // content/vocab/alltag-haus.json documents this exact aa->u colloquial
    // shift. A Whisper transcript of the literary spelling "نان" should read
    // as "close" against the colloquial reference, and "right" against the
    // literary one.
    const whisperTranscript = toSkeleton('نان');
    expect(compareSkeletons(whisperTranscript, toSkeleton('nân')).verdict).toBe('right');
    expect(compareSkeletons(whisperTranscript, toSkeleton('nun')).verdict).toBe('close');
  });

  it('verdicts a one-letter slip on a short word as "close", not "wrong" (absolute budget, not ratio, for short skeletons)', () => {
    // bale/beli (yes, بله) - the trailing ه is ambiguous (silent vowel marker
    // vs. consonant h), a known limitation documented in transliteration.ts.
    const result = compareSkeletons(toSkeleton('بله'), toSkeleton('bale'));
    expect(result.verdict).toBe('close');
  });

  it('verdicts a different word entirely as "wrong"', () => {
    // xub (good, خوب) said, but ASR (or the student) produced xar (donkey, خر).
    const result = compareSkeletons(toSkeleton('xub'), toSkeleton('خر'));
    expect(result.verdict).toBe('wrong');
  });

  it('verdicts two clearly different longer words as "wrong"', () => {
    const result = compareSkeletons(toSkeleton('mehmân'), toSkeleton('daryâ')); // guest vs. sea
    expect(result.verdict).toBe('wrong');
  });

  it('is symmetric', () => {
    const a = toSkeleton('xâne');
    const b = toSkeleton('خونه');
    expect(compareSkeletons(a, b)).toEqual(compareSkeletons(b, a));
  });

  it('treats two empty skeletons as a trivial match', () => {
    expect(compareSkeletons('', '')).toEqual({ verdict: 'right', score: 1 });
  });
});

describe('transliterateForDisplay', () => {
  it('never lets any Perso-Arabic character through', () => {
    const persoArabicRange = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
    const result = transliterateForDisplay('سلام، حال شما چطور است؟');
    expect(persoArabicRange.test(result)).toBe(false);
  });

  it('renders a readable-ish approximation, acknowledging missing short vowels', () => {
    // خانه (house) has no written short vowels, so "khanh" (not "xâne" or the
    // fully vocalized "khoone") is the expected, documented output.
    expect(transliterateForDisplay('خانه')).toBe('khanh');
  });

  it('returns an empty string for empty input', () => {
    expect(transliterateForDisplay('')).toBe('');
  });
});

describe('compareSkeletons threshold boundaries', () => {
  // Synthetic skeletons (not real words) chosen to land exactly on each
  // length-bucket's documented boundary in transliteration.ts, so the
  // threshold logic itself is pinned down independently of whichever real
  // word pairs happen to produce a given edit distance.

  it('maxLen <= 3 uses an absolute edit-distance budget: 0 -> right, 1 -> close, 2+ -> wrong', () => {
    expect(compareSkeletons('ab', 'ab')).toEqual({ verdict: 'right', score: 1 });
    expect(compareSkeletons('ab', 'ac').verdict).toBe('close');
    expect(compareSkeletons('ab', 'xy').verdict).toBe('wrong');
  });

  it('maxLen 4-5 uses ratio thresholds: <=0.15 right, <=0.5 close, else wrong', () => {
    // length 4, distance 0 -> ratio 0
    expect(compareSkeletons('abcd', 'abcd').verdict).toBe('right');
    // length 5, distance 1 -> ratio 0.2 (>0.15, <=0.5) -> close, not right
    const closeResult = compareSkeletons('abcde', 'abcdf');
    expect(closeResult.verdict).toBe('close');
    expect(closeResult.score).toBeCloseTo(0.8, 5);
    // length 4, every character differs -> distance 4, ratio 1.0 (>0.5) -> wrong
    expect(compareSkeletons('abcd', 'wxyz').verdict).toBe('wrong');
  });

  it('maxLen > 5 uses wider ratio thresholds: <=0.2 right, <=0.45 close, else wrong', () => {
    // length 6, distance 1 -> ratio ~0.167 (<=0.2) -> right
    expect(compareSkeletons('abcdef', 'abcdeg').verdict).toBe('right');
    // length 7, distance 2 -> ratio ~0.286 (>0.2, <=0.45) -> close
    expect(compareSkeletons('abcdefg', 'abcdexy').verdict).toBe('close');
    // length 6, every character differs -> distance 6, ratio 1.0 (>0.45) -> wrong
    expect(compareSkeletons('abcdef', 'ghijkl').verdict).toBe('wrong');
  });

  it('is a pure function of its two skeleton arguments (no hidden state across calls)', () => {
    const first = compareSkeletons('slAm', 'slAm');
    const second = compareSkeletons('slAm', 'slAm');
    expect(first).toEqual(second);
  });
});
