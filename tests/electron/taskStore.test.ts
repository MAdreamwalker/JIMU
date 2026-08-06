import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { appendTask } from '../../electron/services/taskStore';

describe('task store', () => {
  it('redacts named JSON secrets and bearer tokens before writing task records', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-task-root-'));
    const dir = path.join(root, 'project');
    await fs.mkdir(dir);
    const task = await appendTask(dir, {
      id: 'task_123',
      category: 'text',
      status: 'failed',
      providerId: 'mock',
      inputSummary: '{"apiKey":"provider-secret"}',
      outputSummary: '{"token":"provider-secret"} Bearer token-secret',
      errorCategory: 'authentication',
      createdAt: '2026-08-06T00:00:00.000Z',
      updatedAt: '2026-08-06T00:00:00.000Z',
    });

    expect(task.inputSummary).not.toContain('provider-secret');
    expect(task.outputSummary).not.toContain('provider-secret');
    expect(task.outputSummary).not.toContain('token-secret');
    await expect(fs.readFile(path.join(dir, 'tasks.json'), 'utf8')).resolves.not.toContain('secret');
  });

  it('rejects a tasks file symlink that resolves outside the project directory', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-task-root-'));
    const dir = path.join(root, 'project');
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-task-outside-'));
    await fs.mkdir(dir);
    await fs.writeFile(path.join(outside, 'tasks.json'), JSON.stringify({ tasks: [] }), 'utf8');

    try {
      await fs.symlink(path.join(outside, 'tasks.json'), path.join(dir, 'tasks.json'), 'file');
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'EPERM' || code === 'EACCES') {
        return;
      }
      throw error;
    }

    await expect(appendTask(dir, createTask())).rejects.toThrow('Path resolves outside authorized roots');
  });

  it('allows callers to provide a separate authorized root', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-task-root-'));
    const dir = path.join(root, 'project');
    await fs.mkdir(dir);

    await expect(appendTask(dir, createTask(), root)).resolves.toMatchObject({ id: 'task_123' });
  });
});

function createTask() {
  return {
    id: 'task_123',
    category: 'text' as const,
    status: 'failed' as const,
    providerId: 'mock',
    inputSummary: 'input',
    outputSummary: 'output',
    createdAt: '2026-08-06T00:00:00.000Z',
    updatedAt: '2026-08-06T00:00:00.000Z',
  };
}
