// src/handlers/atlassianMcpHandler.ts
import { Context } from 'hono';
import { logger } from '../apm';

/**
 * Atlassian MCP handler
 * Expects a JSON body:
 *   { "tool": "getJiraIssue", "args": { "issueKey": "PROJ-123" } }
 * The handler forwards the request to the appropriate Atlassian MCP tool
 * (lazy‑loaded via the MCP server "atlassian-mcp-server").
 */
export async function atlassianMcpHandler(c: Context) {
  // Validate JSON body
  let payload: { tool: string; args: any };
  try {
    const body = await c.req.json();
    payload = body as typeof payload;
  } catch (e) {
    logger.error('Invalid JSON payload for Atlassian MCP');
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const { tool, args } = payload;
  if (!tool) {
    return c.json({ error: 'Missing "tool" field' }, 400);
  }

  // Whitelist allowed tools (basic safety)
  const allowedTools = [
    'getJiraIssue',
    'searchJiraIssuesUsingJql',
    'createJiraIssue',
    'addCommentToJiraIssue',
    'transitionJiraIssue',
    'getConfluencePage',
    'searchConfluenceUsingCql',
    // add more as needed
  ];

  if (!allowedTools.includes(tool)) {
    return c.json({ error: `Tool "${tool}" not supported` }, 400);
  }

  // Use the generic MCP tool caller – we will invoke via the runtime environment.
  // Since we cannot directly call the lazy tool from here, we proxy the request
  // to the existing /v1/mcp/* proxy which already knows how to dispatch.
  // However, to keep this handler self‑contained we perform an internal fetch
  // to the same process's MCP proxy endpoint.
  const baseUrl = process.env.KMCP_BASE_URL || '';
  if (!baseUrl) {
    logger.error('KMCP_BASE_URL not set for Atlassian MCP');
    return c.json({ error: 'KMCP base URL not configured' }, 500);
  }

  // Construct target URL for the MCP proxy (reuse existing route)
  const targetUrl = `${baseUrl}/v1/mcp/${tool}`;

  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  };

  try {
    const resp = await fetch(targetUrl, init);
    const respText = await resp.text();
    const contentType = resp.headers.get('content-type') || '';
    const status = resp.status;
    if (contentType.includes('application/json')) {
      const json = JSON.parse(respText);
      return c.json(json, status);
    }
    return c.text(respText, status);
  } catch (err: any) {
    logger.error('Atlassian MCP proxy error', err);
    return c.json({ error: 'Failed to forward to Atlassian MCP', details: err.message }, 502);
  }
}
