import { ProviderConfigs } from '../types';
import CloudflareApiConfig from './api';
import {
  CloudflareChatCompleteConfig,
  CloudflareChatCompleteResponseTransform,
  CloudflareChatCompleteStreamChunkTransform,
} from './chatComplete';
import {
  CloudflareCompleteConfig,
  CloudflareCompleteResponseTransform,
  CloudflareCompleteStreamChunkTransform,
} from './complete';
import {
  CloudflareEmbedConfig,
  CloudflareEmbedResponseTransform,
} from './embed';

const CloudflareConfig: ProviderConfigs = {
  complete: CloudflareCompleteConfig,
  chatComplete: CloudflareChatCompleteConfig,
  embed: CloudflareEmbedConfig,
  api: CloudflareApiConfig,
  responseTransforms: {
    'stream-complete': CloudflareCompleteStreamChunkTransform,
    complete: CloudflareCompleteResponseTransform,
    chatComplete: CloudflareChatCompleteResponseTransform,
    'stream-chatComplete': CloudflareChatCompleteStreamChunkTransform,
    embed: CloudflareEmbedResponseTransform,
  },
};

export default CloudflareConfig;
