import path from 'node:path';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import { assertInsideAllowedRoots, assertRealPathInsideAllowedRoots } from '../../electron/services/pathPolicy';

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

  it('blocks dangling symlinks before writes can follow them outside the root', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jimu-path-root-'));
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'jimu-path-outside-'));
    const linkPath = path.join(root, 'tasks.json');
    const outsideTarget = path.join(outside, 'future-tasks.json');

    try {
      await fs.symlink(outsideTarget, linkPath, 'file');
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'EPERM' || code === 'EACCES') return;
      throw error;
    }

    await expect(assertRealPathInsideAllowedRoots(linkPath, [root]))
      .rejects.toThrow('Path resolves outside authorized roots');
  });
});
