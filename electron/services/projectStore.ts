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
  readProject(projectId: string): Promise<ProjectMetadata>;
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
    async readProject(projectId) {
      const registry = await readRegistry();
      const entry = registry.find((item) => item.id === projectId);
      if (!entry) {
        throw new Error('Project not found');
      }

      const projectFile = await safePath(path.join(projectPath(entry.folder), 'project.json'));
      return JSON.parse(await fs.readFile(projectFile, 'utf8')) as ProjectMetadata;
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
