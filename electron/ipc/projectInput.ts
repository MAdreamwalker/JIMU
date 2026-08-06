import type { ProjectAspectRatio } from '../../src/domain/project.js';

const projectAspectRatios = ['16:9', '9:16', '1:1', '4:3', 'custom'] as const;

export function validateCreateProjectInput(input: unknown): { name: string; aspectRatio: ProjectAspectRatio } {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Project input must be an object');
  }

  const candidate = input as Record<string, unknown>;
  if (typeof candidate.name !== 'string') {
    throw new Error('Project name must be a string');
  }

  if (!projectAspectRatios.includes(candidate.aspectRatio as ProjectAspectRatio)) {
    throw new Error('Project aspect ratio is invalid');
  }

  return { name: candidate.name, aspectRatio: candidate.aspectRatio as ProjectAspectRatio };
}
