import { useCallback, useEffect, useRef, useState } from 'react';
import type { Grade, ReviewMode, VocabEntry } from '../../db/schema';
import { getPracticeSession, recordReview } from '../../srs/reviewProgress';
import type { PracticeStep } from '../../srs/scheduling';

export function usePractice(vocab: VocabEntry[], mode: ReviewMode, ordered = false) {
  const [queue, setQueue] = useState<PracticeStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [round, setRound] = useState(0);
  const locked = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    const token = ++generation.current;
    // eslint-disable-next-line react/set-state-in-effect -- Clear the previous database query while the next session loads.
    setQueue(null); setError(''); setIndex(0); setCompleted(0); setCorrect(0); setBusy(false);
    locked.current = false;
    getPracticeSession(vocab, mode, ordered).then(items => {
      if (generation.current === token) setQueue(items);
    }).catch(() => { if (generation.current === token) setError('Fortschritt konnte nicht geladen werden. Bitte erneut versuchen.'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- This is a request generation counter, not a DOM ref.
    return () => { generation.current++; };
  }, [vocab, mode, ordered, round]);
  const current = queue?.[index];
  const grade = useCallback(async (value: Grade) => {
    if (!current || current.phase !== 'review' || locked.current) return;
    locked.current = true; setBusy(true); setError('');
    const token = generation.current;
    try {
      if (!current.retry) await recordReview(current.entry.id, mode, value, value >= 3 ? 'right' : 'wrong');
      if (token !== generation.current) return;
      if (!current.retry) {
        setCompleted(n => n + 1);
        if (value >= 3) setCorrect(n => n + 1);
        else setQueue(items => {
          const result = [...items!];
          result.splice(Math.min(index + 3, result.length), 0, { entry: current.entry, phase: 'review', retry: true });
          return result;
        });
      }
      setIndex(n => n + 1);
    } catch {
      if (token === generation.current) setError('Bewertung konnte nicht gespeichert werden. Bitte erneut versuchen.');
    } finally {
      if (token === generation.current) { locked.current = false; setBusy(false); }
    }
  }, [current, mode, index]);
  return { current, queue, index, completed, correct, busy, error, grade,
    advanceLearning: () => { if (current?.phase === 'learn' && !locked.current) setIndex(n => n + 1); },
    skip: () => {
      if (locked.current || !current) return;
      if (current.phase === 'learn') setQueue(items => items!.filter((step, position) => position <= index || step.entry.id !== current.entry.id));
      setIndex(n => n + 1);
    }, restart: () => setRound(n => n + 1) };
}
