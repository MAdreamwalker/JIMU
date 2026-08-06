import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { appendTask } from '../../electron/services/taskStore';

describe('task store', () => {
  it('redacts api keys and bearer tokens before writing task records', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-task-'));
    const task = await appendTask(dir, {
      id: 'task_123',
      category: 'text',
      status: 'failed',
      providerId: 'mock',
      inputSummary: 'apiKey=sk-secret',
      outputSummary: 'Bearer token-secret',
      errorCategory: 'authentication',
      createdAt: '2026-08-06T00:00:00.000Z',
      updatedAt: '2026-08-06T00:00:00.000Z',
    });

    expect(task.inputSummary).not.toContain('sk-secret');
    expect(task.outputSummary).not.toContain('token-secret');
    await expect(fs.readFile(path.join(dir, 'tasks.json'), 'utf8')).resolves.not.toContain('secret');
  });
});
