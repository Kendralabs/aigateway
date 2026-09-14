// src/handlers/mcpHandler.ts
import { Context } from 'hono';
import { logger } from '../apm';

/**
 * MCP handler - forwards incoming MCP requests to the configured KMCP server.
 * The base URL of the KMCP server should be provided via the environment variable
 * `KMCP_BASE_URL`. Example: https://kmcp.mycompany.com
 *
 * The handler preserves the HTTP method, path (excluding the `/v1/mcp` prefix),
 * query parameters, headers (except Host) and body. It returns the KMCP response
 * directly to the client, preserving status codes and JSON bodies.
 */
export async function mcpHandler(c: Context) {
  const kmcpBase = process.env.KMCP_BASE_URL;
  if (!kmcpBase) {
    logger.error('KMCP_BASE_URL not set');
    return c.json({ error: 'KMCP base URL not configured' }, 500);
  }

  // Construct target URL
  const incomingPath = c.req.path.replace(/^\/v1\/mcp/, '');
  const targetUrl = `${kmcpBase}${incomingPath}${c.req.raw.url.includes('?') ? c.req.raw.url.substring(c.req.raw.url.indexOf('?')) : ''}`;

  const init: RequestInit = {
    method: c.req.method,
    headers: { ...c.req.headers },
    // Remove hop‑by‑hop headers that should not be forwarded
    redirect: 'manual',
  };

  // Copy body for methods that support it
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
    const body = await c.req.text();
    init.body = body;
    // Preserve content-type
    if (!init.headers['content-type'] && c.req.headers.get('content-type')) {
      init.headers['content-type'] = c.req.headers.get('content-type') as string;
    }
  }

  try {
    const resp = await fetch(targetUrl, init);
    const respText = await resp.text();
    const contentType = resp.headers.get('content-type') || '';
    const status = resp.status;
    // If JSON, parse, otherwise return raw text
    if (contentType.includes('application/json')) {
      const json = JSON.parse(respText);
      return c.json(json, status);
    } else {
      return c.text(respText, status);
    }
  } catch (err: any) {
    logger.error('MCP proxy error', err);
    return c.json({ error: 'Failed to proxy to KMCP server', details: err.message }, 502);
  }
}
