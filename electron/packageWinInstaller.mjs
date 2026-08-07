import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const electronDist = path.join(root, 'node_modules', '.pnpm', 'electron@33.4.11', 'node_modules', 'electron', 'dist');
const outputDir = path.join(root, 'release');
const unpackedDir = path.join(outputDir, 'win-unpacked');
const appDir = path.join(unpackedDir, 'resources', 'app');
const isDirOnly = process.argv.includes('--dir');

await assertDirectory(electronDist, 'Electron runtime is missing. Run pnpm install before packaging.');
await assertDirectory(path.join(root, 'dist'), 'Renderer build is missing. Run pnpm build before packaging.');
await assertDirectory(path.join(root, 'dist-electron'), 'Electron build is missing. Run pnpm build before packaging.');

await fs.rm(unpackedDir, { recursive: true, force: true });
await fs.rm(`${unpackedDir}.tmp`, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
await fs.cp(electronDist, unpackedDir, { recursive: true });
await fs.rm(path.join(unpackedDir, 'resources', 'default_app.asar'), { force: true });
await fs.mkdir(appDir, { recursive: true });
await fs.cp(path.join(root, 'dist'), path.join(appDir, 'dist'), { recursive: true });
await fs.cp(path.join(root, 'dist-electron'), path.join(appDir, 'dist-electron'), { recursive: true });
await fs.writeFile(
  path.join(appDir, 'package.json'),
  JSON.stringify({
    name: packageJson.name,
    version: packageJson.version,
    productName: packageJson.build?.productName ?? 'JIMU',
    type: packageJson.type,
    main: packageJson.main,
  }, null, 2),
  'utf8',
);

const electronExe = path.join(unpackedDir, 'electron.exe');
const appExe = path.join(unpackedDir, 'JIMU.exe');
await fs.rm(appExe, { force: true });
await fs.rename(electronExe, appExe);

if (isDirOnly) {
  console.log(`Windows app directory created at ${unpackedDir}`);
} else {
  const electronBuilder = path.join(root, 'node_modules', 'electron-builder', 'cli.js');
  const env = {
    ...process.env,
    ELECTRON_BUILDER_BINARIES_MIRROR: process.env.ELECTRON_BUILDER_BINARIES_MIRROR
      ?? 'https://npmmirror.com/mirrors/electron-builder-binaries/',
  };
  const result = spawnSync(process.execPath, [
    electronBuilder,
    '--win',
    'nsis',
    '--x64',
    '--prepackaged',
    unpackedDir,
  ], {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(result.error?.message ?? `electron-builder failed with exit code ${result.status}`);
  }
}

async function assertDirectory(directory, message) {
  try {
    const stats = await fs.stat(directory);
    if (!stats.isDirectory()) throw new Error(message);
  } catch {
    throw new Error(message);
  }
}
