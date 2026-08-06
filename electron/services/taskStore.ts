import fs from 'node:fs/promises';
import path from 'node:path';
import type { TaskRecord } from '../../src/domain/tasks.js';
import { assertRealPathInsideAllowedRoots } from './pathPolicy.js';

interface TaskDocument {
  tasks: TaskRecord[];
}

const taskCategories: readonly TaskRecord['category'][] = ['text', 'image', 'video', 'batch', 'media-analysis', 'download', 'export', 'pipeline'];
const taskStatuses: readonly TaskRecord['status'][] = ['queued', 'running', 'succeeded', 'partially-succeeded', 'failed', 'cancelled'];

function redact(text: string): string {
  return text
    .replace(/\bsk-[a-zA-Z0-9_-]+\b/g, '[redacted]')
    .replace(/\bBearer\s+[a-zA-Z0-9._~+/-]+=*\b/gi, 'Bearer [redacted]')
    .replace(
      /((?:["']?(?:api[-_]?key|x-api-key|access[-_]?token|token)["']?)\s*[=:]\s*)(?:"[^"]*"|'[^']*'|[^\s&,;]+)/gi,
      '$1[redacted]',
    );
}

export async function appendTask(
  projectDir: string,
  task: TaskRecord,
  allowedRoot = projectDir,
): Promise<TaskRecord> {
  const safeProjectDir = await assertRealPathInsideAllowedRoots(projectDir, [allowedRoot]);
  const filePath = await assertRealPathInsideAllowedRoots(path.join(safeProjectDir, 'tasks.json'), [safeProjectDir]);
  const safeTask: TaskRecord = {
    ...task,
    inputSummary: redact(task.inputSummary),
    outputSummary: redact(task.outputSummary),
  };
  let existing: TaskDocument = { tasks: [] };

  try {
    existing = validateTaskDocument(JSON.parse(await fs.readFile(filePath, 'utf8')) as unknown);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  existing.tasks.push(safeTask);
  await fs.writeFile(filePath, JSON.stringify(existing, null, 2), 'utf8');
  return safeTask;
}

export async function listTasks(projectDir: string, allowedRoot = projectDir): Promise<TaskRecord[]> {
  const safeProjectDir = await assertRealPathInsideAllowedRoots(projectDir, [allowedRoot]);
  const filePath = await assertRealPathInsideAllowedRoots(path.join(safeProjectDir, 'tasks.json'), [safeProjectDir]);

  try {
    return validateTaskDocument(JSON.parse(await fs.readFile(filePath, 'utf8')) as unknown).tasks;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export async function updateTaskStatus(
  projectDir: string,
  taskId: string,
  status: TaskRecord['status'],
  allowedRoot = projectDir,
): Promise<TaskRecord | null> {
  if (!isNonEmptyString(taskId) || !taskStatuses.includes(status)) throw new Error('Invalid task update');
  const safeProjectDir = await assertRealPathInsideAllowedRoots(projectDir, [allowedRoot]);
  const filePath = await assertRealPathInsideAllowedRoots(path.join(safeProjectDir, 'tasks.json'), [safeProjectDir]);
  const document = validateTaskDocument(JSON.parse(await fs.readFile(filePath, 'utf8')) as unknown);
  const task = document.tasks.find((item) => item.id === taskId);
  if (!task) return null;

  const updatedTask: TaskRecord = {
    ...task,
    status,
    ...(status === 'queued' || status === 'cancelled' ? { errorCategory: undefined } : {}),
    updatedAt: new Date().toISOString(),
  };
  document.tasks = document.tasks.map((item) => (item.id === taskId ? updatedTask : item));
  await fs.writeFile(filePath, JSON.stringify(document, null, 2), 'utf8');
  return updatedTask;
}

function validateTaskDocument(value: unknown): TaskDocument {
  if (!hasExactKeys(value, ['tasks']) || !Array.isArray(value.tasks)) {
    throw new Error('Invalid task document');
  }

  return { tasks: value.tasks.map(validateTaskRecord) };
}

function validateTaskRecord(value: unknown): TaskRecord {
  if (!hasAllowedKeys(value, [
    'id',
    'category',
    'status',
    'providerId',
    'inputSummary',
    'outputSummary',
    'errorCategory',
    'createdAt',
    'updatedAt',
  ])
    || !isNonEmptyString(value.id)
    || !taskCategories.includes(value.category as TaskRecord['category'])
    || !taskStatuses.includes(value.status as TaskRecord['status'])
    || !isNonEmptyString(value.providerId)
    || typeof value.inputSummary !== 'string'
    || typeof value.outputSummary !== 'string'
    || (Object.hasOwn(value, 'errorCategory') && typeof value.errorCategory !== 'string')
    || !isNonEmptyString(value.createdAt)
    || !isNonEmptyString(value.updatedAt)) {
    throw new Error('Invalid task document');
  }

  return {
    id: value.id,
    category: value.category as TaskRecord['category'],
    status: value.status as TaskRecord['status'],
    providerId: value.providerId,
    inputSummary: value.inputSummary,
    outputSummary: value.outputSummary,
    ...(Object.hasOwn(value, 'errorCategory') ? { errorCategory: value.errorCategory as string } : {}),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
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
