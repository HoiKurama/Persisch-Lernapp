// Vercel serverless function (Node.js runtime, Web-standard Request/Response).
//
// Reads the recorded audio + expected answer from a multipart/form-data body,
// transcribes it with the OpenAI Whisper API (Persian), and compares the
// (Perso-Arabic) transcript against the expected Latin reference via
// shared/transliteration.ts's consonant+long-vowel skeleton. Returns a
// right/close/wrong verdict — never a phoneme analysis (see ARCHITECTURE.md).
//
// Hard rule: the raw Perso-Arabic transcript must never reach the client. It
// is never logged and is converted to a
// best-effort Latin approximation (transliterateForDisplay) before being put
// in the response.

import { toSkeleton, compareSkeletons, transliterateForDisplay } from '../shared/transliteration.ts';
import type { Verdict } from '../shared/transliteration.ts';
import type { CheckPronunciationResponse } from '../shared/api-types.ts';

export type { CheckPronunciationResponse } from '../shared/api-types.ts';

// Keep the upload small: a single spoken word/short phrase is a few seconds
// of audio. This is also the cheapest guard we have against runaway Whisper
// costs from a misbehaving or abusive client — real rate limiting needs a
// shared store (e.g. Vercel KV) this single-function stub doesn't have, see
// the final report for this track.
const MAX_AUDIO_BYTES = 3 * 1024 * 1024;
const WHISPER_TIMEOUT_MS = 20_000;

function jsonResponse(body: CheckPronunciationResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(feedback: string, expected: { colloquial: string; literary?: string }, status: number): Response {
  return jsonResponse(
    { transcriptLatin: '', verdict: 'error', score: 0, feedback, expected },
    status,
  );
}

/** Calls the OpenAI Whisper API and returns the raw Perso-Arabic transcript text. */
async function transcribeWithWhisper(audio: Blob, apiKey: string): Promise<string> {
  const whisperForm = new FormData();
  // Whisper infers a filename/type from the multipart part; browsers vary in
  // what MediaRecorder produces (webm on most, mp4/m4a on iOS Safari — see
  // src/features/recording/useRecorder.ts), so pass the original type through
  // rather than hardcoding one.
  whisperForm.append('file', audio, 'recording' + extensionFor(audio.type));
  whisperForm.append('model', 'whisper-1');
  whisperForm.append('language', 'fa');
  whisperForm.append('response_format', 'json');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WHISPER_TIMEOUT_MS);
  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Whisper API returned ${response.status}`);
    }

    const data = (await response.json()) as { text?: string };
    return data.text ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

function extensionFor(mimeType: string): string {
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return '.m4a';
  if (mimeType.includes('ogg')) return '.ogg';
  if (mimeType.includes('wav')) return '.wav';
  return '.webm';
}

/**
 * Compares the transcript against both the colloquial and (if present)
 * literary reference and returns the better of the two verdicts — a Whisper
 * transcript of the literary spelling should not be marked "wrong" just
 * because the app's primary reference is the colloquial form (see the
 * nun/nân example in shared/transliteration.test.ts).
 */
function bestComparison(transcriptSkeleton: string, colloquial: string, literary: string | undefined) {
  const candidates = [colloquial, ...(literary ? [literary] : [])];
  let best = compareSkeletons(transcriptSkeleton, toSkeleton(candidates[0]));
  for (const candidate of candidates.slice(1)) {
    const result = compareSkeletons(transcriptSkeleton, toSkeleton(candidate));
    if (result.score > best.score) best = result;
  }
  return best;
}

function feedbackFor(verdict: Verdict, expected: { colloquial: string; literary?: string }): string {
  switch (verdict) {
    case 'right':
      return 'Der erwartete Ausdruck wurde ungefähr erkannt.';
    case 'close':
      return 'Der Ausdruck wurde nicht sicher erkannt. Vergleiche deine Aufnahme mit dem Hörbeispiel.';
    case 'wrong':
      return `Das war vermutlich nicht das erwartete Wort ("${expected.colloquial}"). Nochmal versuchen?`;
  }
}

export async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('Ungueltige Anfrage (kein multipart/form-data).', { colloquial: '' }, 400);
  }

  const audio = formData.get('audio');
  const expectedColloquial = formData.get('expectedColloquial');
  const expectedLiteraryRaw = formData.get('expectedLiterary');
  const expectedLiterary = typeof expectedLiteraryRaw === 'string' && expectedLiteraryRaw.length > 0
    ? expectedLiteraryRaw
    : undefined;
  const expected = { colloquial: typeof expectedColloquial === 'string' ? expectedColloquial : '', literary: expectedLiterary };

  const forbiddenScript = /[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]/;
  if (typeof expectedColloquial !== 'string' || !expectedColloquial.trim() ||
      expectedColloquial.length > 250 || (expectedLiterary?.length ?? 0) > 250 ||
      forbiddenScript.test(expectedColloquial + (expectedLiterary ?? ''))) {
    return errorResponse('Ungültige erwartete Antwort.', { colloquial: '' }, 400);
  }

  if (!(audio instanceof Blob) || audio.size === 0) {
    return errorResponse('Keine Audioaufnahme empfangen.', expected, 400);
  }
  if (typeof expectedColloquial !== 'string' || expectedColloquial.length === 0) {
    return errorResponse('Keine erwartete Antwort angegeben.', expected, 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return errorResponse('Aufnahme ist zu groß (maximal 3 MB).', expected, 413);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Never leak *why* to the client beyond a generic message.
    console.error('check-pronunciation: OPENAI_API_KEY is not set');
    return errorResponse('Spracherkennung ist noch nicht eingerichtet.', expected, 503);
  }

  let rawTranscript: string;
  try {
    rawTranscript = await transcribeWithWhisper(audio, apiKey);
  } catch (err) {
    console.error('check-pronunciation: Whisper request failed', err);
    return errorResponse('Aussprachepruefung ist momentan nicht verfuegbar.', expected, 502);
  }

  if (rawTranscript.trim().length === 0) {
    const response: CheckPronunciationResponse = {
      transcriptLatin: '',
      verdict: 'wrong',
      score: 0,
      feedback: 'Da wurde nichts verstanden. Nochmal versuchen?',
      expected,
    };
    return jsonResponse(response, 200);
  }

  const transcriptSkeleton = toSkeleton(rawTranscript);
  const { verdict, score } = bestComparison(transcriptSkeleton, expected.colloquial, expected.literary);

  const response: CheckPronunciationResponse = {
    transcriptLatin: transliterateForDisplay(rawTranscript),
    verdict,
    score,
    feedback: feedbackFor(verdict, expected),
    expected,
  };
  return jsonResponse(response, 200);
}

export default { fetch: handler };
