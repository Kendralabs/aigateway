import { Context, Next } from 'hono';

export const kaigPolicy = () => {
  return async (c: Context, next: Next) => {
    // 1. Skip if not a POST request
    if (c.req.method !== 'POST') {
      return next();
    }

    const path = c.req.path;
    // Intercept LLM endpoints
    if (
      !path.includes('/v1/chat/completions') &&
      !path.includes('/v1/completions') &&
      !path.includes('/v1/embeddings') &&
      !path.includes('/v1/messages')
    ) {
      return next();
    }

    try {
      // Clone request to avoid consuming original request body stream
      const body = (await c.req.raw
        .clone()
        .json()
        .catch(() => null)) as any;
      if (!body || !body.model) {
        return next();
      }

      const modelId = body.model;

      // Query model-catalog service
      const catalogUrl =
        process.env.MODEL_CATALOG_URL || 'http://localhost:8004';
      const modelResponse = await fetch(
        `${catalogUrl}/api/models/${modelId}`
      ).catch(() => null);

      if (!modelResponse) {
        // Fallback: If catalog is down, we log and allow in local dev mode
        console.warn(
          `KAIG Policy Warning: Model Catalog service at ${catalogUrl} is unreachable. Bypassing check.`
        );
        return next();
      }

      if (modelResponse.status === 404) {
        return c.json(
          {
            error: {
              message: `Access Denied: Model '${modelId}' is not registered in the KAIG Model Catalog.`,
              type: 'invalid_request_error',
              code: 403,
            },
          },
          403
        );
      }

      if (!modelResponse.ok) {
        return c.json(
          {
            error: {
              message: `Access Denied: Model Catalog returned an error checking model status.`,
              type: 'api_error',
              code: 502,
            },
          },
          502
        );
      }

      const modelData = (await modelResponse.json()) as any;
      if (modelData.status !== 'active') {
        return c.json(
          {
            error: {
              message: `Access Denied: Model '${modelId}' status is currently '${modelData.status}'. It must be approved and 'active' to be invoked.`,
              type: 'access_denied',
              code: 403,
            },
          },
          403
        );
      }

      // If x-portkey-provider is not already set in the request headers, we dynamically configure it!
      const existingProvider = c.req.header('x-portkey-provider');
      if (!existingProvider && modelData.provider_id) {
        // Fetch the provider details to get base URL and API Key
        const providerResponse = await fetch(
          `${catalogUrl}/api/providers/${modelData.provider_id}`
        ).catch(() => null);
        if (providerResponse && providerResponse.ok) {
          const providerData = (await providerResponse.json()) as any;
          if (providerData.api_key) {
            // Construct modified headers
            const headers = new Headers(c.req.raw.headers);
            headers.set('x-portkey-provider', modelData.provider_id);
            headers.set('x-portkey-api-key', providerData.api_key);
            headers.set('authorization', `Bearer ${providerData.api_key}`);
            if (providerData.api_base_url) {
              headers.set('x-portkey-custom-host', providerData.api_base_url);
            }

            // Create a new Request object with the updated headers
            const newReq = new Request(c.req.raw, { headers });
            // Override the raw request in the Hono context!
            Object.defineProperty(c.req, 'raw', {
              value: newReq,
              writable: true,
            });
          }
        }
      }

      // Model is active and validated, proceed!
      return next();
    } catch (err: any) {
      console.error('KAIG Policy Enforcement Error:', err);
      return next();
    }
  };
};
