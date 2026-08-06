import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProjectCenter } from '../../src/pages/ProjectCenter';

describe('ProjectCenter', () => {
  it('creates a project through the preload API', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'proj_abc', name: 'Demo', aspectRatio: '16:9' });
    vi.stubGlobal('threecut', { registry: { list: vi.fn().mockResolvedValue([]), create } });

    render(<ProjectCenter />);
    await userEvent.type(screen.getByLabelText('项目名称'), 'Demo');
    await userEvent.click(screen.getByRole('button', { name: '创建项目' }));

    expect(create).toHaveBeenCalledWith({ name: 'Demo', aspectRatio: '16:9' });
  });
});
