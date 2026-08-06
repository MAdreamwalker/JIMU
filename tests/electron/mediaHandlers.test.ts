import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProjectStore } from '../../electron/services/projectStore';

const handlers = vi.hoisted(() => new Map<string, (...args: unknown[]) => unknown>());
const analyzeMedia = vi.hoisted(() => vi.fn());

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler),
  },
}));

vi.mock('../../electron/services/mediaAnalysis', () => ({ analyzeMedia }));

import { registerMediaHandlers } from '../../electron/ipc/registerMediaHandlers';

describe('media IPC handlers', () => {
  beforeEach(() => {
    handlers.clear();
    analyzeMedia.mockReset().mockResolvedValue({ durationSeconds: 1, width: null, height: null, frameRate: null, hasAudio: false });
  });

  it('analyzes only a project-relative media file', async () => {
    const { rootPath, projectId, mediaPath, absoluteMediaPath } = await createProjectMedia();
    registerMediaHandlers(rootPath);

    await handlers.get('media:analyze')!({}, { projectId, mediaPath });

    expect(analyzeMedia).toHaveBeenCalledWith(absoluteMediaPath);
  });

  it.each([
    'C:/outside.mp4',
    '../outside.mp4',
    'media/../outside.mp4',
    'media\\videos\\clip.mp4',
    'https://example.test/clip.mp4',
    'data:video/mp4;base64,abc',
  ])('rejects unsafe renderer media path %s', async (mediaPath) => {
    const { rootPath, projectId } = await createProjectMedia();
    registerMediaHandlers(rootPath);

    await expect(handlers.get('media:analyze')!({}, { projectId, mediaPath })).rejects.toThrow('Invalid media path');
    expect(analyzeMedia).not.toHaveBeenCalled();
  });
});

async function createProjectMedia() {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-media-handler-'));
  const projectStore = createProjectStore(rootPath);
  const project = await projectStore.createProject({ name: 'Media Project', aspectRatio: '16:9' });
  const mediaPath = 'media/videos/clip.mp4';
  const absoluteMediaPath = path.join(await projectStore.getProjectDirectory(project.id), ...mediaPath.split('/'));
  await fs.writeFile(absoluteMediaPath, 'placeholder', 'utf8');

  return { rootPath, projectId: project.id, mediaPath, absoluteMediaPath };
}
