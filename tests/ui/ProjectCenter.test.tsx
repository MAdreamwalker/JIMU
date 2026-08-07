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
    vi.stubGlobal('jimu', {
      registry: { list, create },
      projectPackage: {
        exportWithDialog: vi.fn(),
        importWithDialog: vi.fn(),
      },
    });

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
      projectPackage: {
        exportWithDialog: vi.fn(),
        importWithDialog: vi.fn(),
      },
    });

    render(<ProjectCenter />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load projects: Registry unavailable');
  });

  it('shows an error when project creation fails', async () => {
    const create = vi.fn().mockRejectedValue(new Error('Project already exists'));
    vi.stubGlobal('jimu', {
      registry: { list: vi.fn().mockResolvedValue([]), create },
      projectPackage: {
        exportWithDialog: vi.fn(),
        importWithDialog: vi.fn(),
      },
    });

    render(<ProjectCenter />);
    await userEvent.type(screen.getByLabelText('Project Name'), 'Demo');
    await userEvent.click(screen.getByRole('button', { name: 'Create Project' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to create project: Project already exists');
  });

  it('imports a package through the native dialog and appends the project', async () => {
    const importedProject = { id: 'proj_imported', name: 'Imported Demo', aspectRatio: '16:9' };
    const importWithDialog = vi.fn().mockResolvedValue(importedProject);
    vi.stubGlobal('jimu', {
      registry: { list: vi.fn().mockResolvedValue([]), create: vi.fn() },
      projectPackage: {
        exportWithDialog: vi.fn(),
        importWithDialog,
      },
    });

    render(<ProjectCenter />);
    await userEvent.click(screen.getByRole('button', { name: 'Import .JIMU' }));

    expect(importWithDialog).toHaveBeenCalledOnce();
    expect(await screen.findByText('Imported Demo')).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('Imported Imported Demo');
  });

  it('exports a project through the native dialog', async () => {
    const existingProject = { id: 'proj_existing', name: 'Existing Project', aspectRatio: '9:16' };
    const exportWithDialog = vi.fn().mockResolvedValue('C:\\Users\\Me\\Desktop\\Existing Project.JIMU');
    vi.stubGlobal('jimu', {
      registry: { list: vi.fn().mockResolvedValue([existingProject]), create: vi.fn() },
      projectPackage: {
        exportWithDialog,
        importWithDialog: vi.fn(),
      },
    });

    render(<ProjectCenter />);
    expect(await screen.findByText('Existing Project')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Export Existing Project' }));

    expect(exportWithDialog).toHaveBeenCalledWith('proj_existing');
    expect(await screen.findByRole('status')).toHaveTextContent('Exported Existing Project');
  });
});
