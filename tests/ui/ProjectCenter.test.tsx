import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProjectCenter } from '../../src/pages/ProjectCenter';

describe('ProjectCenter', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('loads projects and creates a project through the preload API', async () => {
    const existingProject = { id: 'proj_existing', name: 'Existing Project', aspectRatio: '9:16' };
    const createdProject = { id: 'proj_abc', name: 'Demo', aspectRatio: '16:9' };
    const list = vi.fn().mockResolvedValue([existingProject]);
    const create = vi.fn().mockResolvedValue(createdProject);
    vi.stubGlobal('jimu', { registry: { list, create } });

    render(<ProjectCenter />);
    expect(list).toHaveBeenCalledOnce();
    expect(await screen.findByText('Existing Project')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Project Name'), 'Demo');
    await userEvent.click(screen.getByRole('button', { name: 'Create Project' }));

    expect(create).toHaveBeenCalledWith({ name: 'Demo', aspectRatio: '16:9' });
    expect(await screen.findByText('Demo')).toBeInTheDocument();
  });

  it('shows an error when project loading fails', async () => {
    vi.stubGlobal('jimu', {
      registry: { list: vi.fn().mockRejectedValue(new Error('Registry unavailable')) },
    });

    render(<ProjectCenter />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load projects: Registry unavailable');
  });

  it('shows an error when project creation fails', async () => {
    const create = vi.fn().mockRejectedValue(new Error('Project already exists'));
    vi.stubGlobal('jimu', { registry: { list: vi.fn().mockResolvedValue([]), create } });

    render(<ProjectCenter />);
    await userEvent.type(screen.getByLabelText('Project Name'), 'Demo');
    await userEvent.click(screen.getByRole('button', { name: 'Create Project' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to create project: Project already exists');
  });
});
