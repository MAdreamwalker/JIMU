import fs from 'node:fs/promises';
import path from 'node:path';
import type { CryptoStore } from './cryptoStore.js';

export interface AppConfig {
  rootPath: string;
  providers: Array<{ id: string; label: string; baseUrl: string; apiKey: string; modelName: string }>;
  cloud: { token: string; credits: number | null };
}

interface StoredAppConfig extends Omit<AppConfig, 'providers' | 'cloud'> {
  providers: Array<Omit<AppConfig['providers'][number], 'apiKey'> & { apiKey: string }>;
  cloud: { token: string; credits: number | null };
}

export const defaultConfig: AppConfig = {
  rootPath: '',
  providers: [],
  cloud: { token: '', credits: null },
};

export interface ConfigStore {
  load(): Promise<AppConfig>;
  save(config: AppConfig): Promise<void>;
}

export function createConfigStore(configPath: string, cryptoStore: CryptoStore): ConfigStore {
  async function readStoredConfig(): Promise<StoredAppConfig | null> {
    try {
      return JSON.parse(await fs.readFile(configPath, 'utf8')) as StoredAppConfig;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  return {
    async load() {
      const stored = await readStoredConfig();
      if (!stored) {
        return structuredClone(defaultConfig);
      }

      return {
        ...stored,
        providers: stored.providers.map((provider) => ({
          ...provider,
          apiKey: provider.apiKey ? cryptoStore.decrypt(provider.apiKey) : '',
        })),
        cloud: {
          ...stored.cloud,
          token: stored.cloud.token ? cryptoStore.decrypt(stored.cloud.token) : '',
        },
      };
    },
    async save(config) {
      const stored: StoredAppConfig = {
        ...config,
        providers: config.providers.map((provider) => ({
          ...provider,
          apiKey: provider.apiKey ? cryptoStore.encrypt(provider.apiKey) : '',
        })),
        cloud: {
          ...config.cloud,
          token: config.cloud.token ? cryptoStore.encrypt(config.cloud.token) : '',
        },
      };

      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(stored, null, 2), 'utf8');
    },
  };
}
