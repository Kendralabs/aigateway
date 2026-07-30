import { Context } from 'hono';

const piiPatterns = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b(?:\d{4}-){3}\d{4}\b/g, // Credit Card (simple)
];

function maskPii(text: string): string {
  let masked = text;
  for (const pattern of piiPatterns) {
    masked = masked.replace(pattern, '[REDACTED]');
  }
  return masked;
}

export const piiMasking = () => {
  return async (c: Context, next: any) => {
    // Note: Request body streaming limitation in Hono middleware.
    // This is a placeholder structure for PII masking logic.
    console.log('PII Masking middleware initialized');
    await next();
  };
};
