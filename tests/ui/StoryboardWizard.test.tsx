import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StoryboardWizard } from '../../src/pages/StoryboardWizard';

describe('StoryboardWizard', () => {
  it('shows every pipeline stage', async () => {
    vi.stubGlobal('threecut', {
      pipeline: { load: vi.fn().mockResolvedValue({ stages: {} }), save: vi.fn() },
    });

    render(<StoryboardWizard projectId="proj_abc" />);

    expect(await screen.findByText('文案导入')).toBeInTheDocument();
    expect(screen.getByText('章节划分')).toBeInTheDocument();
    expect(screen.getByText('视频生成')).toBeInTheDocument();
  });
});
