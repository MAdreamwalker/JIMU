import type { ProjectAspectRatio, ProjectMetadata } from './domain/project';
import type { PipelineDocument } from './domain/pipeline';
import type { CanvasDocument } from './domain/canvas';
import type { DirectorDocument } from './domain/director';
import type { AppConfig } from '../electron/services/configStore';
import type { SkillDefinition } from '../electron/ipc/registerPromptSkillHandlers';

export {};

declare global {
  interface Window {
    threecut: {
      app: {
        getUserDataPath: () => Promise<string>;
      };
      registry: {
        list: () => Promise<ProjectMetadata[]>;
        create: (input: { name: string; aspectRatio: ProjectAspectRatio }) => Promise<ProjectMetadata>;
        get: (projectId: string) => Promise<ProjectMetadata>;
      };
      pipeline: {
        load: (projectId: string) => Promise<PipelineDocument>;
        save: (projectId: string, pipeline: PipelineDocument) => Promise<void>;
      };
      canvas: {
        load: (projectId: string) => Promise<CanvasDocument>;
        save: (projectId: string, canvas: CanvasDocument) => Promise<void>;
      };
      director: {
        load: (projectId: string) => Promise<DirectorDocument>;
        save: (projectId: string, director: DirectorDocument) => Promise<void>;
      };
      config: {
        getAll: () => Promise<AppConfig>;
        save: (config: AppConfig) => Promise<void>;
      };
      storyboardPrompts: {
        read: () => Promise<Record<string, string>>;
        save: (prompts: Record<string, string>) => Promise<void>;
      };
      skills: {
        list: () => Promise<SkillDefinition[]>;
        save: (skills: SkillDefinition[]) => Promise<void>;
      };
    };
  }
}
