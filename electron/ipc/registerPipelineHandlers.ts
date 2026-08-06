import fs from 'node:fs/promises';
import { ipcMain } from 'electron';
import type { PipelineDocument } from '../../src/domain/pipeline.js';
import { createProjectStore } from '../services/projectStore.js';

export function registerPipelineHandlers(rootPath: string): void {
  const store = createProjectStore(rootPath);

  ipcMain.handle('pipeline:load', async (_event, projectId: string): Promise<PipelineDocument> => {
    const pipelinePath = await store.getProjectFilePath(projectId, 'pipeline.json');
    return JSON.parse(await fs.readFile(pipelinePath, 'utf8')) as PipelineDocument;
  });

  ipcMain.handle('pipeline:save', async (_event, projectId: string, pipeline: PipelineDocument): Promise<void> => {
    const pipelinePath = await store.getProjectFilePath(projectId, 'pipeline.json');
    await fs.writeFile(pipelinePath, JSON.stringify(pipeline, null, 2), 'utf8');
  });
}
