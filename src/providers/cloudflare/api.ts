import { ProviderAPIConfig } from '../types';

const CloudflareApiConfig: ProviderAPIConfig = {
  getBaseURL: ({ providerOptions }) =>
    `https://gateway.ai.cloudflare.com/v1/${providerOptions.cloudflareAccountId}/${providerOptions.cloudflareGatewayId}/workers-ai`,
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` };
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case 'complete':
        return '/v1/completions';
      case 'chatComplete':
        return '/v1/chat/completions';
      case 'embed':
        return '/v1/embeddings';
      default:
        return '';
    }
  },
};

export default CloudflareApiConfig;
