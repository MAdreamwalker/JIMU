import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDirectorStore, validateDirectorDocument } from '../../electron/services/directorStore';
import { createProjectStore } from '../../electron/services/projectStore';
import type { DirectorDocument } from '../../src/domain/director';

describe('director store', () => {
  it.each([
    undefined,
    {},
    { objects: 'bad', snapshots: [] },
    { objects: [{ id: 'actor_1' }], snapshots: [] },
    { objects: [], snapshots: [{ id: 'shot_1', name: 'Shot', objectIds: 'bad', createdAt: 'now' }] },
  ])('rejects malformed director documents', (director) => {
    expect(() => validateDirectorDocument(director)).toThrow('Invalid director document');
  });

  it('rejects malformed persisted director documents on load', async () => {
    const { directorStore, directorPath } = await createTestDirectorStore();
    await fs.writeFile(directorPath, JSON.stringify({ objects: 'bad', snapshots: [] }), 'utf8');

    await expect(directorStore.load()).rejects.toThrow('Invalid director document');
  });

  it('validates and persists a director document', async () => {
    const { directorStore, directorPath } = await createTestDirectorStore();
    const director = createDirector();

    await directorStore.save(director);

    await expect(fs.readFile(directorPath, 'utf8')).resolves.toBe(JSON.stringify(director, null, 2));
    await expect(directorStore.load()).resolves.toEqual(director);
    await expect(directorStore.save({ objects: [], snapshots: 'bad' } as unknown as DirectorDocument))
      .rejects.toThrow('Invalid director document');
  });
});

function createDirector(): DirectorDocument {
  return {
    objects: [{
      id: 'actor_1',
      kind: 'actor',
      name: 'Hero',
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 4, y: 5, z: 6 },
      scale: { x: 1, y: 1, z: 1 },
    }],
    snapshots: [{ id: 'shot_1', name: 'Opening', objectIds: ['actor_1'], createdAt: '2026-08-06T00:00:00.000Z' }],
  };
}

async function createTestDirectorStore() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-director-root-'));
  const projectStore = createProjectStore(root);
  const project = await projectStore.createProject({ name: 'Director Project', aspectRatio: '16:9' });

  return {
    directorStore: createDirectorStore(projectStore, project.id),
    directorPath: await projectStore.getProjectFilePath(project.id, 'director.json'),
  };
}
