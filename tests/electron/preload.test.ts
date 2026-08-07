import { describe, expect, it, vi } from 'vitest';

const exposed = vi.hoisted(() => ({ api: null as any }));
const ipcRenderer = vi.hoisted(() => ({
  invoke: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
}));

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (_name: string, api: unknown) => {
      exposed.api = api;
    },
  },
  ipcRenderer,
}));

await import('../../electron/preload');

describe('preload timeline bridge', () => {
  it('subscribes to export progress and removes the same listener on unsubscribe', () => {
    const callback = vi.fn();

    const unsubscribe = exposed.api.timeline.onExportProgress(callback);
    const listener = ipcRenderer.on.mock.calls[0][1];

    listener({}, { jobId: 'export_1', status: 'queued', progress: 0 });
    unsubscribe();

    expect(callback).toHaveBeenCalledWith({ jobId: 'export_1', status: 'queued', progress: 0 });
    expect(ipcRenderer.removeListener).toHaveBeenCalledWith('timeline:exportProgress', listener);
  });
});
