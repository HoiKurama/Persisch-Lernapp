// One-off batch script (per PLAN.md M2): renders content/tts-source/*.json
// (Perso-Arabic word forms, filled in by the content-curator track) into
// public/audio/{dilara,farid}/<id>.mp3 via the Azure AI Speech REST API, and
// writes the resulting paths into the matching content/vocab/*.json entries.
//
// Robustness requirements this script is written against:
// - content/tts-source/*.json can be empty, missing entirely, or only
//   partially filled in at any point — this must degrade to "nothing to do"
//   rather than fail.
// - Re-running it must be cheap: only missing or *changed* audio is
//   regenerated (tracked via a content hash manifest), everything already
//   current is skipped.
// - AZURE_SPEECH_KEY / AZURE_SPEECH_REGION are read from the environment,
//   never hardcoded or written to a file (see README.md "Umgebungsvariablen"
//   for where they're documented — no .env/.env.example is created here).
//
// Usage: `npm run generate-audio` (add `--force` to ignore the manifest and
// regenerate every entry, e.g. after a voice/model change).

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { VocabEntry } from '../src/db/schema';

interface TtsSourceEntry {
  id: string;
  persoArabic: string;
}

const ROOT = join(import.meta.dirname, '..');
const TTS_SOURCE_DIR = join(ROOT, 'content', 'tts-source');
const VOCAB_DIR = join(ROOT, 'content', 'vocab');
const AUDIO_DIR = join(ROOT, 'public', 'audio');
// Build-internal bookkeeping only — stores a content hash per (id, voice),
// never the Perso-Arabic text itself, and lives next to tts-source (already
// documented there as never shipped to the client).
const MANIFEST_PATH = join(TTS_SOURCE_DIR, '.manifest.json');

const VOICES = [
  { key: 'dilara', name: 'fa-IR-DilaraNeural', gender: 'Female' },
  { key: 'farid', name: 'fa-IR-FaridNeural', gender: 'Male' },
] as const;

type VoiceKey = (typeof VOICES)[number]['key'];

const TOKEN_TTL_MS = 9 * 60 * 1000; // Azure tokens last 10 min; refresh a minute early.
const REQUEST_DELAY_MS = 150; // gentle pacing — a few hundred words is not worth parallelizing.
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readTtsSourceEntries(): TtsSourceEntry[] {
  if (!existsSync(TTS_SOURCE_DIR)) return [];
  const files = readdirSync(TTS_SOURCE_DIR).filter((f) => f.endsWith('.json'));
  const entries: TtsSourceEntry[] = [];

  for (const file of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(join(TTS_SOURCE_DIR, file), 'utf-8'));
    } catch (err) {
      console.warn(`generate-audio: ueberspringe ${file}, ungueltiges JSON (${(err as Error).message})`);
      continue;
    }
    if (!Array.isArray(parsed)) {
      console.warn(`generate-audio: ueberspringe ${file}, erwarte ein Array auf oberster Ebene`);
      continue;
    }
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const { id, persoArabic } = item as Record<string, unknown>;
      if (typeof id !== 'string' || id.length === 0) {
        console.warn(`generate-audio: ueberspringe einen Eintrag in ${file} ohne gueltige "id"`);
        continue;
      }
      if (typeof persoArabic !== 'string' || persoArabic.trim().length === 0) {
        console.warn(`generate-audio: ueberspringe "${id}" in ${file} - "persoArabic" fehlt oder ist leer`);
        continue;
      }
      entries.push({ id, persoArabic });
    }
  }
  return entries;
}

interface VocabLocation {
  entries: VocabEntry[];
  index: number;
  file: string;
}

/** Reads every content/vocab/*.json file and indexes entries by id for in-place updates. */
function loadVocabIndex(): Map<string, VocabLocation> {
  const locationById = new Map<string, VocabLocation>();
  if (!existsSync(VOCAB_DIR)) return locationById;

  for (const file of readdirSync(VOCAB_DIR).filter((f) => f.endsWith('.json'))) {
    const filePath = join(VOCAB_DIR, file);
    const entries = JSON.parse(readFileSync(filePath, 'utf-8')) as VocabEntry[];
    entries.forEach((entry, index) => {
      if (entry?.id) locationById.set(entry.id, { entries, index, file: filePath });
    });
  }
  return locationById;
}

function loadManifest(): Record<string, string> {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as Record<string, string>;
  } catch {
    return {};
  }
}

function hashFor(persoArabic: string, voiceName: string): string {
  return createHash('sha256').update(`${voiceName}::${persoArabic}`).digest('hex');
}

function escapeSsml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function getAccessToken(region: string, key: string): Promise<string> {
  const response = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Length': '0' },
  });
  if (!response.ok) {
    throw new Error(`Azure-Token-Anfrage fehlgeschlagen: ${response.status} ${await response.text().catch(() => '')}`);
  }
  return response.text();
}

