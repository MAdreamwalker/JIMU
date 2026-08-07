import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
) as {
  main: string;
  scripts: { build: string };
};
const viteConfig = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');

describe('Electron build contract', () => {
  it('builds the main and preload entrypoints where Electron expects them', () => {
    expect(packageJson.main).toBe('dist-electron/main.js');
    expect(packageJson.scripts.build).toContain('tsc -p tsconfig.electron.json');
    expect(packageJson.scripts.build).toContain('vite build');
  });

  it('uses relative renderer asset paths for the packaged file protocol app', () => {
    expect(viteConfig).toContain("base: './'");
  });
});
