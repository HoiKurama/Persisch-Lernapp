import { useState } from 'react';
import type { Grade, VocabEntry } from '../../db/schema';
import { listeningOptions } from '../../srs/scheduling';
import { AudioPlayer } from '../../components/AudioPlayer';
import { Button } from '../../components/Button';

export function ListeningExercise({ entry, pool, busy, onGrade }: { entry: VocabEntry; pool: VocabEntry[]; busy: boolean; onGrade: (grade: Grade) => void }) {
  const [options] = useState(() => listeningOptions(pool, entry));
  const [heard, setHeard] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const correct = selected === entry.id;
  return <>
    <p className="eyebrow">ERST HÖREN, DANN VERSTEHEN</p>
    <h2>Was hast du gehört?</h2>
    <AudioPlayer audio={entry.audio} label="Hörbeispiel" onPlayed={() => setHeard(true)} />
    {!heard && <p className="muted">Spiele das Hörbeispiel ab. Danach kannst du antworten.</p>}
    <div className="answer-grid">
      {options.map(option => <Button key={option.id} fullWidth
        variant={selected && option.id === entry.id ? 'success' : selected === option.id ? 'danger' : 'secondary'}
        disabled={!heard || selected !== null || busy} onClick={() => setSelected(option.id)}>{option.german}</Button>)}
      <Button variant="ghost" disabled={!heard || selected !== null || busy} onClick={() => setSelected('unknown')}>Noch nicht verstanden</Button>
    </div>
    {selected && <div className="answer-feedback" aria-live="polite">
      <strong>{correct ? 'Richtig verstanden.' : 'Hör noch einmal genau hin.'}</strong>
      <p>{entry.german} <span className="muted">· {entry.transliterationColloquial}</span></p>
      <p className="muted">Sprich den Ausdruck einmal laut nach.</p>
      <Button fullWidth disabled={busy} onClick={() => onGrade(correct ? 4 : 1)}>{busy ? 'Speichert …' : 'Weiter'}</Button>
    </div>}
  </>;
}
