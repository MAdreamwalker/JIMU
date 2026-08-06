import { describe, expect, it } from 'vitest';
import { createId } from '../../src/domain/ids';
import { createEmptyProject } from '../../src/domain/project';

describe('domain helpers', () => {
  it('creates prefixed ids', () => {
    expect(createId('proj')).toMatch(/^proj_[a-z0-9]{12}$/);
  });

  it('creates a project metadata object', () => {
    const project = createEmptyProject('Demo', '16:9');

    expect(project.name).toBe('Demo');
    expect(project.aspectRatio).toBe('16:9');
    expect(project.schemaVersion).toBe(1);
    expect(project.id).toMatch(/^proj_/);
  });
});
