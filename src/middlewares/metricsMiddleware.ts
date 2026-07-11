/**
 * Prometheus metrics middleware for Kendra AI Gateway.
 * Exposes /metrics endpoint with:
 *   - gateway_requests_total (counter, by provider, model, status)
 *   - gateway_request_duration_ms (histogram, by provider, model)
 *   - gateway_tokens_total (counter, by provider, model, type=input|output)
 *   - gateway_cache_hits_total (counter, by provider)
 *   - gateway_errors_total (counter, by provider, error_type)
 */

import { Context, Hono, MiddlewareHandler } from 'hono';

// In-memory metric stores (reset on pod restart — Prometheus scrapes frequently)
const counters: Record<string, number> = {};
const histogramBuckets = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
const histograms: Record<string, number[]> = {};

function inc(name: string, labels: Record<string, string>, value = 1) {
  const key = `${name}{${Object.entries(labels)
    .map(([k, v]) => `${k}="${v}"`)
    .join(',')}}`;
  counters[key] = (counters[key] || 0) + value;
}

function observe(name: string, labels: Record<string, string>, ms: number) {
  const key = `${name}{${Object.entries(labels)
    .map(([k, v]) => `${k}="${v}"`)
    .join(',')}}`;
  if (!histograms[key]) {
    histograms[key] = new Array(histogramBuckets.length + 2).fill(0); // buckets + Inf + count
  }
  const h = histograms[key];
  h[h.length - 1]++; // count
  for (let i = 0; i < histogramBuckets.length; i++) {
    if (ms <= histogramBuckets[i]) h[i]++;
  }
  h[histogramBuckets.length]++; // +Inf
}

function renderPrometheus(): string {
  const lines: string[] = [];

  lines.push(
    '# HELP gateway_requests_total Total LLM requests proxied through the gateway'
  );
  lines.push('# TYPE gateway_requests_total counter');
  for (const [k, v] of Object.entries(counters)) {
    if (k.startsWith('gateway_requests_total')) lines.push(`${k} ${v}`);
  }

  lines.push(
    '# HELP gateway_tokens_total Total tokens processed (input + output)'
  );
  lines.push('# TYPE gateway_tokens_total counter');
  for (const [k, v] of Object.entries(counters)) {
    if (k.startsWith('gateway_tokens_total')) lines.push(`${k} ${v}`);
  }

  lines.push('# HELP gateway_errors_total Total gateway errors by type');
  lines.push('# TYPE gateway_errors_total counter');
  for (const [k, v] of Object.entries(counters)) {
    if (k.startsWith('gateway_errors_total')) lines.push(`${k} ${v}`);
  }

  lines.push('# HELP gateway_cache_hits_total Cache hits');
  lines.push('# TYPE gateway_cache_hits_total counter');
  for (const [k, v] of Object.entries(counters)) {
    if (k.startsWith('gateway_cache_hits_total')) lines.push(`${k} ${v}`);
  }

  lines.push(
    '# HELP gateway_request_duration_ms Request duration in milliseconds'
  );
  lines.push('# TYPE gateway_request_duration_ms histogram');
  for (const [labelKey, bucketValues] of Object.entries(histograms)) {
    if (!labelKey.startsWith('gateway_request_duration_ms')) continue;
    const labels = labelKey
      .replace('gateway_request_duration_ms', '')
      .replace(/^\{/, '')
      .replace(/\}$/, '');
    const labelStr = labels ? `{${labels},` : '{';
    for (let i = 0; i < histogramBuckets.length; i++) {
      lines.push(
        `gateway_request_duration_ms_bucket${labelStr}le="${histogramBuckets[i]}"} ${bucketValues[i]}`
      );
    }
    lines.push(
      `gateway_request_duration_ms_bucket${labelStr}le="+Inf"} ${bucketValues[histogramBuckets.length]}`
    );
    lines.push(
      `gateway_request_duration_ms_count${labels ? `{${labels}}` : ''} ${bucketValues[bucketValues.length - 1]}`
    );
  }

  return lines.join('\n') + '\n';
}

/**
 * Middleware: record metrics for each LLM request.
 * Attach to app.use('*') AFTER the response is written.
 */
export const metricsRecorder: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;

  const provider = c.req.header('x-portkey-provider') || 'unknown';
  const model = (() => {
    try {
      const body = c.get('requestBody') as any;
      return body?.model || 'unknown';
    } catch {
      return 'unknown';
    }
  })();
  const status = String(c.res.status);
  const cacheStatus = c.res.headers.get('x-portkey-cache') || 'miss';

  inc('gateway_requests_total', { provider, model, status });
  observe('gateway_request_duration_ms', { provider, model }, ms);

  if (cacheStatus === 'hit') {
    inc('gateway_cache_hits_total', { provider, model });
  }

  if (c.res.status >= 400) {
    inc('gateway_errors_total', { provider, model, status });
  }

  // Token counting from response body (best effort)
  try {
    const respClone = c.res.clone();
    const body = (await respClone.json()) as any;
    const usage = body?.usage;
    if (usage) {
      if (usage.prompt_tokens) {
        inc(
          'gateway_tokens_total',
          { provider, model, type: 'input' },
          usage.prompt_tokens
        );
      }
      if (usage.completion_tokens) {
        inc(
          'gateway_tokens_total',
          { provider, model, type: 'output' },
          usage.completion_tokens
        );
      }

      // Asynchronously post usage to model-catalog without blocking client response
      if (model !== 'unknown' && c.res.status === 200) {
        const catalogUrl = process.env.MODEL_CATALOG_URL || 'http://localhost:8004';
        fetch(`${catalogUrl}/api/usage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model_id: model,
            user_id: c.req.header('x-kiam-user-id') || 'guest',
            request_tokens: usage.prompt_tokens || 0,
            response_tokens: usage.completion_tokens || 0
          })
        }).catch((err: any) => {
          console.error('Failed to post usage telemetry to catalog:', err.message);
        });
      }
    }
  } catch {
    // streaming response or non-JSON — skip token counting
  }
};

/**
 * Register the /metrics endpoint on the Hono app.
 * Call once during app setup: registerMetricsEndpoint(app)
 */
export function registerMetricsEndpoint(app: Hono) {
  app.get('/metrics', (c: Context) => {
    return c.text(renderPrometheus(), 200, {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    });
  });
}
