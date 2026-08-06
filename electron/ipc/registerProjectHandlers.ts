import { ipcMain } from 'electron';
import type { CanvasDocument } from '../../src/domain/canvas.js';
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
}

function validateCanvasSaveInput(input: unknown): { projectId: unknown; canvas: unknown } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid canvas save input');
  }

  const { projectId, canvas } = input as { projectId?: unknown; canvas?: unknown };
  return { projectId, canvas };
}
