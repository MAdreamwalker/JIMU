import { beforeEach, describe, expect, it, vi } from 'vitest';

const handlers = vi.hoisted(() => new Map<string, (...args: unknown[]) => unknown>());

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler),
  },
}));

import { registerConfigHandlers } from '../../electron/ipc/registerConfigHandlers';

describe('config IPC handlers', () => {
  beforeEach(() => handlers.clear());

  it.each([
    [{ rootPath: 1, providers: [], cloud: { token: '', credits: null } }],
    [{ rootPath: '', providers: [{}], cloud: { token: '', credits: null } }],
    [{ rootPath: '', providers: [], cloud: { token: '', credits: 'none' } }],
    [{ rootPath: '', providers: [], cloud: { token: '' } }],
  ])('rejects malformed renderer config payloads', async (config) => {
    const saveConfig = vi.fn().mockResolvedValue(undefined);
    registerConfigHandlers(async () => ({ rootPath: '', providers: [], cloud: { token: '', credits: null } }), saveConfig);

    const saveHandler = handlers.get('config:save')!;

    await expect(saveHandler({}, config)).rejects.toThrow('Invalid config');
    expect(saveConfig).not.toHaveBeenCalled();
  });

  it('passes a valid config payload to persistence', async () => {
    const config = {
      rootPath: 'C:/Projects',
      providers: [{ id: 'openai', label: 'OpenAI', baseUrl: 'https://api.example.test', apiKey: 'secret', modelName: 'model' }],
      cloud: { token: 'cloud-secret', credits: 5 },
    };
    const saveConfig = vi.fn().mockResolvedValue(undefined);
    registerConfigHandlers(async () => config, saveConfig);

    await handlers.get('config:save')!({}, config);

    expect(saveConfig).toHaveBeenCalledWith(config);
  });
});
