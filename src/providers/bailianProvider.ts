import type { AiProvider } from './ProviderRegistry';

export function createBailianProvider(): AiProvider {
  return {
    id: 'bailian',
    label: 'Bailian',
    capabilities: ['text', 'image', 'image-to-image', 'video', 'image-to-video', 'polling'],
  };
}
