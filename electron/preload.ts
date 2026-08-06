import { contextBridge, ipcRenderer } from 'electron';
import type { PipelineDocument } from '../src/domain/pipeline.js';
import type { ProjectAspectRatio, ProjectMetadata } from '../src/domain/project.js';

contextBridge.exposeInMainWorld('threecut', {
  app: {
    getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath') as Promise<string>,
  },
  registry: {
    list: () => ipcRenderer.invoke('registry:list') as Promise<ProjectMetadata[]>,
    create: (input: { name: string; aspectRatio: ProjectAspectRatio }) => (
      ipcRenderer.invoke('registry:create', input) as Promise<ProjectMetadata>
    ),
    get: (projectId: string) => ipcRenderer.invoke('registry:get', projectId) as Promise<ProjectMetadata>,
  },
  pipeline: {
    load: (projectId: string) => ipcRenderer.invoke('pipeline:load', projectId) as Promise<PipelineDocument>,
    save: (projectId: string, pipeline: PipelineDocument) => (
      ipcRenderer.invoke('pipeline:save', projectId, pipeline) as Promise<void>
    ),
  },
});
