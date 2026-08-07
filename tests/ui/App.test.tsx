import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('jimu', {
      registry: { list: vi.fn().mockResolvedValue([]) },
      pipeline: { load: vi.fn().mockResolvedValue({ stages: {} }), save: vi.fn() },
      canvas: { load: vi.fn().mockResolvedValue({ assets: [], cards: [] }), save: vi.fn() },
      director: { load: vi.fn().mockResolvedValue({ objects: [], snapshots: [] }), save: vi.fn() },
      timeline: {
        load: vi.fn().mockResolvedValue({ durationSeconds: 0, tracks: [] }),
        save: vi.fn(),
        exportMp4: vi.fn(),
        cancelExport: vi.fn(),
        onExportProgress: vi.fn().mockReturnValue(() => undefined),
      },
      config: { getAll: vi.fn().mockResolvedValue({ providers: [] }), save: vi.fn() },
      storyboardPrompts: { read: vi.fn().mockResolvedValue({}), save: vi.fn() },
      skills: { list: vi.fn().mockResolvedValue([]), save: vi.fn() },
      tasks: { list: vi.fn().mockResolvedValue([]), retry: vi.fn(), cancel: vi.fn() },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.location.hash = '';
  });

  it('renders the desktop shell navigation', () => {
    render(<App />);

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it.each([
    ['/', 'Project Center'],
    ['/project/demo/canvas', 'Canvas'],
    ['/project/demo/storyboard', 'Storyboard'],
    ['/project/demo/director', 'Director'],
    ['/project/demo/timeline', '\u526a\u8f91\u65f6\u95f4\u7ebf'],
    ['/tasks', 'Tasks'],
    ['/settings', 'Settings'],
  ])('renders the page for %s', (path, title) => {
    window.location.hash = `#${path}`;

    render(<App />);

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  it('updates the rendered page when the hash changes', () => {
    render(<App />);

    window.location.hash = '#/tasks';
    fireEvent(window, new HashChangeEvent('hashchange'));

    expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
  });

  it('renders the task center route through the real page component', async () => {
    window.location.hash = '#/tasks';
    render(<App />);

    expect(await screen.findByRole('status')).toHaveTextContent('No tasks');
  });

  it('allows task retry and cancellation through the task center', async () => {
    const retry = vi.fn().mockResolvedValue({
      id: 'task_failed',
      projectId: 'proj_1',
      projectName: 'Demo',
      category: 'pipeline',
      status: 'queued',
      providerId: 'mock',
      inputSummary: 'input',
      outputSummary: 'output',
      updatedAt: '2026-08-06T01:00:00.000Z',
      createdAt: '2026-08-06T00:00:00.000Z',
    });
    const cancel = vi.fn().mockResolvedValue({
      id: 'task_running',
      projectId: 'proj_1',
      projectName: 'Demo',
      category: 'export',
      status: 'cancelled',
      providerId: 'mock',
      inputSummary: 'input',
      outputSummary: 'output',
      updatedAt: '2026-08-06T01:00:00.000Z',
      createdAt: '2026-08-06T00:00:00.000Z',
    });
    vi.stubGlobal('jimu', {
      ...(window.jimu as any),
      tasks: {
        list: vi.fn().mockResolvedValue([
          {
            id: 'task_failed',
            projectId: 'proj_1',
            projectName: 'Demo',
            category: 'pipeline',
            status: 'failed',
            providerId: 'mock',
            inputSummary: 'input',
            outputSummary: 'output',
            errorCategory: 'provider',
            updatedAt: '2026-08-06T00:00:00.000Z',
            createdAt: '2026-08-06T00:00:00.000Z',
          },
          {
            id: 'task_running',
            projectId: 'proj_1',
            projectName: 'Demo',
            category: 'export',
            status: 'running',
            providerId: 'mock',
            inputSummary: 'input',
            outputSummary: 'output',
            updatedAt: '2026-08-06T00:00:00.000Z',
            createdAt: '2026-08-06T00:00:00.000Z',
          },
        ]),
        retry,
        cancel,
      },
    });
    window.location.hash = '#/tasks';
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Retry task_failed' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel task_running' }));

    expect(retry).toHaveBeenCalledWith('proj_1', 'task_failed');
    expect(cancel).toHaveBeenCalledWith('proj_1', 'task_running');
  });
});
