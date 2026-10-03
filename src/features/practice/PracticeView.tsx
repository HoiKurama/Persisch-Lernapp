import { useMemo, useState } from 'react';
import type { VocabEntry } from '../../db/schema';
import { CATEGORY_IDS, CATEGORY_LABELS } from '../../data/categories';
import { hasPlayableAudio } from '../../lib/audio';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ProgressBar';
import { usePractice } from './usePractice';
import { ListeningExercise } from './ListeningExercise';
import { SpeakingExercise } from './SpeakingExercise';
import { LearningExercise } from './LearningExercise';
import { SituationsView } from './SituationsView';

export function PracticeView({ vocab, mode }: { vocab: VocabEntry[]; mode: 'listening' | 'recording' }) {
  const [format, setFormat] = useState('expressions');
  return <div className="view">
    {mode === 'recording' && <div className="practice-formats" role="group" aria-label="Sprechübung auswählen">
      <Button variant={format === 'expressions' ? 'primary' : 'secondary'} aria-pressed={format === 'expressions'} onClick={() => setFormat('expressions')}>Ausdrücke</Button>
      <Button variant={format === 'situations' ? 'primary' : 'secondary'} aria-pressed={format === 'situations'} onClick={() => setFormat('situations')}>Alltagssituationen</Button>
    </div>}
    {format === 'situations' ? <SituationsView vocab={vocab} /> : <ExpressionPractice vocab={vocab} mode={mode} />}
  </div>;
}

function ExpressionPractice({ vocab, mode }: { vocab: VocabEntry[]; mode: 'listening' | 'recording' }) {
  const [category, setCategory] = useState('all');
  const [includeSilent, setIncludeSilent] = useState(false);
  const available = useMemo(() => vocab.filter(entry => (mode === 'recording' && includeSilent) || hasPlayableAudio(entry.audio)), [vocab, mode, includeSilent]);
  const pool = useMemo(() => available.filter(entry => category === 'all' || entry.category === category), [available, category]);
  const practice = usePractice(pool, mode);
  const isListening = mode === 'listening';
  return <div className="view">
    <div className="view-header"><p className="eyebrow">DEINE KURZE LERNEINHEIT</p>
      <h1>{isListening ? 'Genau hinhören.' : 'Selbst ins Sprechen kommen.'}</h1>
      <p className="muted">{isListening ? 'Erst hören, dann die Bedeutung erkennen und nachsprechen.' : 'Deutscher Impuls → deine persische Antwort. Lautschrift hilft bei Bedarf.'}</p>
    </div>
    <label className="field-label">Thema
      <select value={category} onChange={e => setCategory(e.target.value)}>
        <option value="all">Alle Alltagsthemen</option>
        {CATEGORY_IDS.filter(id => available.some(entry => entry.category === id)).map(id => <option key={id} value={id}>{CATEGORY_LABELS[id]}</option>)}
      </select>
    </label>
    {mode === 'recording' && <label className="checkbox-label"><input type="checkbox" checked={includeSilent} onChange={e => { setIncludeSilent(e.target.checked); setCategory('all'); }} /> Auch Ausdrücke ohne Hörbeispiel üben</label>}
    {practice.error && <div role="alert" className="notice"><p>{practice.error}</p>
      {!practice.queue && <Button onClick={practice.restart}>Erneut laden</Button>}</div>}
    {!available.length ? <Card><h2>Hörbeispiele fehlen noch</h2><p>Für diesen Wortschatz sind noch keine Aufnahmen hinterlegt. Im Bereich Sprechen kannst du bereits selbst laut üben und dich aufnehmen.</p></Card> :
      practice.queue === null ? <p role="status">Lade deine Einheit …</p> :
      practice.current ? <>
        <ProgressBar value={practice.index} max={practice.queue.length} label={practice.current.phase === 'learn' ? 'Kennenlernen → aus dem Gedächtnis üben' : practice.current.retry ? 'Noch einmal festigen' : 'Fortschritt dieser Einheit'} />
        <Card>
          {practice.current.phase === 'learn' ? <LearningExercise key={practice.index} entry={practice.current.entry} onContinue={practice.advanceLearning} /> :
            isListening ? <ListeningExercise key={practice.index} entry={practice.current.entry} pool={available} busy={practice.busy} onGrade={practice.grade} /> :
            <SpeakingExercise key={practice.index} entry={practice.current.entry} busy={practice.busy} onGrade={practice.grade} />}
        </Card>
        <Button variant="ghost" disabled={practice.busy} onClick={practice.skip}>Überspringen · ohne Bewertung</Button>
      </> : <Card><p className="eyebrow">EINHEIT ABGESCHLOSSEN</p>
        <h2>{practice.completed ? `${practice.completed} Ausdrücke geübt.` : 'Gerade keine Wiederholung fällig.'}</h2>
        <p>{practice.completed ? `${practice.correct} beim ersten Versuch ohne Hilfe. Schwierige Ausdrücke kommen früher wieder.` : 'Du kannst später wiederholen oder ein anderes Thema wählen.'}</p>
        <Button onClick={practice.restart}>Nächste kurze Einheit</Button>
      </Card>}
  </div>;
}
