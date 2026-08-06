import { ipcMain } from 'electron';
import type { TaskRecord } from '../../src/domain/tasks.js';
import { createProjectStore } from '../services/projectStore.js';
import { listTasks, updateTaskStatus } from '../services/taskStore.js';

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

  ipcMain.handle('tasks:retry', async (_event, input: unknown): Promise<TaskListItem | null> => {
    const { projectId, taskId } = validateTaskActionInput(input);
    return updateProjectTask(projectId, taskId, 'queued');
  });

  ipcMain.handle('tasks:cancel', async (_event, input: unknown): Promise<TaskListItem | null> => {
    const { projectId, taskId } = validateTaskActionInput(input);
    return updateProjectTask(projectId, taskId, 'cancelled');
  });

  async function updateProjectTask(
    projectId: string,
    taskId: string,
    status: TaskRecord['status'],
  ): Promise<TaskListItem | null> {
    const project = await projectStore.readProject(projectId);
    const projectDirectory = await projectStore.getProjectDirectory(projectId);
    const task = await updateTaskStatus(projectDirectory, taskId, status, rootPath);
    return task ? { ...task, projectId: project.id, projectName: project.name } : null;
  }
}

function validateTaskActionInput(input: unknown): { projectId: string; taskId: string } {
  if (!hasExactKeys(input, ['projectId', 'taskId'])
    || !isNonEmptyString(input.projectId)
    || !isNonEmptyString(input.taskId)) {
    throw new Error('Invalid task action input');
  }

  return { projectId: input.projectId, taskId: input.taskId };
}

function hasExactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
