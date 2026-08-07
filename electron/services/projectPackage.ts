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
const maxPackageEntries = 10_000;
const blockedSegments = new Set(['', '.', '..']);

export function validatePackageEntry(entry: PackageEntry): void {
  if (!entry || typeof entry.path !== 'string' || typeof entry.size !== 'number') {
    throw new Error('Invalid package entry');
  }

  const normalized = entry.path;
  const segments = normalized.split('/');
  if (
    normalized !== normalized.trim()
    || normalized.includes('\0')
    || normalized.includes('\\')
    || segments.some((segment) => blockedSegments.has(segment) || /[ .]$/.test(segment))
    || path.posix.isAbsolute(normalized)
    || path.win32.isAbsolute(normalized)
    || /^[a-z][a-z0-9+.-]*:/i.test(normalized)
  ) {
    throw new Error('Package entry path is unsafe');
  }

  if (!Number.isInteger(entry.size) || entry.size < 0 || entry.size > maxEntrySize) {
    throw new Error('Package entry is too large');
  }
}

export function validatePackageEntries(entries: PackageEntry[]): void {
  if (!Array.isArray(entries)) throw new Error('Invalid package entries');
  if (entries.length > maxPackageEntries) throw new Error('Package has too many entries');

  const totalSize = entries.reduce((sum, entry) => {
    if (!entry || typeof entry.size !== 'number' || !Number.isFinite(entry.size) || entry.size < 0) {
      throw new Error('Invalid package entry');
    }
    return sum + entry.size;
  }, 0);
  if (totalSize > maxPackageSize) throw new Error('Package is too large');

  const paths = new Set<string>();
  for (const entry of entries) {
    validatePackageEntry(entry);
    const canonicalPath = entry.path.toLowerCase();
    if (paths.has(canonicalPath)) throw new Error('Package contains duplicate entry paths');
    paths.add(canonicalPath);
  }
}

export function validatePackageManifest(manifest: unknown): asserts manifest is PackageManifest {
  if (!hasExactKeys(manifest, ['schemaVersion', 'projectId', 'entries']) || !Array.isArray(manifest.entries)) {
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
  validateExternalPackageFilePath(destinationPath);

  return destinationPath;
}

export async function importProjectPackage(packagePath: string): Promise<ProjectMetadata> {
  validateExternalPackageFilePath(packagePath);
  throw new Error('Project package import is not implemented');
}

export function validateExternalPackageFilePath(value: unknown): asserts value is string {
  if (!isSafeExternalPackageFilePath(value)) throw new Error('Invalid package file path');
}

function isSafeExternalPackageFilePath(value: unknown): value is string {
  if (!isNonEmptyString(value) || value !== value.trim() || value.includes('\0')) return false;
  if (/[\\/]$/.test(value)) return false;

  const normalized = value.replace(/\\/g, '/');
  const isAbsolute = path.posix.isAbsolute(value) || path.win32.isAbsolute(value);
  const isDriveRelative = /^[a-z]:/i.test(value) && !path.win32.isAbsolute(value);
  if (
    isDriveRelative
    || (!isAbsolute && /^[a-z][a-z0-9+.-]*:/i.test(value))
    || normalized.split('/').some((segment) => {
      if (!segment) return false;
      return segment === '.' || segment === '..' || /[ .]$/.test(segment);
    })
  ) {
    return false;
  }

  return path.posix.extname(normalized).toLowerCase() === '.jimu';
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
