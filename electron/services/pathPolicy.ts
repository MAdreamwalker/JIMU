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
