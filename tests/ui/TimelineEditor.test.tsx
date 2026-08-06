import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TimelineEditor } from '../../src/pages/TimelineEditor';

describe('TimelineEditor', () => {
  it('renders core tracks and export action', async () => {
    vi.stubGlobal('threecut', {
      timeline: {
        load: vi.fn().mockResolvedValue({ durationSeconds: 0, tracks: [] }),
        save: vi.fn(),
        exportMp4: vi.fn(),
        cancelExport: vi.fn(),
        onExportProgress: vi.fn().mockReturnValue(() => undefined),
      },
    });

    render(<TimelineEditor projectId="proj_abc" />);

    expect(await screen.findByText('\u89c6\u9891\u8f68')).toBeInTheDocument();
    expect(screen.getByText('\u97f3\u9891\u8f68')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '\u5bfc\u51fa MP4' })).toBeInTheDocument();
  });
});
