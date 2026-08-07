import type { AiProvider } from './ProviderRegistry';

export function createCloudProvider(): AiProvider {
  return {
    id: 'cloud',
    label: 'Cloud',
    capabilities: ['text', 'image', 'image-to-image', 'video', 'image-to-video', 'upload', 'polling'],
  };
}
