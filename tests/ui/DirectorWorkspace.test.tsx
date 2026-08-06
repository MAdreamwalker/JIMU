import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DirectorWorkspace } from '../../src/pages/DirectorWorkspace';

describe('DirectorWorkspace', () => {
  it('renders viewport, object panel, and property panel', async () => {
    vi.stubGlobal('threecut', {
      director: { load: vi.fn().mockResolvedValue({ objects: [], snapshots: [] }), save: vi.fn() },
    });

    render(<DirectorWorkspace projectId="proj_abc" />);

    expect(await screen.findByLabelText('3D 瑙嗗彛')).toBeInTheDocument();
    expect(screen.getByText('瀵硅薄')).toBeInTheDocument();
    expect(screen.getByText('属性')).toBeInTheDocument();
  });
});
