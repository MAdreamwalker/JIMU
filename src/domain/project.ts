import { createId } from './ids.js';

export type ProjectAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | 'custom';
export type ProjectType = 'storyboard' | 'short-video' | 'animation' | 'mixed';

export interface ProjectMetadata {
  schemaVersion: 1;
  id: string;
  name: string;
  aspectRatio: ProjectAspectRatio;
  type: ProjectType;
  coverPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export function createEmptyProject(name: string, aspectRatio: ProjectAspectRatio): ProjectMetadata {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: createId('proj'),
    name,
    aspectRatio,
    type: 'storyboard',
    coverPath: null,
    createdAt: now,
    updatedAt: now,
  };
}