async function synthesize(
  persoArabicText: string,
  voice: { name: string; gender: string },
  region: string,
  token: string,
): Promise<ArrayBuffer> {
  const ssml =
    `<speak version='1.0' xml:lang='fa-IR'>` +
    `<voice xml:lang='fa-IR' xml:gender='${voice.gender}' name='${voice.name}'>` +
    `${escapeSsml(persoArabicText)}</voice></speak>`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'persisch-lernapp-generate-audio',
      },
      body: ssml,
    });
    if (response.ok) return response.arrayBuffer();

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfterSec = Number(response.headers.get('retry-after')) || attempt * 2;
      console.warn(`generate-audio: Azure Rate-Limit (429), warte ${retryAfterSec}s und versuche erneut …`);
      await sleep(retryAfterSec * 1000);
      continue;
    }
    throw new Error(`Azure-TTS-Anfrage fehlgeschlagen: ${response.status} ${await response.text().catch(() => '')}`);
  }
  throw new Error('Azure-TTS-Anfrage nach mehreren Versuchen fehlgeschlagen');
}

async function main() {
  const ttsEntries = readTtsSourceEntries();
  if (ttsEntries.length === 0) {
    console.log(
      'generate-audio: content/tts-source/*.json ist leer oder enthaelt keine gueltigen Eintraege - nichts zu tun. ' +
        'Wird vom content-curator-Track befuellt (siehe content/tts-source/README.md).',
    );
    return;
  }

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    console.error(
      'generate-audio: AZURE_SPEECH_KEY und/oder AZURE_SPEECH_REGION sind nicht gesetzt ' +
        '(siehe README.md, Abschnitt "Umgebungsvariablen").',
    );
    process.exitCode = 1;
    return;
  }

  const locationById = loadVocabIndex();
  const manifest = loadManifest();
  const force = process.argv.includes('--force');
  const dirtyFiles = new Set<string>();

  let token = await getAccessToken(region, key);
  let tokenIssuedAt = Date.now();

  let generated = 0;
  let skipped = 0;
  let missingVocabEntry = 0;
  const errors: string[] = [];

  for (const { id, persoArabic } of ttsEntries) {
    const location = locationById.get(id);
    if (!location) {
      missingVocabEntry++;
      console.warn(`generate-audio: "${id}" hat keinen passenden Eintrag in content/vocab/*.json - uebersprungen.`);
      continue;
    }
    const vocabEntry = location.entries[location.index];

    for (const voice of VOICES) {
      const manifestKey = `${id}:${voice.key}`;
      const contentHash = hashFor(persoArabic, voice.name);
      const outPath = join(AUDIO_DIR, voice.key, `${id}.mp3`);
      const relativePath = `audio/${voice.key}/${id}.mp3`;
      const isCurrent = !force && manifest[manifestKey] === contentHash && existsSync(outPath);

      if (isCurrent) {
        skipped++;
        if (vocabEntry.audio[voice.key as VoiceKey] !== relativePath) {
          vocabEntry.audio[voice.key as VoiceKey] = relativePath;
          dirtyFiles.add(location.file);
        }
        continue;
      }

      if (Date.now() - tokenIssuedAt > TOKEN_TTL_MS) {
        token = await getAccessToken(region, key);
        tokenIssuedAt = Date.now();
      }

      try {
        const audioBuffer = await synthesize(persoArabic, voice, region, token);
        mkdirSync(join(AUDIO_DIR, voice.key), { recursive: true });
        writeFileSync(outPath, Buffer.from(audioBuffer));
        manifest[manifestKey] = contentHash;
        vocabEntry.audio[voice.key as VoiceKey] = relativePath;
        dirtyFiles.add(location.file);
        generated++;
        console.log(`generate-audio: ${voice.key}/${id}.mp3 erzeugt`);
        await sleep(REQUEST_DELAY_MS);
      } catch (err) {
        const message = (err as Error).message;
        errors.push(`${id} (${voice.key}): ${message}`);
        console.error(`generate-audio: FEHLER bei ${id} (${voice.key}): ${message}`);
      }
    }
  }

  // Every VocabLocation.entries reference is shared per file, so writing the
  // (mutated) array back out once per dirty file is enough regardless of how
  // many of its entries changed.
  const writtenFiles = new Set<string>();
  for (const location of locationById.values()) {
    if (!dirtyFiles.has(location.file) || writtenFiles.has(location.file)) continue;
    writeFileSync(location.file, JSON.stringify(location.entries, null, 2) + '\n', 'utf-8');
    writtenFiles.add(location.file);
  }
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  console.log(
    `generate-audio: fertig - ${generated} neu erzeugt, ${skipped} bereits aktuell, ` +
      `${missingVocabEntry} ohne Vokabel-Eintrag, ${errors.length} Fehler.`,
  );
  if (errors.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('generate-audio: unerwarteter Fehler', err);
  process.exitCode = 1;
});
