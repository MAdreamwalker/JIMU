import { ipcMain } from 'electron';
import {
  exportProjectPackage,
  importProjectPackage,
  validatePackageFilePath,
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
    validatePackageFilePath(destinationPath);
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
    validatePackageFilePath(packagePath);
  } catch {
    throw new Error('Invalid project import input');
  }
  return packagePath;
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
