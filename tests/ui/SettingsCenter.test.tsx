import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsCenter } from '../../src/pages/SettingsCenter';

describe('SettingsCenter', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows provider and prompt sections after loading through the preload API', async () => {
    const getAll = vi.fn().mockResolvedValue({ providers: [] });
    const read = vi.fn().mockResolvedValue({ 'chapter-split': 'Split chapters' });
    const list = vi.fn().mockResolvedValue([]);
    vi.stubGlobal('jimu', {
      config: { getAll, save: vi.fn() },
      storyboardPrompts: { read },
      skills: { list, save: vi.fn() },
    });

    render(<SettingsCenter />);

    expect(await screen.findByText('Model Settings')).toBeInTheDocument();
    expect(screen.getByText('Prompt Management')).toBeInTheDocument();
    expect(screen.getByText('Skills Management')).toBeInTheDocument();
    expect(getAll).toHaveBeenCalledOnce();
    expect(read).toHaveBeenCalledOnce();
    expect(list).toHaveBeenCalledOnce();
  });

  it('shows a visible error when settings data cannot load', async () => {
    vi.stubGlobal('jimu', {
      config: { getAll: vi.fn().mockRejectedValue(new Error('Config unavailable')), save: vi.fn() },
      storyboardPrompts: { read: vi.fn().mockResolvedValue({}), save: vi.fn() },
      skills: { list: vi.fn().mockResolvedValue([]), save: vi.fn() },
    });

    render(<SettingsCenter />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load settings: Config unavailable');
  });
});
