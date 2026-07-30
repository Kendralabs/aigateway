import { CLOUDFLARE } from '../../globals';
import { EmbedParams, EmbedResponse } from '../../types/embedRequestBody';
import { ErrorResponse, ProviderConfig } from '../types';
import { CloudflareErrorResponseTransform } from './chatComplete';

export const CloudflareEmbedConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: '@cf/baai/bge-base-en-v1.5',
  },
  input: {
    param: 'input',
    required: true,
    transform: (params: EmbedParams) =>
      Array.isArray(params.input) ? params.input : [params.input],
  },
};

export const CloudflareEmbedResponseTransform: (
  response: any,
  responseStatus: number
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200) {
    return CloudflareErrorResponseTransform(response) || response;
  }
  return {
    ...response,
    provider: CLOUDFLARE,
  };
};
