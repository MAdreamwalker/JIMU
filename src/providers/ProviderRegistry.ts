import type { ProviderCapability } from '../domain/providers';

export type { ProviderCapability } from '../domain/providers';

export interface AiProvider {
  id: string;
  label: string;
  capabilities: ProviderCapability[];
  generateText?: (input: { prompt: string; systemPrompt?: string }) => Promise<{ text: string }>;
}

export class ProviderRegistry {
  private readonly providers = new Map<string, AiProvider>();

  register(provider: AiProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(providerId: string): AiProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    return provider;
  }
}
