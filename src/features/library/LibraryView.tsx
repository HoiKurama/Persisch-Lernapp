import { useMemo, useState } from 'react';
import type { VocabEntry } from '../../db/schema';
import { CATEGORY_IDS, CATEGORY_LABELS } from '../../data/categories';
import { AudioPlayer } from '../../components/AudioPlayer';

export function LibraryView({ vocab }: { vocab: VocabEntry[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const entries = useMemo(() => vocab.filter(entry => (category === 'all' || entry.category === category) &&
    `${entry.german} ${entry.transliterationColloquial}`.toLocaleLowerCase('de').includes(search.toLocaleLowerCase('de'))), [vocab, search, category]);
  return <div className="view">
    <div className="view-header"><p className="eyebrow">DEIN NACHSCHLAGEWERK</p><h1>Ausdrücke für den Alltag.</h1><p className="muted">Finde eine Bedeutung oder hör einen Ausdruck noch einmal an.</p></div>
    <label className="field-label">Suchen<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Zum Beispiel: Danke" /></label>
    <label className="field-label">Thema<select value={category} onChange={e => setCategory(e.target.value)}><option value="all">Alle Alltagsthemen</option>
      {CATEGORY_IDS.map(id => <option key={id} value={id}>{CATEGORY_LABELS[id]}</option>)}</select></label>
    <p className="muted">{entries.length} Ausdrücke</p>
    <div className="word-list">{entries.map(entry => <details key={entry.id} className="word-entry">
      <summary>{entry.german}<span className="muted">{CATEGORY_LABELS[entry.category]}</span></summary>
      <p className="transliteration">{entry.transliterationColloquial}</p><AudioPlayer audio={entry.audio} label={entry.german} />
      {entry.exampleSentence && <p>{entry.exampleSentence.german}<br /><span className="muted">{entry.exampleSentence.transliteration}</span></p>}
      {entry.transliterationLiterary && <p className="muted small">Weitere Form: {entry.transliterationLiterary}</p>}
      {entry.confidence === 'uncertain' && <p className="notice">Noch nicht abschließend geprüft: {entry.uncertaintyNote}</p>}
    </details>)}</div>
    {!entries.length && <p>Kein passender Ausdruck gefunden.</p>}
  </div>;
}
