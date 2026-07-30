import { ProviderAPIConfig } from '../types';
import { version } from '../../../package.json';

const BytezInferenceAPI: ProviderAPIConfig = {
  getBaseURL: () => 'https://api.bytez.com',
  headers: async ({ providerOptions }) => {
    const { apiKey } = providerOptions;

    const headers: Record<string, string> = {};

    headers['Authorization'] = `Key ${apiKey}`;
    headers['user-agent'] = `portkey/${version}`;

    return headers;
  },
  getEndpoint: ({ providerOptions, gatewayRequestBodyJSON: { model } }) => {
    const version = providerOptions.apiVersion
      ? parseInt(providerOptions.apiVersion)
      : 2;
    return `/models/v${version}/${model}`;
  },
};

export default BytezInferenceAPI;
