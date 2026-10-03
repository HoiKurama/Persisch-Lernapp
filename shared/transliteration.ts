// Shared between api/check-pronunciation.ts and the frontend. Reduces a Persian
// string (Perso-Arabic OR Latin transliteration) to a consonant + long-vowel
// "skeleton" so a Whisper transcript (Perso-Arabic, short vowels unwritten) can
// be compared against a hand-authored Latin reference despite neither side
// carrying reliable short-vowel information. See PLAN.md / ARCHITECTURE.md for
// why a general-purpose transliterator is not attempted here.
//
// Design in one paragraph: Persian script never writes short vowels (a, e, o),
// so any Perso-Arabic transcript is *already* skeleton-like — it only carries
// consonants and the three long vowels/matres lectionis (ا/آ, و, ی). We mirror
// that on the Latin side by dropping short vowels there too and mapping every
// consonant digraph (sh/zh/kh/gh/ch) and precomposed letter (š/ž/â) onto the
// same single-character canonical codes used for the Perso-Arabic consonants.
// و and ی are themselves ambiguous in Persian orthography (vowel u/i vs.
// consonant v/y) — Whisper's script carries the same ambiguity a human reader
// would have to resolve from context, which we don't have. We resolve it by
// collapsing v/w with long-u and y with long-i into the same codes on *both*
// sides, trading a small amount of discriminating power for fewer spurious
// mismatches — consistent with PLAN.md's "im Zweifel eher 'aehnlich'" guidance.

export type Verdict = 'right' | 'close' | 'wrong';

export interface SkeletonComparison {
  verdict: Verdict;
  /** 1 = identical skeletons, 0 = completely different. */
  score: number;
}

// Same Unicode ranges as scripts/validate-vocab.ts (Arabic, Arabic Supplement,
// Arabic Presentation Forms A/B) — anything in here is treated as Perso-Arabic
// script rather than a Latin transliteration.
const PERSO_ARABIC_PATTERN = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

// Perso-Arabic letter -> canonical skeleton code. Letters that represent the
// same consonant sound in modern Persian pronunciation (e.g. ث/س/ص all as "s")
// are deliberately folded together — Whisper's spelling choice among them is
// an orthographic quirk, not a pronunciation difference we can hear. Hamza
// (ء) and ayn (ع) are dropped: they carry no reliable Latin counterpart in
// our transliteration scheme and are frequently omitted or misplaced by ASR.
// Short-vowel diacritics (harakat) are never in this table, so they are
// dropped automatically by the "unmapped char -> nothing" rule below — Persian
// script mostly omits them anyway.
const PERSO_ARABIC_MAP: Record<string, string> = {
  'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j', 'چ': 'c', 'ح': 'h', 'خ': 'x',
  'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'Z', 'س': 's', 'ش': 'S', 'ص': 's',
  'ض': 'z', 'ط': 't', 'ظ': 'z', 'غ': 'q', 'ف': 'f', 'ق': 'q', 'ک': 'k', 'ك': 'k',
  'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ة': 'h',
  'و': 'U', 'ؤ': 'U', 'ی': 'I', 'ي': 'I', 'ئ': 'I',
  'ا': 'A', 'آ': 'A', 'إ': 'A', 'أ': 'A',
};

// Two-or-three-character Latin sequences that must be folded into one
// canonical code before the single-character pass runs (longest-match-first
// is not needed since none of these overlap with each other).
const LATIN_DIGRAPHS: Array<[RegExp, string]> = [
  [/kh/g, 'x'],
  [/gh/g, 'q'],
  [/sh/g, 'S'],
  [/zh/g, 'Z'],
  [/ch/g, 'c'],
  [/aa/g, 'A'],
  [/ii/g, 'I'],
  [/uu/g, 'U'],
];

// Latin character (after digraph folding, lowercased) -> canonical skeleton
// code. Short vowels a/e/o and hamza/ayn markers (', ʼ, ʾ, ʿ, ’) are
// deliberately absent so they fall through to "dropped", matching the
// Perso-Arabic side where they are never written either.
const LATIN_CHAR_MAP: Record<string, string> = {
  // Canonical codes already produced by the digraph pass — pass through.
  S: 'S', Z: 'Z', A: 'A', I: 'I', U: 'U',
  // Precomposed long vowels / consonants from common transliteration schemes.
  'â': 'A', 'ā': 'A', 'à': 'A',
  'š': 'S', 'ž': 'Z',
  'î': 'I', 'ī': 'I',
  'û': 'U', 'ū': 'U',
  // و/ی ambiguity (see module doc): fold consonant v/w/y onto the matching
  // long-vowel code instead of giving them their own.
  y: 'I', i: 'I',
  v: 'U', w: 'U', u: 'U',
  // Plain consonants map to themselves.
  b: 'b', p: 'p', t: 't', j: 'j', c: 'c', h: 'h', x: 'x', d: 'd', z: 'z',
  r: 'r', s: 's', f: 'f', q: 'q', k: 'k', g: 'g', l: 'l', m: 'm', n: 'n',
};

