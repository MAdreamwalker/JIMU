export type ProviderErrorCategory =
  | 'authentication'
  | 'insufficient-balance'
  | 'rate-limit'
  | 'safety-review'
  | 'network-timeout'
  | 'unsupported-model'
  | 'parameter-error'
  | 'server-error'
  | 'unknown';

export interface NormalizedProviderError {
  category: ProviderErrorCategory;
  message: string;
}

interface ProviderErrorLike {
  status?: number;
  message?: string;
}

export function normalizeProviderError(error: unknown): NormalizedProviderError {
  const value = typeof error === 'object' && error !== null ? (error as ProviderErrorLike) : {};
  const message = typeof value.message === 'string' ? value.message : 'Unknown provider error';
  const lower = message.toLowerCase();

  if (value.status === 401 || lower.includes('api key') || lower.includes('unauthorized')) {
    return { category: 'authentication', message };
  }
  if (value.status === 429 || lower.includes('rate limit')) {
    return { category: 'rate-limit', message };
  }
  if (lower.includes('balance') || lower.includes('credit')) {
    return { category: 'insufficient-balance', message };
  }
  if (lower.includes('safety') || lower.includes('review')) {
    return { category: 'safety-review', message };
  }
  if (lower.includes('timeout')) {
    return { category: 'network-timeout', message };
  }
  if (lower.includes('unsupported model')) {
    return { category: 'unsupported-model', message };
  }
  if (value.status !== undefined && value.status >= 500) {
    return { category: 'server-error', message };
  }
  if (value.status !== undefined && value.status >= 400) {
    return { category: 'parameter-error', message };
  }
  return { category: 'unknown', message };
}
