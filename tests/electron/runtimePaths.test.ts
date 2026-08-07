import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveRendererUrl } from '../../electron/services/runtimePaths';

describe('runtime paths', () => {
  it('resolves the built renderer from compiled Electron output', () => {
    const electronDir = path.join(process.cwd(), 'dist-electron', 'electron');

    expect(resolveRendererUrl(electronDir)).toBe(
      `file://${path.join(process.cwd(), 'dist', 'index.html')}`,
    );
  });

  it('prefers the Vite dev server URL when present', () => {
    expect(resolveRendererUrl('ignored', 'http://127.0.0.1:5173/')).toBe('http://127.0.0.1:5173/');
  });
});
