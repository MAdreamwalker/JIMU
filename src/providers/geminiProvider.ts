import type { AiProvider } from './ProviderRegistry';

export function createGeminiProvider(): AiProvider {
  return {
    id: 'gemini',
    label: 'Gemini',
    capabilities: ['text', 'image'],
  };
}
