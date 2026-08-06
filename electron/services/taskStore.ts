import fs from 'node:fs/promises';
import path from 'node:path';
import type { TaskRecord } from '../../src/domain/tasks.js';
import { assertRealPathInsideAllowedRoots } from './pathPolicy.js';

interface TaskDocument {
  tasks: TaskRecord[];
}

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
  allowedRoot: string,
  task: TaskRecord,
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
    existing = JSON.parse(await fs.readFile(filePath, 'utf8')) as TaskDocument;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  existing.tasks.push(safeTask);
  await fs.writeFile(filePath, JSON.stringify(existing, null, 2), 'utf8');
  return safeTask;
}
