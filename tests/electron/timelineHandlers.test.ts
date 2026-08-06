import { beforeEach, describe, expect, it, vi } from 'vitest';

const handlers = vi.hoisted(() => new Map<string, (...args: any[]) => unknown>());
const otherSender = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: any[]) => unknown) => handlers.set(channel, handler),
  },
}));

import { registerTimelineHandlers } from '../../electron/ipc/registerTimelineHandlers';

describe('timeline IPC handlers', () => {
  beforeEach(() => {
    handlers.clear();
    otherSender.send.mockReset();
  });

  it('sends export progress only to the requesting renderer and supports cancellation', async () => {
    const sender = { send: vi.fn() };
    registerTimelineHandlers('tmp/timeline-handler-root');

    const result = await handlers.get('timeline:exportMp4')!({ sender }, validExportInput());
    const jobId = (result as { jobId: string }).jobId;

    expect(sender.send).toHaveBeenCalledWith('timeline:exportProgress', {
      jobId,
      status: 'queued',
      progress: 0,
    });
    expect(otherSender.send).not.toHaveBeenCalled();

    expect(handlers.get('timeline:cancelExport')!({ sender }, jobId)).toBe(true);
    expect(sender.send).toHaveBeenLastCalledWith('timeline:exportProgress', {
      jobId,
      status: 'cancelled',
      progress: 0,
    });
  });
});

function validExportInput() {
  return {
    projectId: 'proj_abc',
    outputPath: 'exports/timeline.mp4',
    timeline: { durationSeconds: 0, tracks: [] },
  };
}
