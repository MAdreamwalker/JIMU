import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StoryboardWizard } from '../../src/pages/StoryboardWizard';

describe('StoryboardWizard', () => {
  it('shows every pipeline stage', async () => {
    vi.stubGlobal('threecut', {
      pipeline: { load: vi.fn().mockResolvedValue({ stages: {} }), save: vi.fn() },
    });

    render(<StoryboardWizard projectId="proj_abc" />);

    await screen.findByText('文案导入');

    expect(screen.getAllByRole('button')).toHaveLength(10);
    expect(screen.getByText('章节划分')).toBeInTheDocument();
    expect(screen.getByText('资产提取')).toBeInTheDocument();
    expect(screen.getByText('剧本生成')).toBeInTheDocument();
    expect(screen.getByText('镜头规划')).toBeInTheDocument();
    expect(screen.getByText('分镜提示词')).toBeInTheDocument();
    expect(screen.getByText('图片生成')).toBeInTheDocument();
    expect(screen.getByText('视频提示词')).toBeInTheDocument();
    expect(screen.getByText('视频生成')).toBeInTheDocument();
    expect(screen.getByText('回填时间线')).toBeInTheDocument();
  });
});
