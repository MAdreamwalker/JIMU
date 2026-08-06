import fs from 'node:fs/promises';
import path from 'node:path';
import { assertInsideAllowedRoots } from './pathPolicy.js';

type ProjectAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | 'custom';

interface ProjectMetadata {
  schemaVersion: 1;
  id: string;
  name: string;
  aspectRatio: ProjectAspectRatio;
  type: 'storyboard' | 'short-video' | 'animation' | 'mixed';
  coverPath: string | null;
  createdAt: string;
  updatedAt: string;
}

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

function createEmptyProject(name: string, aspectRatio: ProjectAspectRatio): ProjectMetadata {
  const now = new Date().toISOString();
  const id = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(12)))
    .map((value) => (value % 36).toString(36))
    .join('');

  return {
    schemaVersion: 1,
    id: `proj_${id}`,
    name,
    aspectRatio,
    type: 'storyboard',
    coverPath: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createProjectStore(rootPath: string): ProjectStore {
  const resolvedRoot = path.resolve(rootPath);
  const registryPath = assertInsideAllowedRoots(path.join(resolvedRoot, 'project-registry.json'), [resolvedRoot]);

  async function readRegistry(): Promise<ProjectIndexEntry[]> {
    try {
      return JSON.parse(await fs.readFile(registryPath, 'utf8')) as ProjectIndexEntry[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async function writeRegistry(entries: ProjectIndexEntry[]) {
    await fs.mkdir(resolvedRoot, { recursive: true });
    await fs.writeFile(registryPath, JSON.stringify(entries, null, 2), 'utf8');
  }

  function projectPath(folder: string): string {
    return assertInsideAllowedRoots(path.join(resolvedRoot, folder), [resolvedRoot]);
  }

  return {
    async createProject(input) {
      const project = createEmptyProject(input.name, input.aspectRatio);
      const projectDir = projectPath(input.name);

      await fs.mkdir(projectDir, { recursive: false });
      for (const directory of requiredDirs) {
        await fs.mkdir(path.join(projectDir, directory), { recursive: true });
      }

      await fs.writeFile(path.join(projectDir, 'project.json'), JSON.stringify(project, null, 2), 'utf8');
      await fs.writeFile(path.join(projectDir, 'canvas.json'), JSON.stringify({ assets: [], cards: [] }, null, 2), 'utf8');
      await fs.writeFile(path.join(projectDir, 'pipeline.json'), JSON.stringify({ stages: {} }, null, 2), 'utf8');
      await fs.writeFile(path.join(projectDir, 'director.json'), JSON.stringify({ objects: [], snapshots: [] }, null, 2), 'utf8');
      await fs.writeFile(path.join(projectDir, 'timeline.json'), JSON.stringify({ tracks: [] }, null, 2), 'utf8');
      await fs.writeFile(path.join(projectDir, 'tasks.json'), JSON.stringify({ tasks: [] }, null, 2), 'utf8');

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

      const projectFile = assertInsideAllowedRoots(path.join(projectPath(entry.folder), 'project.json'), [resolvedRoot]);
      return JSON.parse(await fs.readFile(projectFile, 'utf8')) as ProjectMetadata;
    },
  };
}
