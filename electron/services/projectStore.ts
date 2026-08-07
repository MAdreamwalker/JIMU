import fs from 'node:fs/promises';
import path from 'node:path';
import { createEmptyProject, type ProjectAspectRatio, type ProjectMetadata } from '../../src/domain/project.js';
import { assertRealPathInsideAllowedRoots } from './pathPolicy.js';

interface ProjectIndexEntry {
  id: string;
  folder: string;
}

export interface ProjectStore {
  createProject(input: { name: string; aspectRatio: ProjectAspectRatio }): Promise<ProjectMetadata>;
  importProject(input: {
    folderName: string;
    project: ProjectMetadata;
    files: Map<string, Uint8Array>;
  }): Promise<ProjectMetadata>;
  /** Rejects when a registry entry references a missing or corrupt project file. */
  listProjects(): Promise<ProjectMetadata[]>;
  readProject(projectId: string): Promise<ProjectMetadata>;
  getProjectDirectory(projectId: string): Promise<string>;
  getProjectFilePath(projectId: string, fileName: string): Promise<string>;
}

const requiredDirs = [
  'media/images',
  'media/videos',
  'media/audio',
  'media/references',
  'media/thumbnails',
  'exports',
  'cache',
  'prompts',
];

export function createProjectStore(rootPath: string): ProjectStore {
  const resolvedRoot = path.resolve(rootPath);
  const registryPath = path.join(resolvedRoot, 'project-registry.json');

  async function safePath(targetPath: string): Promise<string> {
    await fs.mkdir(resolvedRoot, { recursive: true });
    return assertRealPathInsideAllowedRoots(targetPath, [resolvedRoot]);
  }

  async function readRegistry(): Promise<ProjectIndexEntry[]> {
    try {
      return JSON.parse(await fs.readFile(await safePath(registryPath), 'utf8')) as ProjectIndexEntry[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async function writeRegistry(entries: ProjectIndexEntry[]) {
    await fs.writeFile(await safePath(registryPath), JSON.stringify(entries, null, 2), 'utf8');
  }

  function projectPath(folder: string): string {
    assertSafeProjectName(folder);
    return path.join(resolvedRoot, folder);
  }

  async function writeProjectJson(projectDir: string, fileName: string, value: unknown) {
    const filePath = path.join(projectDir, fileName);
    await fs.writeFile(await safePath(filePath), JSON.stringify(value, null, 2), 'utf8');
  }

  async function readProjectEntry(entry: ProjectIndexEntry): Promise<ProjectMetadata> {
    const projectFile = await safePath(path.join(projectPath(entry.folder), 'project.json'));
    return JSON.parse(await fs.readFile(projectFile, 'utf8')) as ProjectMetadata;
  }

  async function getProjectDirectory(projectId: string): Promise<string> {
    const registry = await readRegistry();
    const entry = registry.find((item) => item.id === projectId);
    if (!entry) {
      throw new Error('Project not found');
    }

    return safePath(projectPath(entry.folder));
  }

  return {
    async createProject(input) {
      assertSafeProjectName(input.name);
      const project = createEmptyProject(input.name, input.aspectRatio);
      const projectDir = projectPath(input.name);

      await safePath(projectDir);
      await fs.mkdir(projectDir, { recursive: false });
      for (const directory of requiredDirs) {
        const directoryPath = path.join(projectDir, directory);
        await safePath(directoryPath);
        await fs.mkdir(directoryPath, { recursive: true });
      }

      await writeProjectJson(projectDir, 'project.json', project);
      await writeProjectJson(projectDir, 'canvas.json', { assets: [], cards: [] });
      await writeProjectJson(projectDir, 'pipeline.json', { stages: {} });
      await writeProjectJson(projectDir, 'director.json', { objects: [], snapshots: [] });
      await writeProjectJson(projectDir, 'timeline.json', { tracks: [] });
      await writeProjectJson(projectDir, 'tasks.json', { tasks: [] });

      const registry = await readRegistry();
      registry.push({ id: project.id, folder: input.name });
      await writeRegistry(registry);

      return project;
    },
    async importProject(input) {
      assertSafeProjectName(input.folderName);
      validateProjectMetadata(input.project);
      if (input.project.name !== input.folderName) {
        throw new Error('Imported project folder does not match project name');
      }

      const registry = await readRegistry();
      if (registry.some((entry) => entry.id === input.project.id || entry.folder.toLowerCase() === input.folderName.toLowerCase())) {
        throw new Error('Project already exists');
      }

      const projectDir = projectPath(input.folderName);
      await safePath(projectDir);
      await fs.mkdir(projectDir, { recursive: false });
      for (const directory of requiredDirs) {
        const directoryPath = path.join(projectDir, directory);
        await safePath(directoryPath);
        await fs.mkdir(directoryPath, { recursive: true });
      }

      try {
        for (const [relativePath, bytes] of input.files) {
          validateProjectRelativePath(relativePath);
          const filePath = path.join(projectDir, ...relativePath.split('/'));
          await safePath(path.dirname(filePath));
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(await safePath(filePath), bytes);
        }

        registry.push({ id: input.project.id, folder: input.folderName });
        await writeRegistry(registry);
      } catch (error) {
        await fs.rm(projectDir, { recursive: true, force: true });
        throw error;
      }

      return input.project;
    },
    async listProjects() {
      const registry = await readRegistry();
      return Promise.all(registry.map(readProjectEntry));
    },
    async readProject(projectId) {
      const registry = await readRegistry();
      const entry = registry.find((item) => item.id === projectId);
      if (!entry) {
        throw new Error('Project not found');
      }

      return readProjectEntry(entry);
    },
    async getProjectDirectory(projectId) {
      return getProjectDirectory(projectId);
    },
    async getProjectFilePath(projectId, fileName) {
      if (fileName !== path.basename(fileName) || fileName === '.' || fileName === '..') {
        throw new Error('Invalid project file name');
      }

      const projectDir = await getProjectDirectory(projectId);
      return assertRealPathInsideAllowedRoots(path.join(projectDir, fileName), [projectDir]);
    },
  };
}

function assertSafeProjectName(name: string): void {
  const isReservedWindowsName = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name);
  const isSafe = name.trim().length > 0
    && name !== '.'
    && name !== '..'
    && !/[<>:"/\\|?*\u0000-\u001f]/.test(name)
    && !/[. ]$/.test(name)
    && !isReservedWindowsName;

  if (!isSafe) {
    throw new Error('Invalid project name');
  }
}

function validateProjectRelativePath(value: string): void {
  const segments = value.split('/');
  const isSafe = value.length > 0
    && !value.includes('\0')
    && !value.includes('\\')
    && !path.posix.isAbsolute(value)
    && !path.win32.isAbsolute(value)
    && !/^[a-z][a-z0-9+.-]*:/i.test(value)
    && segments.every((segment) => segment && segment !== '.' && segment !== '..' && !/[ .]$/.test(segment));

  if (!isSafe) {
    throw new Error('Invalid project file path');
  }
}

function validateProjectMetadata(project: ProjectMetadata): void {
  const aspectRatios = new Set<ProjectAspectRatio>(['16:9', '9:16', '1:1', '4:3', 'custom']);
  const projectTypes = new Set(['storyboard', 'short-video', 'animation', 'mixed']);
  const isSafe = project
    && project.schemaVersion === 1
    && typeof project.id === 'string'
    && project.id.trim().length > 0
    && typeof project.name === 'string'
    && aspectRatios.has(project.aspectRatio)
    && projectTypes.has(project.type)
    && (project.coverPath === null || typeof project.coverPath === 'string')
    && typeof project.createdAt === 'string'
    && typeof project.updatedAt === 'string';

  if (!isSafe) {
    throw new Error('Invalid imported project metadata');
  }
  assertSafeProjectName(project.name);
}
