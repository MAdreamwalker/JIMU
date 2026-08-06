import { fireEvent, render, screen } from '@testing-library/react';
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

  it('updates property values when the selected object changes', async () => {
    vi.stubGlobal('threecut', {
      director: {
        load: vi.fn().mockResolvedValue({
          objects: [
            { id: 'actor_1', kind: 'actor', name: 'Hero', position: { x: 1, y: 0, z: 0 }, rotation: { x: 0, y: 2, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
            { id: 'camera_1', kind: 'camera', name: 'Camera', position: { x: 10, y: 0, z: 0 }, rotation: { x: 0, y: 20, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          ],
          snapshots: [],
        }),
        save: vi.fn(),
      },
    });

    render(<DirectorWorkspace projectId="proj_abc" />);

    const positionInput = await screen.findByTestId('director-position-x');
    expect(positionInput).toHaveValue(1);

    fireEvent.click(screen.getByRole('button', { name: 'Camera' }));

    expect(positionInput).toHaveValue(10);
  });
});
