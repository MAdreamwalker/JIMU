import fs from 'node:fs/promises';
import path from 'node:path';

export function assertInsideAllowedRoots(targetPath: string, allowedRoots: string[]): string {
  const resolvedTarget = path.resolve(targetPath);
  const allowed = allowedRoots.some((root) => {
    const resolvedRoot = path.resolve(root);
    const relative = path.relative(resolvedRoot, resolvedTarget);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  });

  if (!allowed) {
    throw new Error('Path is outside authorized roots');
  }

  return resolvedTarget;
}

export async function assertRealPathInsideAllowedRoots(targetPath: string, allowedRoots: string[]): Promise<string> {
  const resolvedTarget = assertInsideAllowedRoots(targetPath, allowedRoots);
  const resolvedRoots = await Promise.all(allowedRoots.map((root) => fs.realpath(root)));
  await rejectSymlinkPathComponents(resolvedTarget, allowedRoots);
  const resolvedExistingTarget = await resolveExistingPath(resolvedTarget);

  const allowed = resolvedRoots.some((root) => isInsideRoot(resolvedExistingTarget, root));
  if (!allowed) {
    throw new Error('Path resolves outside authorized roots');
  }

  return resolvedTarget;
}

async function rejectSymlinkPathComponents(targetPath: string, allowedRoots: string[]): Promise<void> {
  const resolvedTarget = path.resolve(targetPath);
  const root = allowedRoots
    .map((allowedRoot) => path.resolve(allowedRoot))
    .filter((allowedRoot) => isInsideRoot(resolvedTarget, allowedRoot))
    .sort((left, right) => right.length - left.length)[0];
  if (!root) throw new Error('Path is outside authorized roots');

  const relativeParts = path.relative(root, resolvedTarget).split(path.sep).filter(Boolean);
  let candidate = root;
  for (const part of relativeParts) {
    candidate = path.join(candidate, part);
    try {
      const stats = await fs.lstat(candidate);
      if (stats.isSymbolicLink()) {
        throw new Error('Path resolves outside authorized roots');
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error;
    }
  }
}

async function resolveExistingPath(targetPath: string): Promise<string> {
  let candidate = targetPath;

  while (true) {
    try {
      return await fs.realpath(candidate);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }

      const parent = path.dirname(candidate);
      if (parent === candidate) {
        throw error;
      }
      candidate = parent;
    }
  }
}

function isInsideRoot(targetPath: string, rootPath: string): boolean {
  const relative = path.relative(rootPath, targetPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}
