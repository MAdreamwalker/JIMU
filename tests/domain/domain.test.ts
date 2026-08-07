import { afterEach, describe, expect, it, vi } from 'vitest';
import { createId } from '../../src/domain/ids';
import { createEmptyProject } from '../../src/domain/project';

describe('domain helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates prefixed ids', () => {
    expect(createId('proj')).toMatch(/^proj_[a-z0-9]{12}$/);
  });

  it('uses random values for all twelve suffix characters', () => {
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((array) => {
      const bytes = array as Uint8Array;
      for (let index = 0; index < bytes.length; index += 1) bytes[index] = index;
      return array;
    });

    expect(createId('proj')).toBe('proj_0123456789ab');
  });

  it('creates a project metadata object', () => {
    const project = createEmptyProject('Demo', '16:9');

    expect(project.name).toBe('Demo');
    expect(project.aspectRatio).toBe('16:9');
    expect(project.schemaVersion).toBe(1);
    expect(project.id).toMatch(/^proj_/);
  });
});
