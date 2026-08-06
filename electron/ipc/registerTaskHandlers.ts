import { ipcMain } from 'electron';
import type { TaskRecord } from '../../src/domain/tasks.js';
import { createProjectStore } from '../services/projectStore.js';
import { listTasks } from '../services/taskStore.js';

export interface TaskListItem extends TaskRecord {
  projectId: string;
  projectName: string;
}

export function registerTaskHandlers(rootPath: string): void {
  const projectStore = createProjectStore(rootPath);

  ipcMain.handle('tasks:list', async (): Promise<TaskListItem[]> => {
    const projects = await projectStore.listProjects();
    const items = await Promise.all(projects.map(async (project) => {
      const projectDirectory = await projectStore.getProjectDirectory(project.id);
      const tasks = await listTasks(projectDirectory, rootPath);
      return tasks.map((task) => ({
        ...task,
        projectId: project.id,
        projectName: project.name,
      }));
    }));

    return items.flat().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  });
}
