// Shape of the JSON returned by api/check-pronunciation.ts. Kept separate from
// shared/transliteration.ts (which only knows about skeleton comparison, not
// HTTP concerns) so both the serverless function and the recording frontend
// (src/features/recording/) can import the same contract without either
// depending on the other's implementation module — mirrors the api/ <-> src/
// split that shared/transliteration.ts already uses for the same reason.
import type { Verdict } from './transliteration';

export interface CheckPronunciationResponse {
  /**
   * Best-effort Latin rendering of what Whisper heard, for user feedback.
   * NEVER Perso-Arabic script — see transliterateForDisplay() in
   * transliteration.ts. Empty when nothing was transcribed.
   */
  transcriptLatin: string;
  /** 'error' means a technical failure (no Whisper result), not a graded attempt. */
  verdict: Verdict | 'error';
  /** 0-1 similarity score from compareSkeletons(), 0 for 'error'. */
  score: number;
  /** Human-readable (German) feedback text, safe to show directly. */
  feedback: string;
  expected: { colloquial: string; literary?: string };
}
