// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import api, { handler } from './check-pronunciation';
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe('optional speech endpoint', () => {
  it('uses a Vercel Web Handler and rejects unsupported methods', async () => {
    expect(api.fetch).toBe(handler);
    expect((await handler(new Request('http://localhost/api/check-pronunciation'))).status).toBe(405);
  });
  it('does not return invalid script supplied as an expected answer', async () => {
    const form = new FormData(); form.append('expectedColloquial', String.fromCharCode(0x0633));
    const response = await handler(new Request('http://localhost/api/check-pronunciation', { method: 'POST', body: form }));
    expect(response.status).toBe(400);
    expect((await response.json() as { expected: { colloquial: string } }).expected.colloquial).toBe('');
  });
  it('returns an actionable error without calling the cloud when unconfigured', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const form = new FormData(); form.append('expectedColloquial', 'salâm');
    form.append('audio', new Blob(['test'], { type: 'audio/webm' }), 'test.webm');
    const response = await handler(new Request('http://localhost/api/check-pronunciation', { method: 'POST', body: form }));
    expect(response.status).toBe(503);
    expect((await response.json() as { verdict: string }).verdict).toBe('error');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
