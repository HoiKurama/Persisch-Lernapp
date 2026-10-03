import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import type { SkillProgress, VocabEntry } from '../../db/schema';
import { CATEGORY_IDS, CATEGORY_LABELS } from '../../data/categories';
import { db } from '../../db/db';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { Button } from '../../components/Button';
import credits from '../../../content/audio-credits.json';
const audioCredits = credits as Array<{ id: string; label: string; source: string; author: string; license: string; licenseUrl: string }>;

export function StatsView({ vocab }: { vocab: VocabEntry[] }) {
  const [progress, setProgress] = useState<SkillProgress[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const subscription = liveQuery(() => db.skillProgress.toArray()).subscribe({
      next: setProgress, error: () => setError('Fortschritt konnte nicht geladen werden.'),
    });
    return () => subscription.unsubscribe();
  }, []);
  async function backup() {
    try {
      const data = await db.transaction('r', db.skillProgress, db.progress, db.reviewLog, db.meta, async () => ({
        app: 'persisch-lernapp', version: 2, exportedAt: new Date().toISOString(),
        skillProgress: await db.skillProgress.toArray(), legacyProgress: await db.progress.toArray(),
        reviewLog: await db.reviewLog.toArray(), meta: await db.meta.toArray(),
      }));
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `persisch-fortschritt-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch { setError('Die Sicherung konnte nicht erstellt werden.'); }
  }
  const counts = (ids: Set<string>, mode: string) => {
    const practiced = (progress ?? []).filter(item => ids.has(item.vocabId) && item.mode === mode);
    return {
      practiced: practiced.length,
      stable: practiced.filter(item => item.repetitions >= 3 && item.interval >= 7).length,
      due: practiced.filter(item => Date.parse(item.dueDate) <= Date.now()).length,
    };
  };
  const ids = new Set(vocab.map(entry => entry.id));
  return <div className="view">
    <div className="view-header"><p className="eyebrow">DEIN FORTSCHRITT</p><h1>Was schon vertrauter wird.</h1>
      <p className="muted">Hören und Sprechen entwickeln sich getrennt. Gefestigt bedeutet hier: mindestens drei erfolgreiche Wiederholungen und ein Abstand von mindestens sieben Tagen.</p></div>
    {error && <p role="alert" className="error-text">{error}</p>}
    {!progress && !error && <p role="status">Lade Fortschritt …</p>}
    <div className="mode-grid">{(['listening', 'recording'] as const).map(mode => {
      const stats = counts(ids, mode);
      return <Card key={mode}><h2>{mode === 'listening' ? 'Hören' : 'Sprechen'}</h2>
        <ProgressBar value={stats.stable} max={vocab.length} label="Gefestigte Ausdrücke" />
        <p className="muted">{stats.practiced} bereits geübt · {stats.due} wieder fällig</p></Card>;
    })}</div>
    <Card><h2>Deine Alltagsthemen</h2><div className="stats-table">
      <div className="stats-row"><strong>Thema</strong><strong>Hören</strong><strong>Sprechen</strong></div>
      {CATEGORY_IDS.map(category => {
        const group = new Set(vocab.filter(entry => entry.category === category).map(entry => entry.id));
        return <div className="stats-row" key={category}><span>{CATEGORY_LABELS[category]}</span>
          <span>{counts(group, 'listening').practiced}/{group.size}</span><span>{counts(group, 'recording').practiced}/{group.size}</span></div>;
      })}</div><p className="muted small">Anzahl der bereits geübten Ausdrücke pro Übungsart.</p></Card>
    <Card><h2>Deine Daten</h2><p className="muted">Der Lernfortschritt liegt in diesem Browser. Lade gelegentlich eine Sicherung herunter, besonders vor einem Gerätewechsel. Ein Import ist noch nicht Teil der Oberfläche.</p>
      <Button variant="secondary" onClick={() => void backup()}>Fortschritt als Datei sichern</Button></Card>
    {audioCredits.length > 0 && <Card><h2>Quellen der Hörbeispiele</h2><p className="muted small">Originalaufnahmen von Wikimedia Commons, unverändert übernommen.</p>
      <details><summary>{audioCredits.length} Aufnahmen · Quellen und Lizenzen anzeigen</summary>
        {audioCredits.map(credit => <p className="small" key={credit.id}><a href={credit.source} target="_blank" rel="noreferrer">{credit.label}</a> · {credit.author} · <a href={credit.licenseUrl} target="_blank" rel="noreferrer">{credit.license}</a></p>)}
      </details></Card>}
  </div>;
}
