import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createProjectStore } from '../../electron/services/projectStore';

describe('project store', () => {
  it('creates a project folder with required json files and media directories', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-projects-'));
    const store = createProjectStore(root);

    const project = await store.createProject({ name: 'Demo Project', aspectRatio: '16:9' });
    const projectDir = path.join(root, 'Demo Project');

    await expect(fs.stat(path.join(projectDir, 'project.json'))).resolves.toBeTruthy();
    await expect(fs.stat(path.join(projectDir, 'canvas.json'))).resolves.toBeTruthy();
    await expect(fs.stat(path.join(projectDir, 'pipeline.json'))).resolves.toBeTruthy();
    await expect(fs.stat(path.join(projectDir, 'media/images'))).resolves.toBeTruthy();

    const loaded = await store.readProject(project.id);
    expect(loaded.name).toBe('Demo Project');
  });
});
