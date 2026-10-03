export interface AudioSources {
  reference?: string;
  dilara?: string;
  farid?: string;
}

export function resolvePublicPath(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;
  return `/${path}`;
}

/** Whether at least one voice recording is available for this entry. */
export function hasPlayableAudio(audio: AudioSources): boolean {
  return Boolean(audio.dilara || audio.farid || audio.reference);
}

/** Keep the model voice and the learner's recording from overlapping. */
export function pauseOtherAudio(active?: HTMLMediaElement): void {
  document.querySelectorAll<HTMLAudioElement>('#root audio').forEach(element => {
    if (element !== active) element.pause();
  });
}
