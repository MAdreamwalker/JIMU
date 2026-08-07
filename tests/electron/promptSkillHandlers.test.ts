import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const handlers = vi.hoisted(() => new Map<string, (...args: unknown[]) => unknown>());

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler),
  },
}));

import { registerPromptSkillHandlers } from '../../electron/ipc/registerPromptSkillHandlers';

describe('prompt and skill IPC handlers', () => {
  beforeEach(() => handlers.clear());

  it('rejects malformed persisted storyboard prompts', async () => {
    const paths = await createHandlerPaths();
    await fs.writeFile(paths.storyboardPromptsPath, JSON.stringify({ 'chapter-split': 1 }), 'utf8');
    registerPromptSkillHandlers(paths);

    await expect(handlers.get('storyboardPrompts:read')!({})).rejects.toThrow('Invalid storyboard prompts');
  });

  it('labels corrupt storyboard prompt JSON clearly', async () => {
    const paths = await createHandlerPaths();
    await fs.writeFile(paths.storyboardPromptsPath, '{', 'utf8');
    registerPromptSkillHandlers(paths);

    await expect(handlers.get('storyboardPrompts:read')!({})).rejects.toThrow('Unable to read storyboard prompts');
  });

  it('rejects malformed persisted skills', async () => {
    const paths = await createHandlerPaths();
    await fs.writeFile(paths.skillsPath, JSON.stringify([{ id: 'storyboard' }]), 'utf8');
    registerPromptSkillHandlers(paths);

    await expect(handlers.get('skills:list')!({})).rejects.toThrow('Invalid skills');
  });
});

async function createHandlerPaths() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jimu-prompt-skills-'));
  return {
    storyboardPromptsPath: path.join(root, 'storyboard-prompts.json'),
    skillsPath: path.join(root, 'skills.json'),
  };
}
