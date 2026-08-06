import { ipcMain } from 'electron';
import {
  exportProjectPackage,
  importProjectPackage,
} from '../services/projectPackage.js';

export function registerProjectPackageHandlers(): void {
  ipcMain.handle('project:export', async (_event, input: unknown) => {
    const { projectId, destinationPath } = validateExportInput(input);
    return exportProjectPackage(projectId, destinationPath);
  });

  ipcMain.handle('project:import', async (_event, input: unknown) => {
    return importProjectPackage(validateImportInput(input));
  });
}

function validateExportInput(input: unknown): { projectId: string; destinationPath: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid project export input');
  }

  const { projectId, destinationPath } = input as {
    projectId?: unknown;
    destinationPath?: unknown;
  };
  if (!isNonEmptyString(projectId) || !isNonEmptyString(destinationPath)) {
    throw new Error('Invalid project export input');
  }

  return { projectId, destinationPath };
}

function validateImportInput(input: unknown): string {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid project import input');
  }

  const { packagePath } = input as { packagePath?: unknown };
  if (!isNonEmptyString(packagePath)) throw new Error('Invalid project import input');
  return packagePath;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
