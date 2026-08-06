import type { AiProvider } from './ProviderRegistry';

export function createOpenAiCompatibleProvider(): AiProvider {
  return {
    id: 'openai-compatible',
    label: 'OpenAI Compatible',
    capabilities: ['text', 'image', 'image-to-image', 'polling'],
  };
}
