import { Hono } from 'hono';
import { kaigPolicy } from '../kaigPolicy';

describe('KAIG Policy Middleware Unit Tests', () => {
  let app: Hono;
  let fetchMock: jest.Mock;
  const originalFetch = global.fetch;

  beforeAll(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as any;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    fetchMock.mockReset();
    app = new Hono();
    app.use('*', kaigPolicy());
    app.post('/v1/chat/completions', (c) => c.json({ success: true }));
  });

  it('should bypass non-POST requests', async () => {
    const res = await app.request('/v1/chat/completions', {
      method: 'GET'
    });
    expect(res.status).toBe(404); // Default Hono route not matched
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should bypass unrelated paths', async () => {
    const res = await app.request('/v1/unrelated', {
      method: 'POST',
      body: JSON.stringify({ model: 'gpt-4o' }),
      headers: { 'Content-Type': 'application/json' }
    });
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should bypass check and allow request if model catalog is unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Connection refused'));

    const res = await app.request('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({ model: 'gpt-4o' }),
      headers: { 'Content-Type': 'application/json' }
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should deny request with 403 if model is not registered (404 in catalog)', async () => {
    fetchMock.mockResolvedValueOnce({
      status: 404,
      ok: false,
      json: async () => ({ detail: 'Model not found' })
    });

    const res = await app.request('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({ model: 'unknown-model' }),
      headers: { 'Content-Type': 'application/json' }
    });

    expect(res.status).toBe(403);
    const data: any = await res.json();
    expect(data.error.message).toContain('is not registered');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should deny request with 403 if model is pending_approval', async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        id: 'gpt-4o',
        name: 'GPT-4o',
        status: 'pending_approval'
      })
    });

    const res = await app.request('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({ model: 'gpt-4o' }),
      headers: { 'Content-Type': 'application/json' }
    });

    expect(res.status).toBe(403);
    const data: any = await res.json();
    expect(data.error.message).toContain('status is currently \'pending_approval\'');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should allow request with 200 if model is active', async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        status: 'active'
      })
    });

    const res = await app.request('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({ model: 'claude-3-5-sonnet' }),
      headers: { 'Content-Type': 'application/json' }
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
