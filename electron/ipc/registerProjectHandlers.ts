import { ipcMain } from 'electron';
import type { ProjectAspectRatio } from '../../src/domain/project.js';
import { createProjectStore } from '../services/projectStore.js';

export function registerProjectHandlers(rootPath: string): void {
  const store = createProjectStore(rootPath);

  ipcMain.handle(
    'registry:create',
    (_event, input: { name: string; aspectRatio: ProjectAspectRatio }) => {
      if (!input.name.trim()) {
        throw new Error('Project name is required');
      }

      return store.createProject(input);
    },
  );

  ipcMain.handle('registry:get', (_event, projectId: string) => store.readProject(projectId));
}
