import fs from 'node:fs/promises';
import { ipcMain } from 'electron';
import type { PipelineDocument, PipelineStageKey, PipelineStageState, PipelineStatus } from '../../src/domain/pipeline.js';
import { createProjectStore } from '../services/projectStore.js';

const stageKeys: readonly PipelineStageKey[] = [
  'source',
  'chapterSplit',
  'assetExtract',
  'scriptGenerate',
  'shotPlan',
  'storyboardPrompt',
  'imageGenerate',
  'videoPrompt',
  'videoGenerate',
  'timelineBackfill',
];
const statuses: readonly PipelineStatus[] = ['idle', 'queued', 'running', 'succeeded', 'failed', 'cancelled'];
const maxSummaryLength = 4_000;

export function registerPipelineHandlers(rootPath: string): void {
  const store = createProjectStore(rootPath);

  ipcMain.handle('pipeline:load', async (_event, projectId: string): Promise<PipelineDocument> => {
    const pipelinePath = await store.getProjectFilePath(projectId, 'pipeline.json');
    let parsed: unknown;
    try {
      parsed = JSON.parse(await fs.readFile(pipelinePath, 'utf8')) as unknown;
    } catch {
      throw new Error('Invalid pipeline document');
    }
    return validatePipelineDocument(parsed);
  });

  ipcMain.handle('pipeline:save', async (_event, projectId: unknown, pipeline: unknown): Promise<void> => {
    if (!isNonEmptyString(projectId)) throw new Error('Invalid project id');
    const document = validatePipelineDocument(pipeline);
    const pipelinePath = await store.getProjectFilePath(projectId, 'pipeline.json');
    await fs.writeFile(pipelinePath, JSON.stringify(document, null, 2), 'utf8');
  });
}

export function validatePipelineDocument(value: unknown): PipelineDocument {
  if (!hasExactKeys(value, ['stages']) || !value.stages || typeof value.stages !== 'object' || Array.isArray(value.stages)) {
    throw new Error('Invalid pipeline document');
  }

  const stages: Partial<Record<PipelineStageKey, PipelineStageState>> = {};
  for (const [key, stage] of Object.entries(value.stages)) {
    if (!stageKeys.includes(key as PipelineStageKey)) throw new Error('Invalid pipeline document');
    stages[key as PipelineStageKey] = validatePipelineStage(stage);
  }

  return { stages };
}

function validatePipelineStage(value: unknown): PipelineStageState {
  if (!hasAllowedKeys(value, ['status', 'inputSummary', 'outputSummary', 'errorMessage', 'updatedAt'])
    || !statuses.includes(value.status as PipelineStatus)
    || !isOptionalBoundedString(value.inputSummary)
    || !isOptionalBoundedString(value.outputSummary)
    || !isOptionalBoundedString(value.errorMessage)
    || !isOptionalBoundedString(value.updatedAt)) {
    throw new Error('Invalid pipeline document');
  }

  return {
    status: value.status as PipelineStatus,
    ...(value.inputSummary !== undefined ? { inputSummary: value.inputSummary as string } : {}),
    ...(value.outputSummary !== undefined ? { outputSummary: value.outputSummary as string } : {}),
    ...(value.errorMessage !== undefined ? { errorMessage: value.errorMessage as string } : {}),
    ...(value.updatedAt !== undefined ? { updatedAt: value.updatedAt as string } : {}),
  };
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

function isOptionalBoundedString(value: unknown): boolean {
  return value === undefined || (typeof value === 'string' && value.length <= maxSummaryLength);
}
