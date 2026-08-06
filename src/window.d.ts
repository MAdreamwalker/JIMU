import type { ProjectAspectRatio, ProjectMetadata } from './domain/project';

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
    };
  }
}
