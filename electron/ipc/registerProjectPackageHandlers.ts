import { dialog, ipcMain } from 'electron';
import { createProjectStore } from '../services/projectStore.js';
import {
  exportProjectPackage,
  importProjectPackage,
  validateExternalPackageFilePath,
} from '../services/projectPackage.js';

export function registerProjectPackageHandlers(rootPath: string): void {
  const projectStore = createProjectStore(rootPath);

  ipcMain.handle('project:export', async (_event, input: unknown) => {
    const { projectId, destinationPath } = validateExportInput(input);
    return exportProjectPackage(rootPath, projectId, destinationPath);
  });

  ipcMain.handle('project:import', async (_event, input: unknown) => {
    return importProjectPackage(rootPath, validateImportInput(input));
  });

  ipcMain.handle('project:exportWithDialog', async (_event, input: unknown) => {
    const projectId = validateExportDialogInput(input);
    const project = await projectStore.readProject(projectId);
    const result = await dialog.showSaveDialog({
      title: 'Export JIMU Project Package',
      defaultPath: `${project.name}.JIMU`,
      filters: [{ name: 'JIMU Project Package', extensions: ['JIMU'] }],
    });
    if (result.canceled || !result.filePath) return null;

    return exportProjectPackage(rootPath, projectId, result.filePath);
  });

  ipcMain.handle('project:importWithDialog', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import JIMU Project Package',
      filters: [{ name: 'JIMU Project Package', extensions: ['JIMU'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) return null;

    return importProjectPackage(rootPath, result.filePaths[0]);
  });
}

function validateExportInput(input: unknown): { projectId: string; destinationPath: string } {
  if (!hasExactKeys(input, ['projectId', 'destinationPath'])) {
    throw new Error('Invalid project export input');
  }

  const { projectId, destinationPath } = input as {
    projectId?: unknown;
    destinationPath?: unknown;
  };
  if (!isNonEmptyString(projectId)) {
    throw new Error('Invalid project export input');
  }
  try {
    validateExternalPackageFilePath(destinationPath);
  } catch {
    throw new Error('Invalid project export input');
  }

  return { projectId: projectId.trim(), destinationPath };
}

function validateImportInput(input: unknown): string {
  if (!hasExactKeys(input, ['packagePath'])) {
    throw new Error('Invalid project import input');
  }

  const { packagePath } = input as { packagePath?: unknown };
  try {
    validateExternalPackageFilePath(packagePath);
  } catch {
    throw new Error('Invalid project import input');
  }
  return packagePath;
}

function validateExportDialogInput(input: unknown): string {
  if (!hasExactKeys(input, ['projectId'])) {
    throw new Error('Invalid project export input');
  }

  const { projectId } = input as { projectId?: unknown };
  if (!isNonEmptyString(projectId)) {
    throw new Error('Invalid project export input');
  }

  return projectId.trim();
}

function hasExactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return !!value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every((key) => Object.hasOwn(value, key));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
