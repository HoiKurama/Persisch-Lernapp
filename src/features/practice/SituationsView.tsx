import { useMemo, useState } from 'react';
import type { VocabEntry } from '../../db/schema';
import { SITUATIONS, type Situation } from '../../data/situations';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { usePractice } from './usePractice';
import { LearningExercise } from './LearningExercise';
import { SpeakingExercise } from './SpeakingExercise';

export function SituationsView({ vocab }: { vocab: VocabEntry[] }) {
  const [selected, setSelected] = useState(SITUATIONS[0].id);
  const situation = SITUATIONS.find(item => item.id === selected)!;
  return <div className="view">
    <div className="view-header"><p className="eyebrow">PERSISCH IM ALLTAG</p><h1>Was würdest du sagen?</h1>
      <p className="muted">Kurze Rollenübungen mit deutschen Impulsen. Antworte laut auf Persisch.</p></div>
    <label className="field-label">Situation
      <select value={selected} onChange={event => setSelected(event.target.value)}>
        {SITUATIONS.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
    </label>
    <p className="muted">{situation.description}</p>
    <SituationPractice key={selected} situation={situation} vocab={vocab} />
  </div>;
}

function SituationPractice({ situation, vocab }: { situation: Situation; vocab: VocabEntry[] }) {
  const entries = useMemo(() => situation.steps.map(step => vocab.find(entry => entry.id === step.vocabId))
    .filter((entry): entry is VocabEntry => !!entry), [situation, vocab]);
  const practice = usePractice(entries, 'recording', true);
  return <>
    {practice.error && <div role="alert" className="notice"><p>{practice.error}</p>
      {!practice.queue && <Button onClick={practice.restart}>Erneut laden</Button>}</div>}
    {practice.queue === null ? <p role="status">Lade deine Rollenübung …</p> : practice.current ? <>
      <ProgressBar value={practice.index} max={practice.queue.length} label={practice.current.phase === 'learn' ? 'Zuerst neue Ausdrücke kennenlernen' : practice.current.retry ? 'Noch einmal festigen' : 'Deine Gesprächsschritte'} />
      <Card>
        {practice.current.phase === 'learn' ? <LearningExercise key={practice.index} entry={practice.current.entry} onContinue={practice.advanceLearning} /> : <>
          <div className="situation-context"><p>{situation.steps.find(step => step.vocabId === practice.current!.entry.id)?.context}</p></div>
          <SpeakingExercise key={practice.index} entry={practice.current.entry} busy={practice.busy} onGrade={practice.grade} />
        </>}
      </Card>
      <Button variant="ghost" disabled={practice.busy} onClick={practice.skip}>Überspringen · ohne Bewertung</Button>
    </> : <Card><p className="eyebrow">ROLLENÜBUNG ABGESCHLOSSEN</p><h2>{practice.completed} Antworten geübt.</h2>
      <p className="muted">{practice.correct} beim ersten Versuch ohne Hilfe. Die Antworten zählen zu deinem Sprechfortschritt.</p>
      <Button onClick={practice.restart}>Situation erneut üben</Button></Card>}
  </>;
}
