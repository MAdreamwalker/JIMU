import path from 'node:path';
import { ipcMain } from 'electron';
import { analyzeMedia } from '../services/mediaAnalysis.js';
import { assertRealPathInsideAllowedRoots } from '../services/pathPolicy.js';
import { createProjectStore } from '../services/projectStore.js';

export function registerMediaHandlers(rootPath: string): void {
  const projectStore = createProjectStore(rootPath);

  ipcMain.handle('media:analyze', async (_event, input: unknown) => {
    const { projectId, mediaPath } = validateMediaAnalyzeInput(input);
    const projectDirectory = await projectStore.getProjectDirectory(projectId);
    const filePath = await assertRealPathInsideAllowedRoots(
      path.join(projectDirectory, ...mediaPath.split('/')),
      [projectDirectory],
    );

    return analyzeMedia(filePath);
  });
}

function validateMediaAnalyzeInput(input: unknown): { projectId: string; mediaPath: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid media analyze input');
  }

  const { projectId, mediaPath } = input as { projectId?: unknown; mediaPath?: unknown };
  if (!isNonEmptyString(projectId)) throw new Error('Invalid project id');
  if (!isSafeProjectRelativeMediaPath(mediaPath)) throw new Error('Invalid media path');

  return { projectId, mediaPath };
}

function isSafeProjectRelativeMediaPath(value: unknown): value is string {
  return isNonEmptyString(value)
    && value === value.trim()
    && value.startsWith('media/')
    && !value.includes('\\')
    && !path.posix.isAbsolute(value)
    && !path.win32.isAbsolute(value)
    && !/^[a-z][a-z0-9+.-]*:/i.test(value)
    && value.split('/').every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
