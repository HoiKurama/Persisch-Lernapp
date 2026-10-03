import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRecorder } from './useRecorder';
afterEach(() => { vi.unstubAllGlobals(); });
describe('microphone lifecycle', () => {
  it('releases permission granted after leaving the exercise and never records', async () => {
    let resolve!: (stream: MediaStream) => void;
    const getUserMedia = vi.fn(() => new Promise<MediaStream>(done => { resolve = done; }));
    const track = { stop: vi.fn(), onended: null };
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    const Constructor = vi.fn();
    vi.stubGlobal('MediaRecorder', Constructor);
    const complete = vi.fn();
    const { result, unmount } = renderHook(() => useRecorder(complete));
    let pending!: Promise<void>;
    act(() => { pending = result.current.start(); });
    unmount();
    await act(async () => { resolve({ getTracks: () => [track] } as unknown as MediaStream); await pending; });
    expect(track.stop).toHaveBeenCalledOnce();
    expect(Constructor).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });
  it('prevents concurrent permission requests', async () => {
    let resolve!: (stream: MediaStream) => void;
    const getUserMedia = vi.fn(() => new Promise<MediaStream>(done => { resolve = done; }));
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.stubGlobal('MediaRecorder', vi.fn());
    const { result, unmount } = renderHook(() => useRecorder(vi.fn()));
    let pending!: Promise<void>;
    act(() => { pending = result.current.start(); void result.current.start(); });
    expect(getUserMedia).toHaveBeenCalledOnce();
    unmount();
    await act(async () => { resolve({ getTracks: () => [] } as unknown as MediaStream); await pending; });
  });
});
