import fs from 'node:fs/promises';
import { ipcMain } from 'electron';
import type { CanvasDocument } from '../../src/domain/canvas.js';
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
    const canvasPath = await store.getProjectFilePath(validateProjectId(projectId), 'canvas.json');
    return JSON.parse(await fs.readFile(canvasPath, 'utf8')) as CanvasDocument;
  });

  ipcMain.handle('canvas:save', async (_event, input: unknown): Promise<void> => {
    const { projectId, canvas } = validateCanvasSaveInput(input);
    const canvasPath = await store.getProjectFilePath(projectId, 'canvas.json');
    await fs.writeFile(canvasPath, JSON.stringify(canvas, null, 2), 'utf8');
  });
}

function validateProjectId(projectId: unknown): string {
  if (typeof projectId !== 'string' || !projectId.trim()) {
    throw new Error('Invalid project id');
  }

  return projectId;
}

function validateCanvasSaveInput(input: unknown): { projectId: string; canvas: CanvasDocument } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid canvas save input');
  }

  const { projectId, canvas } = input as { projectId?: unknown; canvas?: unknown };
  if (!canvas || typeof canvas !== 'object' || Array.isArray(canvas)) {
    throw new Error('Invalid canvas document');
  }

  return { projectId: validateProjectId(projectId), canvas: canvas as CanvasDocument };
}
