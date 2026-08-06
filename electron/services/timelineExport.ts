import { randomUUID } from 'node:crypto';
import type { TimelineExportInput } from '../../src/domain/timeline.js';

export type TimelineExportProgress = {
  jobId: string;
  status: 'queued' | 'cancelled';
  progress: number;
};

export interface TimelineExporter {
  exportTimeline(input: TimelineExportInput): Promise<{ jobId: string }>;
  cancelExport(jobId: string): boolean;
}

export function createTimelineExporter(
  onProgress: (progress: TimelineExportProgress) => void = () => undefined,
): TimelineExporter {
  const jobs = new Set<string>();

  return {
    async exportTimeline(_input) {
      const jobId = `export_${randomUUID()}`;
      jobs.add(jobId);
      onProgress({ jobId, status: 'queued', progress: 0 });
      return { jobId };
    },
    cancelExport(jobId) {
      if (!jobs.delete(jobId)) return false;

      onProgress({ jobId, status: 'cancelled', progress: 0 });
      return true;
    },
  };
}

const defaultExporter = createTimelineExporter();

export function exportTimeline(input: TimelineExportInput): Promise<{ jobId: string }> {
  return defaultExporter.exportTimeline(input);
}
