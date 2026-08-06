import fs from 'node:fs/promises';
import path from 'node:path';
import type { TaskRecord } from '../../src/domain/tasks.js';

interface TaskDocument {
  tasks: TaskRecord[];
}

const secretPatterns = [
  /\bsk-[a-zA-Z0-9_-]+\b/g,
  /\bBearer\s+[a-zA-Z0-9._~+/-]+=*\b/gi,
  /\b(?:api[-_]?key|x-api-key|access[-_]?token|token)\s*[=:]\s*(?:"[^"]*"|'[^']*'|[^\s&,;]+)/gi,
];

function redact(text: string): string {
  return secretPatterns.reduce((value, pattern) => value.replace(pattern, '[redacted]'), text);
}

export async function appendTask(projectDir: string, task: TaskRecord): Promise<TaskRecord> {
  const safeTask: TaskRecord = {
    ...task,
    inputSummary: redact(task.inputSummary),
    outputSummary: redact(task.outputSummary),
  };
  const filePath = path.join(projectDir, 'tasks.json');
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
