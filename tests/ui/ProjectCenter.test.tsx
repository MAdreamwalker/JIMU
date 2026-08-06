import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProjectCenter } from '../../src/pages/ProjectCenter';

describe('ProjectCenter', () => {
  it('loads projects and creates a project through the preload API', async () => {
    const existingProject = { id: 'proj_existing', name: 'Existing Project', aspectRatio: '9:16' };
    const createdProject = { id: 'proj_abc', name: 'Demo', aspectRatio: '16:9' };
    const list = vi.fn().mockResolvedValue([existingProject]);
    const create = vi.fn().mockResolvedValue(createdProject);
    vi.stubGlobal('threecut', { registry: { list, create } });

    render(<ProjectCenter />);
    expect(list).toHaveBeenCalledOnce();
    expect(await screen.findByText('Existing Project')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('项目名称'), 'Demo');
    await userEvent.click(screen.getByRole('button', { name: '创建项目' }));

    expect(create).toHaveBeenCalledWith({ name: 'Demo', aspectRatio: '16:9' });
    expect(await screen.findByText('Demo')).toBeInTheDocument();
  });
});
