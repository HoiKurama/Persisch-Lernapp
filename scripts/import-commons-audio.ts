import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { candidates } from './audio/candidates.ts';

interface AudioCredit { id: string; label: string; author: string; source: string; license: string; licenseUrl: string }
interface CommonsPage { title: string; imageinfo?: Array<{ url: string; descriptionurl: string; extmetadata: Record<string, { value: string }> }> }
const root = join(import.meta.dirname, '..');
const creditsPath = join(root, 'content/audio-credits.json');
const credits: AudioCredit[] = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, 'utf8')) : [];
const vocabFiles = readdirSync(join(root, 'content/vocab')).filter(file => file.endsWith('.json'));
const vocabIndex = vocabFiles.flatMap(file => JSON.parse(readFileSync(join(root, 'content/vocab', file), 'utf8')) as Array<{ id: string; audio: { reference?: string } }>);
let failures = 0;
const headers = { 'User-Agent': 'SalamPersianLearning/1.0 (personal educational audio importer)' };
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function request(url: string, pause: boolean): Promise<Response | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (pause || attempt) await delay(attempt ? 10_000 : 1700);
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(25_000) });
      if (response.status === 429 || response.status >= 500) continue;
      if (response.ok) return response;
      console.warn('Audio source HTTP ' + response.status);
      return null;
    } catch { if (attempt === 2) return null; }
  }
  return null;
}

const pending = candidates.filter(([id]) => {
  const entry = vocabIndex.find(item => item.id === id);
  if (!entry) throw new Error('Unknown vocabulary id: ' + id);
  return !entry.audio.reference || !existsSync(join(root, 'public', entry.audio.reference)) || !credits.some(credit => credit.id === id);
});
console.log(pending.length + ' new audio candidates; existing audio and credits preserved.');
for (let offset = 0; offset < pending.length; offset += 40) {
  const batch = pending.slice(offset, offset + 40);
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|extmetadata',
    titles: batch.map(([, title]) => 'File:' + title).join('|'),
  }).toString();
  const response = await request(url.toString(), true);
  if (!response) { failures += batch.length; console.warn('Metadata currently unavailable; batch skipped.'); continue; }
  const data = await response.json() as { query?: { pages: Record<string, CommonsPage> } };
  const pages = Object.values(data.query?.pages ?? {});
  for (const [id, title] of batch) {
    const info = pages.find(page => page.title === 'File:' + title)?.imageinfo?.[0];
    if (!info) { console.log(id + ': no exact recording found'); continue; }
    const author = info.extmetadata.Artist?.value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const license = info.extmetadata.LicenseShortName?.value;
    const licenseUrl = info.extmetadata.LicenseUrl?.value;
    if (!author || !license || !licenseUrl || !/^(CC BY|CC0)/.test(license)) {
      console.log(id + ': complete license information unavailable; skipped'); continue;
    }
    const media = await request(info.url, true);
    if (!media) { failures++; console.log(id + ': download unavailable; skipped'); continue; }
    const bytes = Buffer.from(await media.arrayBuffer());
    if (bytes.length < 100 || bytes.length > 2_000_000 || !['OggS', 'RIFF'].includes(bytes.subarray(0, 4).toString())) {
      failures++; console.warn(id + ': invalid audio; skipped'); continue;
    }
    const path = 'audio/reference/' + id + (title.endsWith('.wav') ? '.wav' : '.ogg');
    mkdirSync(join(root, 'public/audio/reference'), { recursive: true });
    writeFileSync(join(root, 'public', path), bytes);
    for (const file of vocabFiles) {
      const filePath = join(root, 'content/vocab', file);
      const entries = JSON.parse(readFileSync(filePath, 'utf8'));
      const entry = entries.find((item: { id: string }) => item.id === id);
      if (!entry) continue;
      entry.audio.reference = path;
      const prior = credits.findIndex(credit => credit.id === id);
      if (prior !== -1) credits.splice(prior, 1);
      credits.push({ id, label: entry.german + ' (' + entry.transliterationColloquial + ')', author, source: info.descriptionurl, license, licenseUrl });
      writeFileSync(filePath, JSON.stringify(entries, null, 2).replace(/    "(source|exampleSentence|audio)": \{[\s\S]*?\n    \}/g, block => block.replace(/\s*\n\s*/g, ' ')) + '\n');
      writeFileSync(creditsPath, JSON.stringify(credits, null, 2) + '\n');
      console.log(id + ': added (' + license + ')');
    }
  }
}
console.log(credits.length + ' audio recordings available; ' + failures + ' temporary failures.');
if (failures) process.exitCode = 1;
