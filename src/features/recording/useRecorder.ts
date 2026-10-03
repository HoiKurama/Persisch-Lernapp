import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderStatus = 'idle' | 'requesting-permission' | 'recording' | 'processing' | 'permission-denied' | 'unsupported' | 'error';
export interface RecordingResult { blob: Blob; mimeType: string }
export function isRecordingSupported() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
}
const TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];

export function useRecorder(onComplete: (result: RecordingResult) => void, options: { maxDurationMs?: number } = {}) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const callback = useRef(onComplete);
  useEffect(() => { callback.current = onComplete; }, [onComplete]);
  const generation = useRef(0);
  const busy = useRef(false);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duration = options.maxDurationMs ?? 12_000;

  const release = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach(track => { track.onended = null; track.stop(); });
    stream.current = null;
    busy.current = false;
  }, []);

  const cancel = useCallback(() => {
    generation.current++;
    const active = recorder.current;
    if (active) {
      active.onstop = null;
      active.onerror = null;
      active.ondataavailable = null;
      if (active.state !== 'inactive') active.stop();
    }
    recorder.current = null;
    release();
  }, [release]);

  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') {
      setStatus('processing');
      recorder.current.stop();
    }
  }, []);

  const start = useCallback(async () => {
    if (busy.current) return;
    if (!isRecordingSupported()) {
      setStatus('unsupported');
      setErrorMessage('Auf diesem Gerät ist keine Aufnahme verfügbar. Du kannst trotzdem laut üben.');
      return;
    }
    busy.current = true;
    const token = ++generation.current;
    setErrorMessage(null);
    setStatus('requesting-permission');
    try {
      const input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (generation.current !== token) {
        input.getTracks().forEach(track => track.stop());
        return;
      }
      stream.current = input;
      const mimeType = TYPES.find(type => MediaRecorder.isTypeSupported(type));
      const active = new MediaRecorder(input, mimeType ? { mimeType } : undefined);
      recorder.current = active;
      const chunks: BlobPart[] = [];
      const fail = () => {
        if (generation.current !== token) return;
        cancel();
        setStatus('error');
        setErrorMessage('Die Aufnahme wurde unterbrochen. Bitte erneut aufnehmen.');
      };
      input.getTracks().forEach(track => { track.onended = fail; });
      active.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      active.onerror = fail;
      active.onstop = () => {
        if (generation.current !== token) return;
        const type = active.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type });
        release();
        recorder.current = null;
        if (!blob.size) {
          setStatus('error');
          setErrorMessage('Die Aufnahme ist leer. Bitte erneut aufnehmen.');
          return;
        }
        setStatus('idle');
        callback.current({ blob, mimeType: type });
      };
      active.start();
      setStatus('recording');
      timer.current = setTimeout(stop, duration);
    } catch (error) {
      if (generation.current !== token) return;
      cancel();
      const denied = error instanceof DOMException && error.name === 'NotAllowedError';
      setStatus(denied ? 'permission-denied' : 'error');
      setErrorMessage(denied ? 'Bitte den Mikrofonzugriff in den Browser-Einstellungen erlauben.' : 'Mikrofon nicht verfügbar. Du kannst trotzdem laut üben.');
    }
  }, [cancel, duration, release, stop]);

  useEffect(() => {
    const hide = () => { if (document.hidden) { cancel(); setStatus('idle'); } };
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); cancel(); };
  }, [cancel]);
  return { status, errorMessage, isRecording: status === 'recording', start, stop, cancel };
}
