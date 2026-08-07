import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreationCanvas } from '../../src/pages/CreationCanvas';

describe('CreationCanvas', () => {
  it('groups assets by type', async () => {
    vi.stubGlobal('jimu', {
      canvas: {
        load: vi.fn().mockResolvedValue({
          assets: [
            { id: 'asset_1', kind: 'character', state: 'confirmed', name: 'Hero', description: 'Lead', prompt: 'Hero', mediaPaths: [], version: 1 },
            { id: 'asset_2', kind: 'scene', state: 'draft', name: 'Alley', description: 'Night scene', prompt: 'Night scene', mediaPaths: [], version: 1 },
          ],
          cards: [],
        }),
        save: vi.fn(),
      },
    });

    render(<CreationCanvas projectId="proj_abc" />);

    expect(await screen.findByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Hero')).toBeInTheDocument();
    expect(screen.getByText('Scenes')).toBeInTheDocument();
    expect(screen.getByText('Alley')).toBeInTheDocument();
  });
});
