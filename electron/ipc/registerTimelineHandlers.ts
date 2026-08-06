import fs from 'node:fs/promises';
import path from 'node:path';
import { ipcMain } from 'electron';
import type { TimelineClip, TimelineDocument, TimelineExportInput, TimelineTrack, TimelineTrackKind } from '../../src/domain/timeline.js';
import { createProjectStore } from '../services/projectStore.js';
import { createTimelineExporter, type TimelineExporter } from '../services/timelineExport.js';

const trackKinds: readonly TimelineTrackKind[] = ['video', 'image', 'audio', 'subtitle', 'marker'];

export function registerTimelineHandlers(rootPath: string): void {
  const projectStore = createProjectStore(rootPath);
  const exportJobs = new Map<string, { exporter: TimelineExporter; sender: Electron.WebContents }>();

  ipcMain.handle('timeline:load', async (_event, projectId: unknown): Promise<TimelineDocument> => {
    const timelinePath = await getTimelinePath(projectStore, projectId);
    let parsed: unknown;

    try {
      parsed = JSON.parse(await fs.readFile(timelinePath, 'utf8')) as unknown;
    } catch {
      throw new Error('Invalid timeline document');
    }

    return validateTimelineDocument(parsed);
  });

  ipcMain.handle('timeline:save', async (_event, input: unknown): Promise<void> => {
    const { projectId, timeline } = validateTimelineSaveInput(input);
    const document = validateTimelineDocument(timeline);
    await fs.writeFile(await getTimelinePath(projectStore, projectId), JSON.stringify(document, null, 2), 'utf8');
  });

  ipcMain.handle('timeline:exportMp4', (event, input: unknown) => {
    const exporter = createTimelineExporter((progress) => {
      event.sender.send('timeline:exportProgress', progress);
    });

    return exporter.exportTimeline(validateTimelineExportInput(input)).then(({ jobId }) => {
      exportJobs.set(jobId, { exporter, sender: event.sender });
      return { jobId };
    });
  });

  ipcMain.handle('timeline:cancelExport', (event, jobId: unknown) => {
    if (!isNonEmptyString(jobId)) throw new Error('Invalid export job id');
    const job = exportJobs.get(jobId);
    if (!job || job.sender !== event.sender) return false;

    const cancelled = job.exporter.cancelExport(jobId);
    if (cancelled) exportJobs.delete(jobId);
    return cancelled;
  });
}

async function getTimelinePath(
  projectStore: ReturnType<typeof createProjectStore>,
  projectId: unknown,
): Promise<string> {
  if (!isNonEmptyString(projectId)) throw new Error('Invalid project id');
  return projectStore.getProjectFilePath(projectId, 'timeline.json');
}

export function validateTimelineDocument(value: unknown): TimelineDocument {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid timeline document');

  const { durationSeconds, tracks } = value as { durationSeconds?: unknown; tracks?: unknown };
  if (!Array.isArray(tracks) || (durationSeconds !== undefined && !isNonNegativeFiniteNumber(durationSeconds))) {
    throw new Error('Invalid timeline document');
  }

  return {
    durationSeconds: durationSeconds ?? 0,
    tracks: tracks.map(validateTimelineTrack),
  };
}

function validateTimelineTrack(value: unknown): TimelineTrack {
  if (!hasExactKeys(value, ['id', 'kind', 'name', 'clips'])
    || !isNonEmptyString(value.id)
    || !trackKinds.includes(value.kind as TimelineTrackKind)
    || typeof value.name !== 'string'
    || !Array.isArray(value.clips)) {
    throw new Error('Invalid timeline document');
  }

  return {
    id: value.id,
    kind: value.kind as TimelineTrackKind,
    name: value.name,
    clips: value.clips.map(validateTimelineClip),
  };
}

function validateTimelineClip(value: unknown): TimelineClip {
  const validKeys = ['id', 'sourcePath', 'startSeconds', 'durationSeconds', 'offsetSeconds', 'label'];
  if (!hasAllowedKeys(value, validKeys)
    || !isNonEmptyString(value.id)
    || !isSafeProjectRelativePath(value.sourcePath)
    || !isNonNegativeFiniteNumber(value.startSeconds)
    || !isPositiveFiniteNumber(value.durationSeconds)
    || !isNonNegativeFiniteNumber(value.offsetSeconds)
    || (Object.prototype.hasOwnProperty.call(value, 'label') && typeof value.label !== 'string')) {
    throw new Error('Invalid timeline document');
  }

  return {
    id: value.id,
    sourcePath: value.sourcePath,
    startSeconds: value.startSeconds,
    durationSeconds: value.durationSeconds,
    offsetSeconds: value.offsetSeconds,
    ...(Object.prototype.hasOwnProperty.call(value, 'label') ? { label: value.label as string } : {}),
  };
}

function validateTimelineSaveInput(input: unknown): { projectId: unknown; timeline: unknown } {
  if (!hasExactKeys(input, ['projectId', 'timeline'])) throw new Error('Invalid timeline save input');
  return { projectId: input.projectId, timeline: input.timeline };
}

function validateTimelineExportInput(input: unknown): TimelineExportInput {
  if (!hasExactKeys(input, ['projectId', 'outputPath', 'timeline'])
    || !isNonEmptyString(input.projectId)
    || !isSafeProjectRelativePath(input.outputPath)) {
    throw new Error('Invalid timeline export input');
  }

  return { projectId: input.projectId, outputPath: input.outputPath, timeline: validateTimelineDocument(input.timeline) };
}

function isSafeProjectRelativePath(value: unknown): value is string {
  return isNonEmptyString(value)
    && value === value.trim()
    && !value.includes('\\')
    && !path.posix.isAbsolute(value)
    && !path.win32.isAbsolute(value)
    && !/^[a-z][a-z0-9+.-]*:/i.test(value)
    && value.split('/').every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

function hasExactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function hasAllowedKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).every((key) => keys.includes(key));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return isNonNegativeFiniteNumber(value) && value > 0;
}
