import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ListeningExercise } from './ListeningExercise';
import { SpeakingExercise } from './SpeakingExercise';
import { LearningExercise } from './LearningExercise';
import type { VocabEntry } from '../../db/schema';
const entry = { id: 'hello', german: 'Hallo', transliterationColloquial: 'salâm', category: 'begruessung-small-talk', audio: { dilara: 'test.mp3' } } as VocabEntry;
beforeEach(() => { vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('oral practice', () => {
  it('requires a complete hearing and spoken repetition before finishing an introduction', () => {
    const advance = vi.fn();
    const { container } = render(<LearningExercise entry={entry} onContinue={advance} />);
    const spoken = screen.getByRole('button', { name: 'Laut nachgesprochen' }) as HTMLButtonElement;
    expect(spoken.disabled).toBe(true);
    fireEvent.playing(container.querySelector('audio')!);
    expect(spoken.disabled).toBe(true);
    fireEvent.ended(container.querySelector('audio')!);
    expect(spoken.disabled).toBe(false);
    fireEvent.click(spoken);
    expect(advance).not.toHaveBeenCalled();
    expect(screen.queryByText('salâm')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Merken & weiter' }));
    expect(advance).toHaveBeenCalledOnce();
  });
  it('requires playback before answering and conceals the transcript', () => {
    const grade = vi.fn();
    const { container } = render(<ListeningExercise entry={entry} pool={[entry]} busy={false} onGrade={grade} />);
    expect(screen.queryByText('salâm')).toBeNull();
    const answer = screen.getByRole('button', { name: 'Hallo' }) as HTMLButtonElement;
    expect(answer.disabled).toBe(true);
    fireEvent.playing(container.querySelector('audio')!);
    expect(answer.disabled).toBe(false);
    fireEvent.click(answer);
    expect(grade).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(grade).toHaveBeenCalledWith(4);
  });
  it('does not allow independent-success grading after showing a hint', () => {
    const grade = vi.fn();
    render(<SpeakingExercise entry={entry} busy={false} onGrade={grade} />);
    expect(screen.queryByText('salâm')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ohne Aufnahme gesprochen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hörbeispiel & Lösung zeigen' }));
    expect(screen.queryByRole('button', { name: 'Selbstständig gesagt' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Mit Hilfe / noch unsicher' }));
    expect(grade).toHaveBeenCalledWith(2);
  });
});
