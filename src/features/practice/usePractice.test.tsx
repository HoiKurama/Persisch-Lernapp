import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { VocabEntry } from '../../db/schema';
import type { PracticeStep } from '../../srs/scheduling';
import { getPracticeSession, recordReview } from '../../srs/reviewProgress';
import { usePractice } from './usePractice';

vi.mock('../../srs/reviewProgress', () => ({ getPracticeSession: vi.fn(), recordReview: vi.fn() }));
const entry = { id: 'hello', german: 'Hallo', audio: { reference: 'test.wav' } } as VocabEntry;
const vocab = [entry];
const learn: PracticeStep = { entry, phase: 'learn', retry: false };
const review: PracticeStep = { entry, phase: 'review', retry: false };
beforeEach(() => {
  vi.mocked(getPracticeSession).mockResolvedValue([learn, review]);
  vi.mocked(recordReview).mockResolvedValue({} as Awaited<ReturnType<typeof recordReview>>);
});
afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe('practice session changes and persistence', () => {
  it('does not grant progress for learning before a recall attempt', async () => {
    const { result } = renderHook(() => usePractice(vocab, 'recording'));
    await waitFor(() => expect(result.current.current?.phase).toBe('learn'));
    await act(() => result.current.grade(4));
    expect(recordReview).not.toHaveBeenCalled();
    act(() => result.current.advanceLearning());
    await act(() => result.current.grade(4));
    expect(recordReview).toHaveBeenCalledExactlyOnceWith('hello', 'recording', 4, 'right');
    expect(result.current.completed).toBe(1);
  });
  it('skips later recall when the learner skips an introduction', async () => {
    const { result } = renderHook(() => usePractice(vocab, 'listening'));
    await waitFor(() => expect(result.current.current?.phase).toBe('learn'));
    act(() => result.current.skip());
    expect(result.current.current).toBeUndefined();
    expect(result.current.completed).toBe(0);
    expect(recordReview).not.toHaveBeenCalled();
  });
  it('rehearses a mistake once without granting a second logged success', async () => {
    vi.mocked(getPracticeSession).mockResolvedValue([review]);
    const { result } = renderHook(() => usePractice(vocab, 'recording'));
    await waitFor(() => expect(result.current.current?.phase).toBe('review'));
    await act(() => result.current.grade(1));
    expect(result.current.current?.retry).toBe(true);
    await act(() => result.current.grade(4));
    expect(recordReview).toHaveBeenCalledOnce();
    expect(result.current.correct).toBe(0);
    expect(result.current.current).toBeUndefined();
  });
  it('locks duplicate saves and allows another attempt after a storage error', async () => {
    vi.mocked(getPracticeSession).mockResolvedValue([review]);
    vi.mocked(recordReview).mockRejectedValueOnce(new Error('storage failed'));
    const { result } = renderHook(() => usePractice(vocab, 'recording'));
    await waitFor(() => expect(result.current.current?.phase).toBe('review'));
    await act(async () => { await Promise.all([result.current.grade(4), result.current.grade(4)]); });
    expect(recordReview).toHaveBeenCalledOnce();
    expect(result.current.error).toContain('nicht gespeichert');
    expect(result.current.completed).toBe(0);
    await act(() => result.current.grade(4));
    expect(result.current.error).toBe('');
    expect(result.current.completed).toBe(1);
  });
  it('ignores a late response after changing the topic', async () => {
    let resolve!: (steps: PracticeStep[]) => void;
    vi.mocked(getPracticeSession).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    const nextEntry = { ...entry, id: 'next' };
    const nextVocab = [nextEntry];
    const nextStep = { ...review, entry: nextEntry };
    vi.mocked(getPracticeSession).mockResolvedValueOnce([nextStep]);
    const { result, rerender } = renderHook(({ items }) => usePractice(items, 'recording'), { initialProps: { items: vocab } });
    rerender({ items: nextVocab });
    await waitFor(() => expect(result.current.current?.entry.id).toBe('next'));
    await act(async () => { resolve([review]); });
    expect(result.current.current?.entry.id).toBe('next');
  });
});
