import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProjectStore } from '../../electron/services/projectStore';
import { appendTask } from '../../electron/services/taskStore';

const handlers = vi.hoisted(() => new Map<string, (...args: any[]) => unknown>());

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: any[]) => unknown) => handlers.set(channel, handler),
  },
}));

describe('task IPC handlers', () => {
  beforeEach(() => {
    handlers.clear();
  });

  it('lists tasks across registered projects newest first', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jimu-task-handler-root-'));
    const store = createProjectStore(root);
    const first = await store.createProject({ name: 'First Project', aspectRatio: '16:9' });
    const second = await store.createProject({ name: 'Second Project', aspectRatio: '9:16' });
    await appendTask(await store.getProjectDirectory(first.id), createTask('task_old', '2026-08-06T00:00:00.000Z'), root);
    await appendTask(await store.getProjectDirectory(second.id), createTask('task_new', '2026-08-06T01:00:00.000Z'), root);
    await appendTask(await store.getProjectDirectory(second.id), {
      ...createTask('task_done', '2026-08-06T02:00:00.000Z'),
      status: 'succeeded',
    }, root);
    const { registerTaskHandlers } = await import('../../electron/ipc/registerTaskHandlers');
    registerTaskHandlers(root);

    await expect(handlers.get('tasks:list')!({})).resolves.toMatchObject([
      { id: 'task_done', projectId: second.id, projectName: 'Second Project' },
      { id: 'task_new', projectId: second.id, projectName: 'Second Project' },
      { id: 'task_old', projectId: first.id, projectName: 'First Project' },
    ]);

    await expect(handlers.get('tasks:retry')!({}, { projectId: second.id, taskId: 'task_new' }))
      .resolves.toMatchObject({ id: 'task_new', status: 'queued', projectId: second.id });
    await expect(handlers.get('tasks:cancel')!({}, { projectId: second.id, taskId: 'task_new' }))
      .resolves.toMatchObject({ id: 'task_new', status: 'cancelled', projectId: second.id });
    await expect(handlers.get('tasks:retry')!({}, { projectId: second.id, taskId: '' }))
      .rejects.toThrow('Invalid task action input');
    await expect(handlers.get('tasks:cancel')!({}, { projectId: second.id, taskId: 'task_done' }))
      .rejects.toThrow('Invalid task state transition');
    await expect(handlers.get('tasks:retry')!({}, { projectId: second.id, taskId: 'task_done' }))
      .rejects.toThrow('Invalid task state transition');
  });
});

function createTask(id: string, updatedAt: string) {
  return {
    id,
    category: 'pipeline' as const,
    status: 'failed' as const,
    providerId: 'mock',
    inputSummary: 'input',
    outputSummary: 'output',
    errorCategory: 'provider',
    createdAt: '2026-08-06T00:00:00.000Z',
    updatedAt,
  };
}
