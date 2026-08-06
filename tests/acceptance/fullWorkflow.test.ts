import { describe, expect, it, vi } from 'vitest';
import { matchRoute, routes } from '../../src/routes';

const exposed = vi.hoisted(() => ({ api: null as any }));
const ipcRenderer = vi.hoisted(() => ({
  invoke: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  removeListener: vi.fn(),
}));

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (_name: string, api: unknown) => {
      exposed.api = api;
    },
  },
  ipcRenderer,
}));

await import('../../electron/preload');

describe('full workflow contracts', () => {
  it('matches the project routes used by the prose-to-MP4 shell', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '/',
      '/project/:projectId/canvas',
      '/project/:projectId/storyboard',
      '/project/:projectId/director',
      '/project/:projectId/timeline',
      '/tasks',
      '/settings',
    ]);
    expect(matchRoute('/project/demo/canvas').title).toBe('Canvas');
    expect(matchRoute('/project/demo/storyboard').title).toBe('Storyboard');
    expect(matchRoute('/project/demo/director').title).toBe('Director');
    expect(matchRoute('/project/demo/timeline').title).toBe('Timeline');
  });

  it('exposes the workflow namespaces and forwards their IPC contracts', async () => {
    const api = exposed.api as Record<string, Record<string, (...args: any[]) => unknown>>;

    expect(Object.keys(api).sort()).toEqual([
      'app',
      'canvas',
      'config',
      'director',
      'media',
      'pipeline',
      'projectPackage',
      'registry',
      'skills',
      'storyboardPrompts',
      'tasks',
      'timeline',
    ]);

    await api.registry.list();
    await api.canvas.load('demo');
    await api.pipeline.load('demo');
    await api.director.load('demo');
    await api.timeline.exportMp4({
      projectId: 'demo',
      outputPath: 'exports/timeline.mp4',
      timeline: { durationSeconds: 0, tracks: [] },
    });
    await api.config.getAll();
    await api.storyboardPrompts.read();
    await api.skills.list();
    await api.tasks.list();
    await api.projectPackage.export('demo', 'exports/demo.3cut');
    await api.projectPackage.import('exports/demo.3cut');

    expect(ipcRenderer.invoke.mock.calls.map(([channel]) => channel)).toEqual([
      'registry:list',
      'canvas:load',
      'pipeline:load',
      'director:load',
      'timeline:exportMp4',
      'config:getAll',
      'storyboardPrompts:read',
      'skills:list',
      'tasks:list',
      'project:export',
      'project:import',
    ]);
  });
});
