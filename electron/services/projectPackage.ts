import fs from 'node:fs/promises';
import path from 'node:path';
import type { ProjectMetadata } from '../../src/domain/project.js';
import { assertRealPathInsideAllowedRoots } from './pathPolicy.js';
import { createProjectStore } from './projectStore.js';

export interface PackageEntry {
  path: string;
  size: number;
}

export interface PackageManifest {
  schemaVersion: 1;
  projectId: string;
  entries: PackageEntry[];
}

interface ProjectPackageFile {
  schemaVersion: 1;
  manifest: PackageManifest;
  files: Record<string, string>;
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

export async function exportProjectPackage(rootPath: string, projectId: string, destinationPath: string): Promise<string> {
  if (!isNonEmptyString(projectId)) throw new Error('Invalid project id');
  validateExternalPackageFilePath(destinationPath);

  const projectStore = createProjectStore(rootPath);
  const project = await projectStore.readProject(projectId);
  const projectDir = await projectStore.getProjectDirectory(projectId);
  const folderName = path.basename(projectDir);
  const packageFiles = await collectProjectPackageFiles(projectDir, folderName);
  const entries: PackageEntry[] = [
    { path: 'manifest.json', size: 0 },
    ...[...packageFiles.entries()].map(([entryPath, bytes]) => ({
      path: entryPath,
      size: bytes.byteLength,
    })),
  ].sort((first, second) => first.path.localeCompare(second.path));
  const manifest: PackageManifest = {
    schemaVersion: 1,
    projectId: project.id,
    entries,
  };
  validatePackageManifest(manifest);

  const packageJson: ProjectPackageFile = {
    schemaVersion: 1,
    manifest,
    files: Object.fromEntries([...packageFiles.entries()].map(([entryPath, bytes]) => [
      entryPath,
      Buffer.from(bytes).toString('base64'),
    ])),
  };

  await fs.writeFile(destinationPath, JSON.stringify(packageJson, null, 2), 'utf8');
  return destinationPath;
}

export async function importProjectPackage(rootPath: string, packagePath: string): Promise<ProjectMetadata> {
  validateExternalPackageFilePath(packagePath);
  const packageJson = parseProjectPackage(await fs.readFile(packagePath, 'utf8'));
  const { folderName, files, project } = unpackProjectPackage(packageJson);
  const projectStore = createProjectStore(rootPath);
  return projectStore.importProject({ folderName, project, files });
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

async function collectProjectPackageFiles(projectDir: string, folderName: string): Promise<Map<string, Uint8Array>> {
  const files = new Map<string, Uint8Array>();
  await walkProjectDirectory(projectDir, projectDir, folderName, files);
  return files;
}

async function walkProjectDirectory(
  projectDir: string,
  currentDir: string,
  folderName: string,
  files: Map<string, Uint8Array>,
): Promise<void> {
  const items = await fs.readdir(currentDir, { withFileTypes: true });
  for (const item of items) {
    const itemPath = path.join(currentDir, item.name);
    if (item.isSymbolicLink()) {
      throw new Error('Project package cannot include symlinks');
    }
    if (item.isDirectory()) {
      await assertRealPathInsideAllowedRoots(itemPath, [projectDir]);
      await walkProjectDirectory(projectDir, itemPath, folderName, files);
      continue;
    }
    if (!item.isFile()) continue;

    const realFilePath = await assertRealPathInsideAllowedRoots(itemPath, [projectDir]);
    const relativePath = path.relative(projectDir, realFilePath).split(path.sep).join('/');
    const entryPath = `${folderName}/${relativePath}`;
    const bytes = await fs.readFile(realFilePath);
    files.set(entryPath, bytes);
  }
}

function parseProjectPackage(raw: string): ProjectPackageFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid project package');
  }

  if (!hasExactKeys(parsed, ['schemaVersion', 'manifest', 'files'])) {
    throw new Error('Invalid project package');
  }
  const candidate = parsed as {
    schemaVersion?: unknown;
    manifest?: unknown;
    files?: unknown;
  };
  if (candidate.schemaVersion !== 1 || !candidate.files || typeof candidate.files !== 'object' || Array.isArray(candidate.files)) {
    throw new Error('Invalid project package');
  }
  validatePackageManifest(candidate.manifest);
  return {
    schemaVersion: 1,
    manifest: candidate.manifest,
    files: candidate.files as Record<string, string>,
  };
}

function unpackProjectPackage(packageJson: ProjectPackageFile): {
  folderName: string;
  files: Map<string, Uint8Array>;
  project: ProjectMetadata;
} {
  const entryPaths = packageJson.manifest.entries.map((entry) => entry.path);
  const projectEntries = entryPaths.filter((entryPath) => entryPath !== 'manifest.json');
  const folderName = readPackageFolderName(projectEntries);
  const files = new Map<string, Uint8Array>();

  for (const entry of packageJson.manifest.entries) {
    if (entry.path === 'manifest.json') {
      if (entry.size !== 0) throw new Error('Invalid project package manifest entry');
      continue;
    }
    const encoded = packageJson.files[entry.path];
    if (typeof encoded !== 'string' || !isValidBase64(encoded)) {
      throw new Error('Invalid project package file');
    }

    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.byteLength !== entry.size) {
      throw new Error('Project package file size mismatch');
    }
    files.set(stripPackageFolder(entry.path, folderName), bytes);
  }

  const extraFiles = Object.keys(packageJson.files).filter((entryPath) => !projectEntries.includes(entryPath));
  if (extraFiles.length > 0) {
    throw new Error('Project package contains undeclared files');
  }

  const projectFile = files.get('project.json');
  if (!projectFile) throw new Error('Package manifest is missing project.json');
  const project = parseProjectMetadata(projectFile);
  if (project.id !== packageJson.manifest.projectId) {
    throw new Error('Project package id mismatch');
  }
  if (project.name !== folderName) {
    throw new Error('Project package folder does not match project name');
  }

  return { folderName, files, project };
}

function readPackageFolderName(entryPaths: string[]): string {
  const folders = new Set(entryPaths.map((entryPath) => entryPath.split('/')[0]));
  if (folders.size !== 1) throw new Error('Project package must contain one project folder');
  const [folderName] = [...folders];
  if (!folderName || folderName === '.' || folderName === '..' || /[<>:"/\\|?*\u0000-\u001f]/.test(folderName) || /[. ]$/.test(folderName)) {
    throw new Error('Invalid project name');
  }
  return folderName;
}

function stripPackageFolder(entryPath: string, folderName: string): string {
  const prefix = `${folderName}/`;
  if (!entryPath.startsWith(prefix) || entryPath.length === prefix.length) {
    throw new Error('Invalid project package entry');
  }
  return entryPath.slice(prefix.length);
}

function parseProjectMetadata(bytes: Uint8Array): ProjectMetadata {
  try {
    return JSON.parse(Buffer.from(bytes).toString('utf8')) as ProjectMetadata;
  } catch {
    throw new Error('Invalid imported project metadata');
  }
}

function isValidBase64(value: string): boolean {
  if (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return false;
  return Buffer.from(value, 'base64').toString('base64') === value;
}
