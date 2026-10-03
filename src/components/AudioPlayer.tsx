import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { pauseOtherAudio, resolvePublicPath, type AudioSources } from '../lib/audio';
import './ui.css';

export function AudioPlayer({ audio, label, onPlayed, onFinished, disabled = false }: { audio: AudioSources; label: string; onPlayed?: () => void; onFinished?: () => void; disabled?: boolean }) {
  const choices = Object.entries(audio).filter(([, path]) => !!path);
  const [voice, setVoice] = useState('');
  const [slow, setSlow] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const player = useRef<HTMLAudioElement>(null);
  const src = choices.find(([key]) => key === voice)?.[1] ?? choices[0]?.[1];
  useEffect(() => {
    const element = player.current;
    return () => { element?.pause(); };
  }, [src]);
  useEffect(() => { if (disabled) player.current?.pause(); }, [disabled]);

  if (!src) return <p className="audio-player-hint">Für diesen Ausdruck fehlt noch ein Hörbeispiel.</p>;

  function play() {
    const element = player.current;
    if (!element) return;
    setFailed(false);
    if (!element.paused) { element.pause(); return; }
    element.playbackRate = slow ? 0.75 : 1;
    element.play().catch(() => { setFailed(true); setPlaying(false); });
  }
  return <div className="audio-controls">
    <div className="action-row">
      <Button variant="secondary" disabled={disabled} onClick={play} aria-label={`${label}: ${playing ? 'pausieren' : 'abspielen'}`}>
        {playing ? 'Ⅱ Pause' : '▶ Anhören'}
      </Button>
      <Button variant="ghost" disabled={disabled} aria-pressed={slow} onClick={() => {
        setSlow(!slow);
        if (player.current) player.current.playbackRate = slow ? 1 : 0.75;
      }}>{slow ? '0,75× Langsam' : '1× Normal'}</Button>
      {choices.length > 1 && <select disabled={disabled} aria-label="Stimme" value={voice || choices[0][0]} onChange={e => setVoice(e.target.value)}>
        {choices.map(([key]) => <option key={key} value={key}>{key === 'dilara' ? 'Dilara' : key === 'farid' ? 'Farid' : 'Originalaufnahme'}</option>)}
      </select>}
    </div>
    <audio key={src} ref={player} src={resolvePublicPath(src)} preload="none"
      onLoadStart={() => { setPlaying(false); setFailed(false); }}
      onPlaying={event => { pauseOtherAudio(event.currentTarget); setPlaying(true); onPlayed?.(); }}
      onEnded={() => { setPlaying(false); if (player.current) player.current.currentTime = 0; onFinished?.(); }}
      onPause={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }} />
    {failed && <p role="alert" className="error-text">Hörbeispiel konnte nicht geladen werden. Bitte erneut versuchen.</p>}
  </div>;
}
