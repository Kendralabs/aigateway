import { CLOUDFLARE } from '../../globals';
import { Params } from '../../types/requestBody';
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
  transformFinishReason,
} from '../utils';

export const CloudflareChatCompleteConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: '@cf/meta/llama-3.1-8b-instruct',
  },
  messages: {
    param: 'messages',
    required: true,
    transform: (params: Params) => {
      return params.messages?.map((message) => {
        if (message.role === 'developer') return { ...message, role: 'system' };
        return message;
      });
    },
  },
  max_tokens: { param: 'max_tokens', default: 1000 },
  temperature: { param: 'temperature' },
  stream: { param: 'stream', default: false },
};

// Cloudflare typically returns standard OpenAI-style errors or 1xxx range codes
export const CloudflareErrorResponseTransform: (
  response: any
) => ErrorResponse | false = (response) => {
  if (response.error) {
    return generateErrorResponse(
      {
        message: response.error.message || response.error,
        type: response.error.type || null,
        param: null,
        code: response.error.code || null,
      },
      CLOUDFLARE
    );
  }
  return false;
};

export const CloudflareChatCompleteResponseTransform: (
  response: ChatCompletionResponse | any,
  responseStatus: number
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    const errorResponse = CloudflareErrorResponseTransform(response);
    if (errorResponse) return errorResponse;
  }

  if ('choices' in response) {
    return {
      ...response,
      provider: CLOUDFLARE,
    };
  }

  return generateInvalidProviderResponseError(response, CLOUDFLARE);
};

export const CloudflareChatCompleteStreamChunkTransform: (
  response: string
) => string = (responseChunk) => {
  let chunk = responseChunk.trim().replace(/^data: /, '');
  if (chunk === '[DONE]') return `data: ${chunk}\n\n`;

  const parsedChunk = JSON.parse(chunk);
  return `data: ${JSON.stringify({
    ...parsedChunk,
    provider: CLOUDFLARE,
  })}\n\n`;
};
