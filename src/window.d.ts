import type { ProjectAspectRatio, ProjectMetadata } from './domain/project';
import type { PipelineDocument } from './domain/pipeline';
import type { CanvasDocument } from './domain/canvas';

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
    };
  }
}
