import { CLOUDFLARE } from '../../globals';
import { CompletionResponse, ErrorResponse, ProviderConfig } from '../types';
import { CloudflareErrorResponseTransform } from './chatComplete';

export const CloudflareCompleteConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: '@cf/qwen/qwen2.5-7b-instruct',
  },
  prompt: { param: 'prompt', required: true },
  max_tokens: { param: 'max_tokens', default: 128 },
  stream: { param: 'stream', default: false },
};

export const CloudflareCompleteResponseTransform: (
  response: CompletionResponse | any,
  responseStatus: number
) => CompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    return CloudflareErrorResponseTransform(response) || response;
  }
  return { ...response, provider: CLOUDFLARE };
};

export const CloudflareCompleteStreamChunkTransform: (
  response: string
) => string = (responseChunk) => {
  let chunk = responseChunk.trim().replace(/^data: /, '');
  if (chunk === '[DONE]') return `data: ${chunk}\n\n`;
  return `data: ${JSON.stringify({ ...JSON.parse(chunk), provider: CLOUDFLARE })}\n\n`;
};
