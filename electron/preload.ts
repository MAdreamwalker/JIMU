import { contextBridge, ipcRenderer } from 'electron';
import type { PipelineDocument } from '../src/domain/pipeline.js';
import type { CanvasDocument } from '../src/domain/canvas.js';
import type { DirectorDocument } from '../src/domain/director.js';
import type { ProjectAspectRatio, ProjectMetadata } from '../src/domain/project.js';
import type { TimelineDocument, TimelineExportInput } from '../src/domain/timeline.js';
import type { MediaAnalysis } from './services/mediaAnalysis.js';
import type { TimelineExportProgress } from './services/timelineExport.js';
import type { AppConfig } from './services/configStore.js';
import type { SkillDefinition } from './ipc/registerPromptSkillHandlers.js';

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
  canvas: {
    load: (projectId: string) => ipcRenderer.invoke('canvas:load', projectId) as Promise<CanvasDocument>,
    save: (projectId: string, canvas: CanvasDocument) => (
      ipcRenderer.invoke('canvas:save', { projectId, canvas }) as Promise<void>
    ),
  },
  director: {
    load: (projectId: string) => ipcRenderer.invoke('director:load', projectId) as Promise<DirectorDocument>,
    save: (projectId: string, director: DirectorDocument) => (
      ipcRenderer.invoke('director:save', { projectId, director }) as Promise<void>
    ),
  },
  timeline: {
    load: (projectId: string) => ipcRenderer.invoke('timeline:load', projectId) as Promise<TimelineDocument>,
    save: (projectId: string, timeline: TimelineDocument) => (
      ipcRenderer.invoke('timeline:save', { projectId, timeline }) as Promise<void>
    ),
    exportMp4: (input: TimelineExportInput) => (
      ipcRenderer.invoke('timeline:exportMp4', input) as Promise<{ jobId: string }>
    ),
    cancelExport: (jobId: string) => ipcRenderer.invoke('timeline:cancelExport', jobId) as Promise<boolean>,
    onExportProgress: (callback: (progress: TimelineExportProgress) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, progress: TimelineExportProgress) => callback(progress);
      ipcRenderer.on('timeline:exportProgress', listener);
      return () => ipcRenderer.removeListener('timeline:exportProgress', listener);
    },
  },
  media: {
    analyze: (projectId: string, mediaPath: string) => (
      ipcRenderer.invoke('media:analyze', { projectId, mediaPath }) as Promise<MediaAnalysis>
    ),
  },
  config: {
    getAll: () => ipcRenderer.invoke('config:getAll') as Promise<AppConfig>,
    save: (config: AppConfig) => ipcRenderer.invoke('config:save', config) as Promise<void>,
  },
  storyboardPrompts: {
    read: () => ipcRenderer.invoke('storyboardPrompts:read') as Promise<Record<string, string>>,
    save: (prompts: Record<string, string>) => (
      ipcRenderer.invoke('storyboardPrompts:save', prompts) as Promise<void>
    ),
  },
  skills: {
    list: () => ipcRenderer.invoke('skills:list') as Promise<SkillDefinition[]>,
    save: (skills: SkillDefinition[]) => ipcRenderer.invoke('skills:save', skills) as Promise<void>,
  },
  projectPackage: {
    export: (projectId: string, destinationPath: string) => (
      ipcRenderer.invoke('project:export', { projectId, destinationPath }) as Promise<string>
    ),
    import: (packagePath: string) => (
      ipcRenderer.invoke('project:import', { packagePath }) as Promise<ProjectMetadata>
    ),
  },
});
