import { useState } from 'react';
import type { VocabEntry } from '../../db/schema';
import { AudioPlayer } from '../../components/AudioPlayer';
import { Button } from '../../components/Button';

export function LearningExercise({ entry, onContinue }: { entry: VocabEntry; onContinue: () => void }) {
  const [heard, setHeard] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const [showText, setShowText] = useState(false);
  return <>
    <p className="eyebrow">NEU KENNENLERNEN</p>
    <h2 className="prompt-text">{entry.german}</h2>
    <p className="muted">Hör den Ausdruck ganz an und sprich ihn laut nach. Später in dieser Einheit versuchst du es aus dem Gedächtnis.</p>
    <AudioPlayer audio={entry.audio} label="Neuer Ausdruck" onFinished={() => setHeard(true)} />
    <Button variant="ghost" aria-expanded={showText} onClick={() => setShowText(!showText)}>
      {showText ? 'Lautschrift ausblenden' : 'Lautschrift als Hilfe'}
    </Button>
    {showText && <p className="transliteration">{entry.transliterationColloquial}</p>}
    <div className="answer-grid">
      {!spoken ? <Button disabled={!heard} onClick={() => setSpoken(true)}>Laut nachgesprochen</Button> :
        <Button onClick={onContinue}>Merken & weiter</Button>}
      {!heard && <p className="muted small">Nach dem vollständigen Hörbeispiel geht es weiter.</p>}
    </div>
  </>;
}
