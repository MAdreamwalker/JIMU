import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertInsideAllowedRoots } from '../../electron/services/pathPolicy';

describe('path policy', () => {
  it('allows paths inside an authorized root', () => {
    const root = path.resolve('tmp/project-root');
    const target = path.join(root, 'Project/media/image.png');

    expect(assertInsideAllowedRoots(target, [root])).toBe(path.resolve(target));
  });

  it('blocks path traversal outside authorized roots', () => {
    const root = path.resolve('tmp/project-root');
    const target = path.resolve('tmp/other-root/secret.txt');

    expect(() => assertInsideAllowedRoots(target, [root])).toThrow('Path is outside authorized roots');
  });
});
