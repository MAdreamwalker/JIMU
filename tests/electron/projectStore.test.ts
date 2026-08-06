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

  it('rejects project names that are not a single safe folder segment', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-projects-'));
    const store = createProjectStore(root);

    for (const name of ['', '   ', '.', '..', 'nested/project', 'nested\\project']) {
      await expect(store.createProject({ name, aspectRatio: '16:9' })).rejects.toThrow('Invalid project name');
    }
  });

  it('rejects hostile registry folders outside the project root', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-projects-'));
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-outside-'));
    const store = createProjectStore(root);

    await fs.writeFile(path.join(outside, 'project.json'), JSON.stringify({ name: 'Outside' }), 'utf8');
    await fs.writeFile(
      path.join(root, 'project-registry.json'),
      JSON.stringify([{ id: 'outside', folder: '../' + path.basename(outside) }]),
      'utf8',
    );

    await expect(store.readProject('outside')).rejects.toThrow('Invalid project name');
  });

  it('rejects registry projects that escape through a directory link', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-projects-'));
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-outside-'));
    const linkPath = path.join(root, 'escape');
    const store = createProjectStore(root);

    await fs.writeFile(path.join(outside, 'project.json'), JSON.stringify({ name: 'Outside' }), 'utf8');

    try {
      await fs.symlink(outside, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'EPERM' || code === 'EACCES') {
        return;
      }
      throw error;
    }

    await fs.writeFile(
      path.join(root, 'project-registry.json'),
      JSON.stringify([{ id: 'outside', folder: 'escape' }]),
      'utf8',
    );

    await expect(store.readProject('outside')).rejects.toThrow('Path resolves outside authorized roots');
  });
});
