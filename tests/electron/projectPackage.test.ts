import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProjectStore } from '../../electron/services/projectStore';
import {
  exportProjectPackage,
  importProjectPackage,
  validatePackageManifest,
  validatePackageEntries,
  validatePackageEntry,
} from '../../electron/services/projectPackage';

const handlers = vi.hoisted(() => new Map<string, (...args: any[]) => unknown>());

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: any[]) => unknown) => {
      handlers.set(channel, handler);
    }),
  },
}));

describe('project package safety', () => {
  it('blocks path traversal entries', () => {
    expect(() => validatePackageEntry({ path: '../secret.txt', size: 10 })).toThrow('Package entry path is unsafe');
  });

  it('blocks traversal entries using Windows separators', () => {
    expect(() => validatePackageEntry({ path: '..\\secret.txt', size: 10 })).toThrow('Package entry path is unsafe');
    expect(() => validatePackageEntry({ path: 'Demo\\..\\secret.txt', size: 10 })).toThrow('Package entry path is unsafe');
  });

  it('blocks absolute package entry paths', () => {
    expect(() => validatePackageEntry({ path: 'C:\\secret.txt', size: 10 })).toThrow('Package entry path is unsafe');
    expect(() => validatePackageEntry({ path: '\\\\server\\share\\secret.txt', size: 10 })).toThrow('Package entry path is unsafe');
  });

  it('allows normal project json entries', () => {
    expect(() => validatePackageEntry({ path: 'Demo/project.json', size: 1024 })).not.toThrow();
  });

  it('blocks entries over the maximum size', () => {
    expect(() => validatePackageEntry({ path: 'Demo/video.mp4', size: 500 * 1024 * 1024 + 1 }))
      .toThrow('Package entry is too large');
  });

  it('blocks malformed and Windows drive-relative entry paths', () => {
    expect(() => validatePackageEntry({ path: 'Demo//project.json', size: 10 })).toThrow('Package entry path is unsafe');
    expect(() => validatePackageEntry({ path: 'C:secret.txt', size: 10 })).toThrow('Package entry path is unsafe');
    expect(() => validatePackageEntry({ path: 'Demo\\project.json', size: 10 })).toThrow('Package entry path is unsafe');
    expect(() => validatePackageEntry({ path: 'Demo/project.json\u0000', size: 10 })).toThrow('Package entry path is unsafe');
    expect(() => validatePackageEntry({ path: 'Demo/project.json ', size: 10 })).toThrow('Package entry path is unsafe');
    expect(() => validatePackageEntry({ path: 'Demo/project.json.', size: 10 })).toThrow('Package entry path is unsafe');
    expect(() => validatePackageEntry({ path: 'Demo/project.json', size: -1 })).toThrow('Package entry is too large');
    expect(() => validatePackageEntry({ path: 'Demo/project.json', size: 1.5 })).toThrow('Package entry is too large');
  });

  it('blocks packages whose entries exceed the total size limit', () => {
    expect(() => validatePackageEntries([
      { path: 'Demo/a.bin', size: 500 * 1024 * 1024 },
      { path: 'Demo/b.bin', size: 500 * 1024 * 1024 },
      { path: 'Demo/c.bin', size: 1 },
    ])).toThrow('Package is too large');
  });

  it('blocks packages with too many entries, including zero-byte entries', () => {
    expect(() => validatePackageEntries(
      Array.from({ length: 10_001 }, (_, index) => ({ path: `Demo/${index}.bin`, size: 0 })),
    )).toThrow('Package has too many entries');
  });

  it('blocks duplicate package entry paths', () => {
    expect(() => validatePackageEntries([
      { path: 'Demo/project.json', size: 10 },
      { path: 'Demo/project.json', size: 10 },
    ])).toThrow('Package contains duplicate entry paths');
  });

  it('blocks case-insensitive duplicate package entry paths', () => {
    expect(() => validatePackageEntries([
      { path: 'Demo/file.json', size: 10 },
      { path: 'Demo/FILE.JSON', size: 10 },
    ])).toThrow('Package contains duplicate entry paths');
  });

  it('requires a versioned manifest and project json entry', () => {
    expect(() => validatePackageManifest({
      schemaVersion: 1,
      projectId: 'proj_1',
      entries: [{ path: 'Demo/project.json', size: 10 }],
    })).toThrow('Package manifest is missing manifest.json');

    expect(() => validatePackageManifest({
      schemaVersion: 1,
      projectId: 'proj_1',
      entries: [{ path: 'manifest.json', size: 10 }],
    })).toThrow('Package manifest is missing project.json');
  });

  it('exports a registered project package with manifest entries', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jimu-package-export-'));
    const destinationPath = path.join(os.tmpdir(), `Demo-${Date.now()}.JIMU`);
    const store = createProjectStore(root);
    const project = await store.createProject({ name: 'Demo', aspectRatio: '16:9' });
    await fs.writeFile(path.join(root, 'Demo', 'media', 'images', 'reference.txt'), 'image bytes', 'utf8');

    await expect(exportProjectPackage(root, project.id, destinationPath)).resolves.toBe(destinationPath);
    const packageJson = JSON.parse(await fs.readFile(destinationPath, 'utf8'));
    expect(packageJson.schemaVersion).toBe(1);
    expect(packageJson.manifest.projectId).toBe(project.id);
    expect(packageJson.manifest.entries.map((entry: { path: string }) => entry.path)).toEqual(expect.arrayContaining([
      'manifest.json',
      'Demo/project.json',
      'Demo/media/images/reference.txt',
    ]));
  });

  it('imports a JIMU package as a registered project with restored files', async () => {
    const sourceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'jimu-package-source-'));
    const importRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'jimu-package-import-'));
    const destinationPath = path.join(os.tmpdir(), `Roundtrip-${Date.now()}.JIMU`);
    const sourceStore = createProjectStore(sourceRoot);
    const project = await sourceStore.createProject({ name: 'Roundtrip Demo', aspectRatio: '16:9' });
    await fs.writeFile(
      path.join(sourceRoot, 'Roundtrip Demo', 'timeline.json'),
      JSON.stringify({ tracks: [{ id: 'track_1', clips: [] }] }, null, 2),
      'utf8',
    );
    await fs.writeFile(
      path.join(sourceRoot, 'Roundtrip Demo', 'media', 'images', 'reference.txt'),
      'restored media',
      'utf8',
    );

    await exportProjectPackage(sourceRoot, project.id, destinationPath);
    const imported = await importProjectPackage(importRoot, destinationPath);
    const importStore = createProjectStore(importRoot);

    expect(imported).toMatchObject({ name: 'Roundtrip Demo', aspectRatio: '16:9' });
    await expect(importStore.readProject(imported.id)).resolves.toMatchObject({ id: imported.id });
    await expect(fs.readFile(
      path.join(importRoot, 'Roundtrip Demo', 'media', 'images', 'reference.txt'),
      'utf8',
    )).resolves.toBe('restored media');
  });

  it('rejects package files that are not declared in the manifest', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jimu-package-import-'));
    const packagePath = path.join(os.tmpdir(), `Undeclared-${Date.now()}.JIMU`);
    const projectMetadataText = JSON.stringify({
      schemaVersion: 1,
      id: 'proj_bad',
      name: 'Demo',
      aspectRatio: '16:9',
      type: 'storyboard',
      coverPath: null,
      createdAt: '2026-08-06T00:00:00.000Z',
      updatedAt: '2026-08-06T00:00:00.000Z',
    });
    await fs.writeFile(packagePath, JSON.stringify({
      schemaVersion: 1,
      manifest: {
        schemaVersion: 1,
        projectId: 'proj_bad',
        entries: [
          { path: 'manifest.json', size: 0 },
          { path: 'Demo/project.json', size: Buffer.byteLength(projectMetadataText) },
        ],
      },
      files: {
        'Demo/project.json': Buffer.from(projectMetadataText).toString('base64'),
        'Demo/extra.txt': Buffer.from('extra').toString('base64'),
      },
    }), 'utf8');

    await expect(importProjectPackage(root, packagePath)).rejects.toThrow('Project package contains undeclared files');
  });

  it('rejects package files whose decoded size differs from the manifest', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jimu-package-import-'));
    const packagePath = path.join(os.tmpdir(), `SizeMismatch-${Date.now()}.JIMU`);
    await fs.writeFile(packagePath, JSON.stringify({
      schemaVersion: 1,
      manifest: {
        schemaVersion: 1,
        projectId: 'proj_bad',
        entries: [
          { path: 'manifest.json', size: 0 },
          { path: 'Demo/project.json', size: 1 },
        ],
      },
      files: {
        'Demo/project.json': Buffer.from(JSON.stringify({
          schemaVersion: 1,
          id: 'proj_bad',
          name: 'Demo',
          aspectRatio: '16:9',
          type: 'storyboard',
          coverPath: null,
          createdAt: '2026-08-06T00:00:00.000Z',
          updatedAt: '2026-08-06T00:00:00.000Z',
        })).toString('base64'),
      },
    }), 'utf8');

    await expect(importProjectPackage(root, packagePath)).rejects.toThrow('Project package file size mismatch');
  });

  it('rejects packages that contain more than one project folder', async () => {
    const packageJson = {
      schemaVersion: 1,
      projectId: 'proj_bad',
      entries: [
        { path: 'manifest.json', size: 0 },
        { path: 'First/project.json', size: 10 },
        { path: 'Second/timeline.json', size: 10 },
      ],
    };

    expect(() => validatePackageManifest(packageJson)).not.toThrow();
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jimu-package-import-'));
    const packagePath = path.join(os.tmpdir(), `MultiFolder-${Date.now()}.JIMU`);
    await fs.writeFile(packagePath, JSON.stringify({
      schemaVersion: 1,
      manifest: packageJson,
      files: {
        'First/project.json': Buffer.from('first-file').toString('base64'),
        'Second/timeline.json': Buffer.from('secondfile').toString('base64'),
      },
    }), 'utf8');

    await expect(importProjectPackage(root, packagePath)).rejects.toThrow('Project package must contain one project folder');
  });

  it('rejects unsafe package file paths before shell behavior', async () => {
    const unsafePaths = ['', '  Demo.JIMU', 'Demo.JIMU  ', '../Demo.JIMU', '..\\Demo.JIMU',
      'C:\\tmp\\..\\Demo.JIMU', 'C:\\tmp. \\Demo.JIMU', 'C:\\tmp.\\Demo.JIMU',
      'C:\\tmp\\Demo.JIMU\\', '/tmp/Demo.JIMU/', 'C:Demo.JIMU', 'Demo.JIMU\u0000',
      'C:\\tmp\\Demo.zip'];

    for (const packagePath of unsafePaths) {
      await expect(exportProjectPackage('projects', 'proj_1', packagePath)).rejects.toThrow('Invalid package file path');
      await expect(importProjectPackage('projects', packagePath)).rejects.toThrow('Invalid package file path');
    }
  });

  it('allows normal absolute package file paths returned by file dialogs', async () => {
    const windowsPath = 'C:\\Users\\Me\\Desktop\\Demo.JIMU';
    const posixPath = '/tmp/Demo.JIMU';

    await expect(exportProjectPackage('projects', 'proj_1', windowsPath)).rejects.toThrow('Project not found');
    await expect(exportProjectPackage('projects', 'proj_1', posixPath)).rejects.toThrow('Project not found');
    await expect(importProjectPackage('projects', windowsPath)).rejects.toThrow();
  });
});

