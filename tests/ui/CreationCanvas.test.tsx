import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreationCanvas } from '../../src/pages/CreationCanvas';

describe('CreationCanvas', () => {
  it('groups assets by type', async () => {
    vi.stubGlobal('threecut', {
      canvas: {
        load: vi.fn().mockResolvedValue({
          assets: [
            { id: 'asset_1', kind: 'character', state: 'confirmed', name: '涓昏', description: '灏戝勾', prompt: '灏戝勾', mediaPaths: [], version: 1 },
            { id: 'asset_2', kind: 'scene', state: 'draft', name: '琛楅亾', description: '澶滄櫄琛楅亾', prompt: '澶滄櫄琛楅亾', mediaPaths: [], version: 1 },
          ],
          cards: [],
        }),
        save: vi.fn(),
      },
    });

    render(<CreationCanvas projectId="proj_abc" />);

    expect(await screen.findByText('瑙掕壊')).toBeInTheDocument();
    expect(screen.getByText('涓昏')).toBeInTheDocument();
    expect(screen.getByText('鍦烘櫙')).toBeInTheDocument();
    expect(screen.getByText('琛楅亾')).toBeInTheDocument();
  });
});