function skeletonFromPersoArabic(input: string): string {
  let out = '';
  for (const ch of input) {
    out += PERSO_ARABIC_MAP[ch] ?? '';
  }
  return out;
}

function skeletonFromLatin(input: string): string {
  let folded = input.toLowerCase();
  for (const [pattern, replacement] of LATIN_DIGRAPHS) {
    folded = folded.replace(pattern, replacement);
  }
  let out = '';
  for (const ch of folded) {
    out += LATIN_CHAR_MAP[ch] ?? '';
  }
  return out;
}

/**
 * Reduces a Persian string — Perso-Arabic script (e.g. raw Whisper output) or
 * a Latin transliteration (e.g. a VocabEntry field) — to a script-independent
 * consonant + long-vowel skeleton. The result uses the same canonical codes
 * regardless of which script it came from, so two skeletons from different
 * scripts can be compared directly with compareSkeletons().
 */
export function toSkeleton(input: string): string {
  const normalized = input.normalize('NFKC');
  return PERSO_ARABIC_PATTERN.test(normalized)
    ? skeletonFromPersoArabic(normalized)
    : skeletonFromLatin(normalized);
}

/** Classic Levenshtein edit distance, iterative two-row DP. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * Compares two skeletons (order-independent) and returns a right/close/wrong
 * verdict plus a 0-1 similarity score. This is a v1 approximation, not a
 * phoneme comparison (see ARCHITECTURE.md) — thresholds are deliberately
 * conservative, preferring "close" over a false-positive "right" or a
 * false-negative "wrong" whenever the signal is ambiguous. Short skeletons
 * (our vocabulary includes many 1-3 letter words after short vowels are
 * stripped, e.g. "ab" -> "Ab") make a ratio-based threshold unreliable — a
 * single edit on a 2-character skeleton is a 50% "distance" that would look
 * catastrophic on a longer word — so short skeletons use an absolute
 * edit-distance budget instead of a ratio.
 */
export function compareSkeletons(a: string, b: string): SkeletonComparison {
  const distance = editDistance(a, b);
  const maxLen = Math.max(a.length, b.length);

  if (maxLen === 0) {
    return { verdict: 'right', score: 1 };
  }

  const ratio = distance / maxLen;
  const score = Math.max(0, Math.round((1 - ratio) * 100) / 100);

  let verdict: Verdict;
  if (maxLen <= 3) {
    // Absolute budget: too short for a ratio to mean anything.
    verdict = distance === 0 ? 'right' : distance === 1 ? 'close' : 'wrong';
  } else if (maxLen <= 5) {
    verdict = ratio <= 0.15 ? 'right' : ratio <= 0.5 ? 'close' : 'wrong';
  } else {
    verdict = ratio <= 0.2 ? 'right' : ratio <= 0.45 ? 'close' : 'wrong';
  }

  return { verdict, score };
}

// Perso-Arabic letter -> a single representative Latin letter, used ONLY to
// build a best-effort, human-readable rendering for user-facing feedback
// (api/check-pronunciation.ts's `transcriptLatin`). This is intentionally
// separate from the skeleton codes above: it is meant to be *read*, not
// compared. Short vowels are still missing (Persian script never writes
// them), so the result reads like "brd" for a word normally pronounced
// "borde" — that is an inherent, documented limitation (see PLAN.md's open
// technical risk), not a bug. Never feed this into toSkeleton()/
// compareSkeletons(); it throws away the canonical-code disambiguation those
// need.
const PERSO_ARABIC_DISPLAY_MAP: Record<string, string> = {
  'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
  'ض': 'z', 'ط': 't', 'ظ': 'z', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ک': 'k', 'ك': 'k',
  'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ة': 'h',
  'و': 'u', 'ؤ': 'u', 'ی': 'i', 'ي': 'i', 'ئ': 'i',
  'ا': 'a', 'آ': 'â', 'إ': 'a', 'أ': 'a',
};

/**
 * Best-effort Perso-Arabic -> Latin rendering for display only. Guarantees no
 * character in the U+0600-06FF / U+0750-077F / U+FB50-FDFF / U+FE70-FEFF
 * ranges survives into the output (unmapped characters, including hamza/ayn
 * and any leftover diacritics, are dropped) — this is what lets
 * api/check-pronunciation.ts hand a `transcriptLatin` string to the client
 * without ever forwarding Perso-Arabic script.
 */
export function transliterateForDisplay(persoArabicText: string): string {
  const normalized = persoArabicText.normalize('NFKC');
  let out = '';
  for (const ch of normalized) {
    if (/\s/.test(ch)) {
      out += ' ';
      continue;
    }
    out += PERSO_ARABIC_DISPLAY_MAP[ch] ?? '';
  }
  return out.replace(/\s+/g, ' ').trim();
}
