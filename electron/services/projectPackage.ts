import path from 'node:path';
import type { ProjectMetadata } from '../../src/domain/project.js';

export interface PackageEntry {
  path: string;
  size: number;
}

export interface PackageManifest {
  schemaVersion: 1;
  projectId: string;
  entries: PackageEntry[];
}

const maxEntrySize = 500 * 1024 * 1024;
const maxPackageSize = 500 * 1024 * 1024;
const blockedSegments = new Set(['', '.', '..']);

export function validatePackageEntry(entry: PackageEntry): void {
  if (!entry || typeof entry.path !== 'string' || typeof entry.size !== 'number') {
    throw new Error('Invalid package entry');
  }

  const normalized = entry.path.replace(/\\/g, '/');
  const segments = normalized.split('/');
  if (
    normalized.includes('\0')
    || segments.some((segment) => blockedSegments.has(segment))
    || path.posix.isAbsolute(normalized)
    || path.win32.isAbsolute(normalized)
    || /^[a-z]:/i.test(normalized)
  ) {
    throw new Error('Package entry path is unsafe');
  }

  if (!Number.isInteger(entry.size) || entry.size < 0 || entry.size > maxEntrySize) {
    throw new Error('Package entry is too large');
  }
}

export function validatePackageEntries(entries: PackageEntry[]): void {
  if (!Array.isArray(entries)) throw new Error('Invalid package entries');

  const totalSize = entries.reduce((sum, entry) => {
    if (!entry || typeof entry.size !== 'number' || !Number.isFinite(entry.size) || entry.size < 0) {
      throw new Error('Invalid package entry');
    }
    return sum + entry.size;
  }, 0);
  if (totalSize > maxPackageSize) throw new Error('Package is too large');

  for (const entry of entries) {
    validatePackageEntry(entry);
  }
}

export function validatePackageManifest(manifest: unknown): asserts manifest is PackageManifest {
  if (!manifest || typeof manifest !== 'object' || !('entries' in manifest) || !Array.isArray(manifest.entries)) {
    throw new Error('Invalid package manifest');
  }

  const candidate = manifest as Partial<PackageManifest> & { entries: PackageEntry[] };
  if (candidate.schemaVersion !== 1 || typeof candidate.projectId !== 'string' || !candidate.projectId.trim()) {
    throw new Error('Invalid package manifest');
  }

  validatePackageEntries(candidate.entries);
  if (!candidate.entries.some((entry) => entry.path === 'manifest.json')) {
    throw new Error('Package manifest is missing manifest.json');
  }
  if (!candidate.entries.some((entry) => path.posix.basename(entry.path) === 'project.json')) {
    throw new Error('Package manifest is missing project.json');
  }
}

export async function exportProjectPackage(projectId: string, destinationPath: string): Promise<string> {
  if (!isNonEmptyString(projectId)) throw new Error('Invalid project id');
  if (!isNonEmptyString(destinationPath)) throw new Error('Invalid package destination path');

  return destinationPath;
}

export async function importProjectPackage(_packagePath: string): Promise<ProjectMetadata> {
  throw new Error('Project package import is not implemented');
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
