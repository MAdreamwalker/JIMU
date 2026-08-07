import { describe, expect, it } from 'vitest';
import { createBailianProvider } from '../../src/providers/bailianProvider';
import { createCloudProvider } from '../../src/providers/cloudProvider';
import { createGeminiProvider } from '../../src/providers/geminiProvider';
import { createOpenAiCompatibleProvider } from '../../src/providers/openAiCompatible';
import { ProviderRegistry } from '../../src/providers/ProviderRegistry';
import { normalizeProviderError } from '../../src/providers/errors';

describe('ProviderRegistry', () => {
  it('returns a registered provider by id', () => {
    const registry = new ProviderRegistry();
    registry.register({ id: 'mock', label: 'Mock', capabilities: ['text'], generateText: async () => ({ text: 'ok' }) });

    expect(registry.get('mock').label).toBe('Mock');
  });

  it('throws when a provider is not registered', () => {
    expect(() => new ProviderRegistry().get('missing')).toThrow('Provider not found: missing');
  });
});

describe('normalizeProviderError', () => {
  it('normalizes authentication errors', () => {
    expect(normalizeProviderError({ status: 401, message: 'invalid api key' })).toEqual({
      category: 'authentication',
      message: 'invalid api key',
    });
  });

  it.each([
    [{ status: 429, message: 'too many requests' }, 'rate-limit'],
    [{ message: 'insufficient balance' }, 'insufficient-balance'],
    [{ message: 'safety review required' }, 'safety-review'],
    [{ message: 'request timeout' }, 'network-timeout'],
    [{ message: 'unsupported model' }, 'unsupported-model'],
    [{ status: 400, message: 'bad parameter' }, 'parameter-error'],
    [{ status: 500, message: 'provider unavailable' }, 'server-error'],
    [new Error('unknown failure'), 'unknown'],
  ] as const)('normalizes %s as %s', (error, category) => {
    expect(normalizeProviderError(error).category).toBe(category);
  });
});

describe('provider stubs', () => {
  it('exposes deterministic capability metadata', () => {
    expect(createOpenAiCompatibleProvider()).toMatchObject({
      id: 'openai-compatible',
      capabilities: ['text', 'image', 'image-to-image', 'polling'],
    });
    expect(createGeminiProvider()).toMatchObject({ id: 'gemini', capabilities: ['text', 'image'] });
    expect(createBailianProvider()).toMatchObject({
      id: 'bailian',
      capabilities: ['text', 'image', 'image-to-image', 'video', 'image-to-video', 'polling'],
    });
    expect(createCloudProvider()).toMatchObject({
      id: 'cloud',
      capabilities: ['text', 'image', 'image-to-image', 'video', 'image-to-video', 'upload', 'polling'],
    });
  });
});
