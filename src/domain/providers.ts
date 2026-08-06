export type ProviderCapability = 'text' | 'image' | 'image-to-image' | 'video' | 'image-to-video' | 'upload' | 'polling';
export type ProviderApiFormat = 'openai-compatible' | 'gemini' | 'custom';

export interface ProviderConfig {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  apiFormat: ProviderApiFormat;
  capabilities: ProviderCapability[];
  pollingIntervalMs?: number;
  timeoutMs?: number;
  retryCount?: number;
  concurrency?: number;
}

export interface ProviderModelRoute {
  providerId: string;
  model: string;
  capabilities: ProviderCapability[];
}
