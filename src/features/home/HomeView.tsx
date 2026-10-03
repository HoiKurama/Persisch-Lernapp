import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../../db/db';
import type { VocabEntry } from '../../db/schema';
import { hasPlayableAudio } from '../../lib/audio';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ProgressBar';

export function HomeView({ vocab, onStart }: { vocab: VocabEntry[]; onStart: (mode: 'listening' | 'recording') => void }) {
  const [summary, setSummary] = useState({ today: 0, listening: 0, recording: 0 });
  const [error, setError] = useState(false);
  const audioCount = vocab.filter(entry => hasPlayableAudio(entry.audio)).length;
  useEffect(() => {
    const subscription = liveQuery(async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const [events, progress] = await Promise.all([db.reviewLog.where('timestamp').aboveOrEqual(start.toISOString()).toArray(), db.skillProgress.toArray()]);
      const ids = new Set(vocab.map(entry => entry.id));
      return {
        today: new Set(events.filter(event => event.mode !== 'flashcard' && ids.has(event.vocabId)).map(event => `${event.mode}:${event.vocabId}`)).size,
        listening: progress.filter(item => ids.has(item.vocabId) && item.mode === 'listening' && Date.parse(item.dueDate) <= Date.now()).length,
        recording: progress.filter(item => ids.has(item.vocabId) && item.mode === 'recording' && Date.parse(item.dueDate) <= Date.now()).length,
      };
    }).subscribe({ next: setSummary, error: () => setError(true) });
    return () => subscription.unsubscribe();
  }, [vocab]);
  return <div className="view home-view">
    <section className="hero">
      <p className="eyebrow">PERSISCH FÜR DEINEN ALLTAG</p>
      <h1>Ein bisschen hören.<br />Ein bisschen sprechen.</h1>
      <p>Kurze Einheiten. Nützliche Ausdrücke.<br />In deinem Tempo ins Gespräch kommen.</p>
      <div className="hero-tags"><span>Umgangssprache</span><span>Ohne Schreibübungen</span><span>5 neue Ausdrücke pro Einheit</span></div>
    </section>
    <Card><div className="section-heading"><h2>Dein Tagesziel</h2><span className="muted">10 Übungen</span></div>
      <ProgressBar value={Math.min(summary.today, 10)} max={10} label={summary.today >= 10 ? 'Tagesziel erreicht' : 'Heute geübt'} />
      <p className="muted small">Jeder Ausdruck zählt pro Übungsart einmal am Tag.</p>
      {error && <p role="alert">Der Fortschritt ist gerade nicht verfügbar.</p>}
    </Card>
    <div className="mode-grid">
      <Card><span className="mode-symbol" aria-hidden="true">◉</span><h2>Hören & verstehen</h2>
        <p className="muted">Erkenne gesprochene Ausdrücke. Hör langsam nach, wenn du möchtest.</p>
        <p className="mode-meta">{audioCount ? `${audioCount} Hörbeispiele · ${summary.listening} Wiederholungen fällig` : 'Hörbeispiele fehlen noch'}</p>
        <Button fullWidth disabled={!audioCount} onClick={() => onStart('listening')}>Höreinheit starten <span aria-hidden="true">→</span></Button>
      </Card>
      <Card><span className="mode-symbol" aria-hidden="true">◎</span><h2>Selbst sprechen</h2>
        <p className="muted">Übe Ausdrücke und Alltagssituationen. Antworte laut und hör deine eigene Stimme.</p>
        <p className="mode-meta">{summary.recording} Wiederholungen fällig · auch ohne Cloud</p>
        <Button fullWidth onClick={() => onStart('recording')}>Sprecheinheit starten <span aria-hidden="true">→</span></Button>
      </Card>
    </div>
    <section className="learning-tip"><p className="eyebrow">SO WIRD EIN AUSDRUCK VERTRAUT</p>
      <ol><li><strong>Hören.</strong> Achte auf Klang und Rhythmus.</li><li><strong>Nachsprechen.</strong> Erst mit Vorbild, dann aus dem Gedächtnis.</li><li><strong>Wiederholen.</strong> Schwierige Ausdrücke begegnen dir früher wieder.</li></ol>
    </section>
    {audioCount < vocab.length && <div className="notice">
      <strong>{audioCount} von {vocab.length} Ausdrücken mit Hörbeispiel</strong>
      <p>Der Audiowortschatz wird noch ergänzt. Ausdrücke ohne Aufnahme kannst du beim Sprechen zusätzlich auswählen und im Wortschatz nachschlagen.</p>
    </div>}
  </div>;
}
