import { useEffect, useRef, useState } from 'react';
import type { Grade, VocabEntry } from '../../db/schema';
import type { CheckPronunciationResponse } from '../../../shared/api-types';
import { useRecorder, type RecordingResult } from '../recording/useRecorder';
import { AudioPlayer } from '../../components/AudioPlayer';
import { Button } from '../../components/Button';
import { pauseOtherAudio } from '../../lib/audio';

export function SpeakingExercise({ entry, busy, onGrade }: { entry: VocabEntry; busy: boolean; onGrade: (grade: Grade) => void }) {
  const [hint, setHint] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const [recording, setRecording] = useState<RecordingResult | null>(null);
  const [url, setUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState('');
  const abort = useRef<AbortController | null>(null);
  const recorder = useRecorder(result => { setRecording(result); setSpoken(true); });
  const active = recorder.status === 'recording' || recorder.status === 'requesting-permission' || recorder.status === 'processing';
  useEffect(() => {
    if (!recording) return;
    const objectUrl = URL.createObjectURL(recording.blob);
    // eslint-disable-next-line react/set-state-in-effect -- Publish and revoke the browser-managed URL together.
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [recording]);
  useEffect(() => () => abort.current?.abort(), []);

  async function check() {
    if (!recording || abort.current) return;
    const controller = new AbortController();
    abort.current = controller;
    setChecking(true); setFeedback('');
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const form = new FormData();
      const ext = recording.mimeType.includes('mp4') ? 'm4a' : recording.mimeType.includes('ogg') ? 'ogg' : 'webm';
      form.append('audio', recording.blob, `recording.${ext}`);
      form.append('expectedColloquial', entry.transliterationColloquial);
      if (entry.transliterationLiterary) form.append('expectedLiterary', entry.transliterationLiterary);
      const response = await fetch('/api/check-pronunciation', { method: 'POST', body: form, signal: controller.signal });
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('unavailable');
      const result = await response.json() as CheckPronunciationResponse;
      if (!['right', 'close', 'wrong', 'error'].includes(result.verdict)) throw new Error('invalid');
      setFeedback(result.verdict === 'right' ? 'Der Ausdruck wurde ungefähr erkannt. Vergleiche deine Aufnahme auch selbst.' :
        result.verdict === 'error' ? 'Die Erkennung ist nicht eingerichtet oder gerade nicht verfügbar. Du kannst selbst bewerten.' :
        'Der Ausdruck wurde nicht sicher erkannt. Das allein bedeutet nicht, dass deine Aussprache falsch war.');
    } catch {
      if (!controller.signal.aborted) setFeedback('Die Erkennung ist nicht verfügbar. Du kannst deine Aufnahme selbst vergleichen.');
      else setFeedback('Die Erkennung hat zu lange gedauert. Bitte selbst vergleichen oder erneut versuchen.');
    } finally { clearTimeout(timeout); abort.current = null; setChecking(false); }
  }

  return <>
    <p className="eyebrow">AUF PERSISCH ANTWORTEN</p>
    <h2 className="prompt-text">{entry.german}</h2>
    <p className="muted">Versuche es zuerst aus dem Gedächtnis. Sprich laut.</p>
    <div className="action-row">
      <Button disabled={busy || checking || (active && !recorder.isRecording)} variant={recorder.isRecording ? 'danger' : 'primary'}
        onClick={() => { if (recorder.isRecording) recorder.stop(); else { pauseOtherAudio(); setRecording(null); setUrl(''); setFeedback(''); void recorder.start(); } }}>
        {recorder.isRecording ? '■ Aufnahme beenden' : recorder.status === 'requesting-permission' ? 'Mikrofon erlauben …' : recorder.status === 'processing' ? 'Verarbeitet …' : '● Mich aufnehmen'}
      </Button>
      <Button variant="ghost" disabled={active || checking || busy} onClick={() => setSpoken(true)}>Ohne Aufnahme gesprochen</Button>
    </div>
    {recorder.isRecording && <p role="status" className="recording-status">Aufnahme läuft · stoppt nach 12 Sekunden</p>}
    {recorder.errorMessage && <p role="alert" className="error-text">{recorder.errorMessage}</p>}
    {url && <div className="recording-playback">
      <label htmlFor="my-recording">Meine Aufnahme</label>
      <audio id="my-recording" controls src={url} onPlaying={event => pauseOtherAudio(event.currentTarget)} />
      <details><summary>Optionale Spracherkennung</summary>
        <p className="muted">„Erkennung starten“ sendet diese Aufnahme an den eingerichteten Sprachdienst. Das Ergebnis ist eine grobe Erkennung des Ausdrucks, keine genaue Aussprachebewertung.</p>
        <Button variant="secondary" disabled={checking || active || busy} onClick={() => void check()}>{checking ? 'Erkennt …' : 'Erkennung starten'}</Button>
      </details>
      {feedback && <p role="status">{feedback}</p>}
    </div>}
    {!hint ? <Button variant="secondary" disabled={active || checking} onClick={() => setHint(true)}>Hörbeispiel & Lösung zeigen</Button> :
      <div className="answer-feedback">
        <p className="transliteration">{entry.transliterationColloquial}</p>
        <AudioPlayer audio={entry.audio} label="Vorbild" disabled={active || checking || busy} />
        {entry.exampleSentence && <p className="muted">{entry.exampleSentence.german}<br />{entry.exampleSentence.transliteration}</p>}
        <p className="muted">Hör zu, sprich nach und versuche es gleich noch einmal ohne Hilfe.</p>
      </div>}
    {spoken && <div className="answer-grid">
      <p className="muted">Wie gut konntest du den Ausdruck selbst sagen?</p>
      {!hint && <Button variant="success" disabled={busy || active || checking} onClick={() => onGrade(4)}>Selbstständig gesagt</Button>}
      <Button variant="secondary" disabled={busy || active || checking} onClick={() => onGrade(2)}>Mit Hilfe / noch unsicher</Button>
      <Button variant="ghost" disabled={busy || active || checking} onClick={() => onGrade(1)}>Noch einmal üben</Button>
    </div>}
  </>;
}
