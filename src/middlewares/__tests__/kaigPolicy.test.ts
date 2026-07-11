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
  });

  it('should bypass non-POST requests', async () => {
    app.get('/v1/chat/completions', (c) => c.json({ success: true }));
    const res = await app.request('/v1/chat/completions', {
      method: 'GET'
    });
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should bypass unrelated paths', async () => {
    app.post('/v1/unrelated', (c) => c.json({ success: true }));
    const res = await app.request('/v1/unrelated', {
      method: 'POST',
      body: JSON.stringify({ model: 'gpt-4o' }),
      headers: { 'Content-Type': 'application/json' }
    });
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should bypass check and allow request if model catalog is unreachable', async () => {
    app.post('/v1/chat/completions', (c) => c.json({ success: true }));
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

  it('should dynamically inject provider credentials and route to next handler', async () => {
    // 1. Mock model lookup
    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider_id: 'openai',
        status: 'active'
      })
    });

    // 2. Mock provider details lookup
    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        id: 'openai',
        name: 'OpenAI',
        api_key: 'sk-test-key-12345',
        api_base_url: 'https://custom-openai-url.com/v1'
      })
    });

    // Add final route handler that asserts injected headers are present in the Hono context Request!
    app.post('/v1/chat/completions', (c) => {
      const providerHeader = c.req.header('x-portkey-provider');
      const apiKeyHeader = c.req.header('x-portkey-api-key');
      const authHeader = c.req.header('authorization');
      const customHostHeader = c.req.header('x-portkey-custom-host');

      return c.json({
        success: true,
        injected: {
          provider: providerHeader,
          apiKey: apiKeyHeader,
          auth: authHeader,
          customHost: customHostHeader
        }
      });
    });

    const res = await app.request('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({ model: 'gpt-4o' }),
      headers: { 'Content-Type': 'application/json' }
    });

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.success).toBe(true);
    expect(data.injected.provider).toBe('openai');
    expect(data.injected.apiKey).toBe('sk-test-key-12345');
    expect(data.injected.auth).toBe('Bearer sk-test-key-12345');
    expect(data.injected.customHost).toBe('https://custom-openai-url.com/v1');
    
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
