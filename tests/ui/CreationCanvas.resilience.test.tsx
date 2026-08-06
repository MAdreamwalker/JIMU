import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreationCanvas } from '../../src/pages/CreationCanvas';

describe('CreationCanvas resilience', () => {
  it('keeps each asset in its matching type section', async () => {
    vi.stubGlobal('threecut', {
      canvas: {
        load: vi.fn().mockResolvedValue({
          assets: [
            { id: 'asset_1', kind: 'character', state: 'confirmed', name: 'Hero', description: 'Lead', prompt: 'Hero', mediaPaths: [], version: 1 },
            { id: 'asset_2', kind: 'scene', state: 'draft', name: 'Alley', description: 'Night', prompt: 'Alley', mediaPaths: [], version: 1 },
          ],
          cards: [],
        }),
        save: vi.fn(),
      },
    });

    render(<CreationCanvas projectId="proj_abc" />);

    const sections = await screen.findAllByRole('heading', { level: 2 });
    expect(within(sections[0].closest('section')!).getByText('Hero')).toBeInTheDocument();
    expect(within(sections[1].closest('section')!).getByText('Alley')).toBeInTheDocument();
  });

  it('shows an error when the canvas cannot be loaded', async () => {
    vi.stubGlobal('threecut', {
      canvas: {
        load: vi.fn().mockRejectedValue(new Error('Canvas is invalid')),
        save: vi.fn(),
      },
    });

    render(<CreationCanvas projectId="proj_abc" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Canvas is invalid');
  });
});
