import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProjectStore } from '../../electron/services/projectStore';

const handlers = vi.hoisted(() => new Map<string, (...args: any[]) => unknown>());

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: any[]) => unknown) => handlers.set(channel, handler),
  },
}));

describe('pipeline IPC handlers', () => {
  beforeEach(() => {
    handlers.clear();
  });

  it('validates pipeline documents before persisting renderer input', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jimu-pipeline-root-'));
    const store = createProjectStore(root);
    const project = await store.createProject({ name: 'Pipeline Demo', aspectRatio: '16:9' });
    const { registerPipelineHandlers } = await import('../../electron/ipc/registerPipelineHandlers');
    registerPipelineHandlers(root);

    await expect(handlers.get('pipeline:save')!({}, project.id, {
      stages: {
        source: { status: 'queued', inputSummary: 'chapter one' },
      },
    })).resolves.toBeUndefined();
    await expect(handlers.get('pipeline:load')!({}, project.id)).resolves.toEqual({
      stages: {
        source: { status: 'queued', inputSummary: 'chapter one' },
      },
    });

    await expect(handlers.get('pipeline:save')!({}, project.id, {
      stages: {
        source: { status: 'bogus' },
      },
    })).rejects.toThrow('Invalid pipeline document');
    await expect(handlers.get('pipeline:save')!({}, project.id, {
      stages: {
        unexpected: { status: 'queued' },
      },
    })).rejects.toThrow('Invalid pipeline document');
  });

  it('rejects corrupt persisted pipeline documents on load', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jimu-pipeline-root-'));
    const store = createProjectStore(root);
    const project = await store.createProject({ name: 'Corrupt Pipeline', aspectRatio: '16:9' });
    await fs.writeFile(await store.getProjectFilePath(project.id, 'pipeline.json'), '{"stages":{"source":{"status":"bad"}}}', 'utf8');
    const { registerPipelineHandlers } = await import('../../electron/ipc/registerPipelineHandlers');
    registerPipelineHandlers(root);

    await expect(handlers.get('pipeline:load')!({}, project.id)).rejects.toThrow('Invalid pipeline document');
  });
});
