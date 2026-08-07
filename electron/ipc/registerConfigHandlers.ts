import { ipcMain } from 'electron';
import type { AppConfig } from '../services/configStore.js';

export function registerConfigHandlers(
  loadConfig: () => Promise<AppConfig>,
  saveConfig: (config: AppConfig) => Promise<void>,
): void {
  ipcMain.handle('config:getAll', () => loadConfig());
  ipcMain.handle('config:save', async (_event, config: unknown) => {
    assertAppConfig(config);
    await saveConfig(config);
  });
}

function assertAppConfig(config: unknown): asserts config is AppConfig {
  if (!config || typeof config !== 'object' || Array.isArray(config) || !hasExactKeys(config, ['rootPath', 'providers', 'cloud'])) {
    throw new Error('Invalid config: expected rootPath, providers, and cloud');
  }

  const value = config as Record<string, unknown>;
  if (typeof value.rootPath !== 'string') {
    throw new Error('Invalid config: rootPath must be a string');
  }
  if (!Array.isArray(value.providers) || value.providers.some((provider) => !isProvider(provider))) {
    throw new Error('Invalid config: providers must contain valid provider definitions');
  }
  if (!isCloudConfig(value.cloud)) {
    throw new Error('Invalid config: cloud must contain a token and credits');
  }
}

function isProvider(value: unknown): value is AppConfig['providers'][number] {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || !hasExactKeys(value, ['id', 'label', 'baseUrl', 'apiKey', 'modelName'])) {
    return false;
  }

  const provider = value as Record<string, unknown>;
  return typeof provider.id === 'string'
    && typeof provider.label === 'string'
    && typeof provider.baseUrl === 'string'
    && typeof provider.apiKey === 'string'
    && typeof provider.modelName === 'string';
}

function isCloudConfig(value: unknown): value is AppConfig['cloud'] {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !hasExactKeys(value, ['token', 'credits'])) {
    return false;
  }

  const cloud = value as Record<string, unknown>;
  return typeof cloud.token === 'string'
    && (cloud.credits === null || typeof cloud.credits === 'number');
}

function hasExactKeys(value: object, keys: string[]): boolean {
  const actualKeys = Object.keys(value).sort();
  return actualKeys.length === keys.length && actualKeys.every((key, index) => key === keys.sort()[index]);
}
