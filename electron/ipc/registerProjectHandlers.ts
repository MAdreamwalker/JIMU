import { ipcMain } from 'electron';
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
}
