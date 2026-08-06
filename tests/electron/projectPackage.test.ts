import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('exposes validation-only import and export service shells', async () => {
    await expect(exportProjectPackage('proj_1', 'Demo.3cut')).resolves.toBe('Demo.3cut');
    await expect(importProjectPackage('Demo.3cut')).rejects.toThrow('not implemented');
  });

  it('rejects unsafe package file paths before shell behavior', async () => {
    const unsafePaths = ['', '  Demo.3cut', 'Demo.3cut  ', '../Demo.3cut', '..\\Demo.3cut',
      '/tmp/Demo.3cut', 'C:\\tmp\\Demo.3cut', 'C:Demo.3cut', 'Demo.3cut\u0000'];

    for (const packagePath of unsafePaths) {
      await expect(exportProjectPackage('proj_1', packagePath)).rejects.toThrow('Invalid package file path');
      await expect(importProjectPackage(packagePath)).rejects.toThrow('Invalid package file path');
    }
  });
});

describe('project package IPC handlers', () => {
  beforeEach(async () => {
    handlers.clear();
    const { registerProjectPackageHandlers } = await import('../../electron/ipc/registerProjectPackageHandlers');
    registerProjectPackageHandlers();
  });

  it('forwards validated export and import requests', async () => {
    await expect(handlers.get('project:export')!({}, { projectId: 'proj_1', destinationPath: 'Demo.3cut' }))
      .resolves.toBe('Demo.3cut');
    await expect(handlers.get('project:import')!({}, { packagePath: 'Demo.3cut' }))
      .rejects.toThrow('not implemented');
  });

  it('rejects malformed IPC payloads', async () => {
    await expect(handlers.get('project:export')!({}, { projectId: '', destinationPath: 'Demo.3cut' }))
      .rejects.toThrow('Invalid project export input');
    await expect(handlers.get('project:import')!({}, { packagePath: '' }))
      .rejects.toThrow('Invalid project import input');
  });

  it('rejects unknown IPC fields and unsafe package paths', async () => {
    await expect(handlers.get('project:export')!({}, {
      projectId: 'proj_1', destinationPath: 'Demo.3cut', extra: true,
    })).rejects.toThrow('Invalid project export input');
    await expect(handlers.get('project:import')!({}, { packagePath: '../Demo.3cut' }))
      .rejects.toThrow('Invalid project import input');
    await expect(handlers.get('project:import')!({}, { packagePath: ' Demo.3cut' }))
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

    exposed.api.projectPackage.export('proj_1', 'Demo.3cut');
    exposed.api.projectPackage.import('Demo.3cut');
    expect(ipcRenderer.invoke).toHaveBeenNthCalledWith(1, 'project:export', {
      projectId: 'proj_1', destinationPath: 'Demo.3cut',
    });
    expect(ipcRenderer.invoke).toHaveBeenNthCalledWith(2, 'project:import', { packagePath: 'Demo.3cut' });
  });
});
