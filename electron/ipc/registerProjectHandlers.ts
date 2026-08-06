import { ipcMain } from 'electron';
import fs from 'node:fs/promises';
import type { CanvasDocument } from '../../src/domain/canvas.js';
import type { DirectorDocument } from '../../src/domain/director.js';
import { createCanvasStore } from '../services/canvasStore.js';
import { createProjectStore } from '../services/projectStore.js';
import { validateCreateProjectInput } from './projectInput.js';

export function registerProjectHandlers(rootPath: string): void {
  const store = createProjectStore(rootPath);

  ipcMain.handle(
    'registry:create',
    (_event, input: unknown) => {
      const projectInput = validateCreateProjectInput(input);
      if (!projectInput.name.trim()) {
        throw new Error('Project name is required');
      }

      return store.createProject(projectInput);
    },
  );

  ipcMain.handle('registry:list', () => store.listProjects());
  ipcMain.handle('registry:get', (_event, projectId: string) => store.readProject(projectId));

  ipcMain.handle('canvas:load', async (_event, projectId: string): Promise<CanvasDocument> => {
    return createCanvasStore(store, projectId).load();
  });

  ipcMain.handle('canvas:save', async (_event, input: unknown): Promise<void> => {
    const { projectId, canvas } = validateCanvasSaveInput(input);
    await createCanvasStore(store, projectId).save(canvas);
  });

  ipcMain.handle('director:load', async (_event, projectId: string): Promise<DirectorDocument> => {
    const directorPath = await store.getProjectFilePath(projectId, 'director.json');
    return JSON.parse(await fs.readFile(directorPath, 'utf8')) as DirectorDocument;
  });

  ipcMain.handle('director:save', async (_event, input: unknown): Promise<void> => {
    const { projectId, director } = validateDirectorSaveInput(input);
    const directorPath = await store.getProjectFilePath(projectId, 'director.json');
    await fs.writeFile(directorPath, JSON.stringify(director, null, 2), 'utf8');
  });
}

function validateCanvasSaveInput(input: unknown): { projectId: unknown; canvas: unknown } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid canvas save input');
  }

  const { projectId, canvas } = input as { projectId?: unknown; canvas?: unknown };
  return { projectId, canvas };
}

function validateDirectorSaveInput(input: unknown): { projectId: string; director: DirectorDocument } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid director save input');
  }

  const { projectId, director } = input as { projectId?: unknown; director?: unknown };
  if (typeof projectId !== 'string' || !director || typeof director !== 'object' || Array.isArray(director)) {
    throw new Error('Invalid director save input');
  }

  return { projectId, director: director as DirectorDocument };
}