describe('project package IPC handlers', () => {
  beforeEach(async () => {
    handlers.clear();
    const { registerProjectPackageHandlers } = await import('../../electron/ipc/registerProjectPackageHandlers');
    registerProjectPackageHandlers('projects');
  });

  it('forwards validated export and import requests', async () => {
    await expect(handlers.get('project:export')!({}, { projectId: 'proj_1', destinationPath: 'Demo.JIMU' }))
      .rejects.toThrow('Project not found');
    await expect(handlers.get('project:import')!({}, { packagePath: 'Demo.JIMU' }))
      .rejects.toThrow();
  });

  it('forwards absolute package file paths from external file dialogs', async () => {
    const destinationPath = 'C:\\Users\\Me\\Desktop\\Demo.JIMU';
    await expect(handlers.get('project:export')!({}, { projectId: 'proj_1', destinationPath }))
      .rejects.toThrow('Project not found');
    await expect(handlers.get('project:import')!({}, { packagePath: destinationPath }))
      .rejects.toThrow();
  });

  it('rejects malformed IPC payloads', async () => {
    await expect(handlers.get('project:export')!({}, { projectId: '', destinationPath: 'Demo.JIMU' }))
      .rejects.toThrow('Invalid project export input');
    await expect(handlers.get('project:import')!({}, { packagePath: '' }))
      .rejects.toThrow('Invalid project import input');
  });

  it('rejects unknown IPC fields and unsafe package paths', async () => {
    await expect(handlers.get('project:export')!({}, {
      projectId: 'proj_1', destinationPath: 'Demo.JIMU', extra: true,
    })).rejects.toThrow('Invalid project export input');
    await expect(handlers.get('project:import')!({}, { packagePath: '../Demo.JIMU' }))
      .rejects.toThrow('Invalid project import input');
    await expect(handlers.get('project:import')!({}, { packagePath: ' Demo.JIMU' }))
      .rejects.toThrow('Invalid project import input');
  });
});

describe('project package preload and renderer types', () => {
  it('exposes project package methods through preload', async () => {
    const exposed = vi.hoisted(() => ({ api: null as any }));
    const ipcRenderer = vi.hoisted(() => ({ invoke: vi.fn() }));
    vi.resetModules();
    vi.doMock('electron', () => ({
      contextBridge: { exposeInMainWorld: (_name: string, api: unknown) => { exposed.api = api; } },
      ipcRenderer,
    }));
    await import('../../electron/preload');

    exposed.api.projectPackage.export('proj_1', 'Demo.JIMU');
    exposed.api.projectPackage.import('Demo.JIMU');
    expect(ipcRenderer.invoke).toHaveBeenNthCalledWith(1, 'project:export', {
      projectId: 'proj_1', destinationPath: 'Demo.JIMU',
    });
    expect(ipcRenderer.invoke).toHaveBeenNthCalledWith(2, 'project:import', { packagePath: 'Demo.JIMU' });
  });
});
