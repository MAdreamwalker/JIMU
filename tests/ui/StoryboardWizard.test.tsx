import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StoryboardWizard } from '../../src/pages/StoryboardWizard';

describe('StoryboardWizard', () => {
  it('shows every pipeline stage', async () => {
    vi.stubGlobal('jimu', {
      pipeline: { load: vi.fn().mockResolvedValue({ stages: {} }), save: vi.fn() },
    });

    render(<StoryboardWizard projectId="proj_abc" />);

    await screen.findByText('Source Import');

    expect(screen.getAllByRole('button')).toHaveLength(10);
    expect(screen.getByText('Chapter Split')).toBeInTheDocument();
    expect(screen.getByText('Asset Extract')).toBeInTheDocument();
    expect(screen.getByText('Script Generate')).toBeInTheDocument();
    expect(screen.getByText('Shot Plan')).toBeInTheDocument();
    expect(screen.getByText('Storyboard Prompt')).toBeInTheDocument();
    expect(screen.getByText('Image Generate')).toBeInTheDocument();
    expect(screen.getByText('Video Prompt')).toBeInTheDocument();
    expect(screen.getByText('Video Generate')).toBeInTheDocument();
    expect(screen.getByText('Timeline Backfill')).toBeInTheDocument();
  });
});
