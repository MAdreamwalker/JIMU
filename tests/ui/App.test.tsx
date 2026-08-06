import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('threecut', {
      registry: { list: vi.fn().mockResolvedValue([]) },
      pipeline: { load: vi.fn().mockResolvedValue({ stages: {} }), save: vi.fn() },
      canvas: { load: vi.fn().mockResolvedValue({ assets: [], cards: [] }), save: vi.fn() },
      director: { load: vi.fn().mockResolvedValue({ objects: [], snapshots: [] }), save: vi.fn() },
      config: { getAll: vi.fn().mockResolvedValue({ providers: [] }), save: vi.fn() },
      storyboardPrompts: { read: vi.fn().mockResolvedValue({}), save: vi.fn() },
      skills: { list: vi.fn().mockResolvedValue([]), save: vi.fn() },
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
    expect(screen.getByRole('link', { name: '椤圭洰' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '浠诲姟' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '璁剧疆' })).toBeInTheDocument();
  });

  it.each([
    ['/', '项目中心'],
    ['/project/demo/canvas', '鍒涗綔鐢诲竷'],
    ['/project/demo/storyboard', 'Storyboard'],
    ['/project/demo/director', 'Director'],
    ['/project/demo/timeline', 'Timeline'],
    ['/tasks', 'Tasks'],
    ['/settings', '设置'],
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
});
