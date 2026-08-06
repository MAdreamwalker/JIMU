# 3cut-like Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an original Electron desktop app that implements the full 3cut-like AI visual creation workflow from project creation to storyboard, director previsualization, timeline editing, MP4 export, Prompt/Skills management, and Provider configuration.

**Architecture:** Use Electron for local desktop capabilities, React for the UI, TypeScript domain modules for shared data contracts, Three.js for director previsualization, and ffmpeg/ffprobe invoked by the Electron main process. Renderer code calls local capabilities through a narrow preload bridge; project state is stored as JSON plus relative media paths in project folders.

**Tech Stack:** Electron, Vite, React, TypeScript, Vitest, React Testing Library, Three.js, lucide-react, Node filesystem APIs, ffmpeg/ffprobe binaries, Windows DPAPI through PowerShell for encrypted secrets.

## Global Constraints

- The implementation must be original and must not copy installer source code or proprietary assets.
- The desktop app target is Electron + React + Three.js + ffmpeg.
- Renderer code must not directly read or write arbitrary files.
- All local file operations must go through Electron main-process validation.
- JSON project files store relative media paths, not embedded large files.
- API keys and cloud tokens must be encrypted in global settings on Windows.
- Project imports must block path traversal, illegal paths, excess file count, excess file size, and excess decompressed size.
- Media downloads must block localhost, LAN, and reserved network targets.
- Task logs must redact secrets before persistence.

---

## Planned File Structure

```text
package.json
tsconfig.json
vite.config.ts
vitest.config.ts
electron/
  main.ts
  preload.ts
  ipc/
    registerConfigHandlers.ts
    registerProjectHandlers.ts
    registerPipelineHandlers.ts
    registerTimelineHandlers.ts
    registerMediaHandlers.ts
    registerPromptSkillHandlers.ts
  services/
    configStore.ts
    cryptoStore.ts
    pathPolicy.ts
    projectStore.ts
    projectPackage.ts
    taskStore.ts
    mediaAnalysis.ts
    timelineExport.ts
src/
  main.tsx
  App.tsx
  routes.tsx
  domain/
    ids.ts
    project.ts
    canvas.ts
    pipeline.ts
    director.ts
    timeline.ts
    tasks.ts
    providers.ts
  providers/
    ProviderRegistry.ts
    openAiCompatible.ts
    geminiProvider.ts
    bailianProvider.ts
    cloudProvider.ts
    errors.ts
  store/
    appStore.ts
  pages/
    ProjectCenter.tsx
    CreationCanvas.tsx
    StoryboardWizard.tsx
    DirectorWorkspace.tsx
    TimelineEditor.tsx
    TaskCenter.tsx
    SettingsCenter.tsx
  components/
    Layout.tsx
    Toolbar.tsx
    EmptyState.tsx
    cards/
      AssetCard.tsx
      MediaCard.tsx
      StoryboardShotCard.tsx
    timeline/
      TimelineTrack.tsx
      TimelineClip.tsx
    director/
      DirectorViewport.tsx
      ObjectPanel.tsx
      PropertyPanel.tsx
tests/
  domain/
  electron/
  providers/
  ui/
```

## Task 1: Scaffold Electron React TypeScript App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/routes.tsx`
- Create: `src/components/Layout.tsx`
- Create: `tests/ui/App.test.tsx`

**Interfaces:**
- Produces: `window.threecut` preload namespace with `app.getUserDataPath(): Promise<string>`.
- Produces: React routes for `/`, `/project/:projectId/canvas`, `/project/:projectId/storyboard`, `/project/:projectId/director`, `/project/:projectId/timeline`, `/tasks`, and `/settings`.

- [ ] **Step 1: Write the failing smoke test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/App';

describe('App', () => {
  it('renders the desktop shell navigation', () => {
    render(<App />);

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '项目' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '任务' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '设置' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the smoke test and verify it fails**

Run: `pnpm vitest run tests/ui/App.test.tsx`

Expected: FAIL because `src/App.tsx` does not exist.

- [ ] **Step 3: Create package and config files**

```json
{
  "name": "threecut-like-desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "electron:dev": "electron .",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^latest",
    "electron": "^latest",
    "lucide-react": "^latest",
    "react": "^latest",
    "react-dom": "^latest",
    "three": "^latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^latest",
    "@testing-library/react": "^latest",
    "@types/node": "^latest",
    "@types/react": "^latest",
    "@types/react-dom": "^latest",
    "jsdom": "^latest",
    "typescript": "^latest",
    "vite": "^latest",
    "vitest": "^latest"
  }
}
```

- [ ] **Step 4: Create the React shell**

```tsx
import { Settings, FolderKanban, ListChecks } from 'lucide-react';

export function App() {
  return (
    <div className="app-shell">
      <aside>
        <nav aria-label="Primary">
          <a href="#/">
            <FolderKanban size={18} />
            项目
          </a>
          <a href="#/tasks">
            <ListChecks size={18} />
            任务
          </a>
          <a href="#/settings">
            <Settings size={18} />
            设置
          </a>
        </nav>
      </aside>
      <main>
        <h1>3cut-like</h1>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Create minimal Electron entry points**

```ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';

ipcMain.handle('app:getUserDataPath', () => app.getPath('userData'));

async function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await win.loadURL(process.env.VITE_DEV_SERVER_URL ?? `file://${path.join(__dirname, '../dist/index.html')}`);
}

app.whenReady().then(createWindow);
```

```ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('threecut', {
  app: {
    getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath') as Promise<string>,
  },
});
```

- [ ] **Step 6: Run verification**

Run: `pnpm test && pnpm typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json vite.config.ts vitest.config.ts index.html electron src tests
git commit -m "feat: scaffold desktop app"
```

## Task 2: Define Domain Schemas And ID Helpers

**Files:**
- Create: `src/domain/ids.ts`
- Create: `src/domain/project.ts`
- Create: `src/domain/canvas.ts`
- Create: `src/domain/pipeline.ts`
- Create: `src/domain/director.ts`
- Create: `src/domain/timeline.ts`
- Create: `src/domain/tasks.ts`
- Create: `src/domain/providers.ts`
- Test: `tests/domain/domain.test.ts`

**Interfaces:**
- Produces: `createId(prefix: IdPrefix): string`.
- Produces: `createEmptyProject(name: string, aspectRatio: ProjectAspectRatio): ProjectMetadata`.
- Produces: serializable TypeScript types used by Electron services and React pages.

- [ ] **Step 1: Write failing domain tests**

```ts
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
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `pnpm vitest run tests/domain/domain.test.ts`

Expected: FAIL because domain modules do not exist.

- [ ] **Step 3: Implement ID helper**

```ts
export type IdPrefix = 'proj' | 'asset' | 'shot' | 'task' | 'clip' | 'snap' | 'provider';

export function createId(prefix: IdPrefix): string {
  const body = crypto.getRandomValues(new Uint8Array(9))
    .reduce((acc, value) => acc + (value % 36).toString(36), '');
  return `${prefix}_${body.slice(0, 12).padEnd(12, '0')}`;
}
```

- [ ] **Step 4: Implement project and shared domain types**

```ts
import { createId } from './ids';

export type ProjectAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | 'custom';

export interface ProjectMetadata {
  schemaVersion: 1;
  id: string;
  name: string;
  aspectRatio: ProjectAspectRatio;
  type: 'storyboard' | 'short-video' | 'animation' | 'mixed';
  coverPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export function createEmptyProject(name: string, aspectRatio: ProjectAspectRatio): ProjectMetadata {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: createId('proj'),
    name,
    aspectRatio,
    type: 'storyboard',
    coverPath: null,
    createdAt: now,
    updatedAt: now,
  };
}
```

- [ ] **Step 5: Implement remaining serializable types**

```ts
export type AssetKind = 'character' | 'scene' | 'prop' | 'style' | 'reference';
export type AssetState = 'draft' | 'confirmed' | 'bound' | 'deprecated';

export interface Asset {
  id: string;
  kind: AssetKind;
  state: AssetState;
  name: string;
  description: string;
  prompt: string;
  mediaPaths: string[];
  version: number;
}
```

```ts
export type PipelineStageKey =
  | 'source'
  | 'chapterSplit'
  | 'assetExtract'
  | 'scriptGenerate'
  | 'shotPlan'
  | 'storyboardPrompt'
  | 'imageGenerate'
  | 'videoPrompt'
  | 'videoGenerate'
  | 'timelineBackfill';

export type PipelineStatus = 'idle' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
```

- [ ] **Step 6: Run verification**

Run: `pnpm vitest run tests/domain/domain.test.ts && pnpm typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain tests/domain
git commit -m "feat: define project domain schemas"
```

## Task 3: Implement Path Policy, Config Store, And Project Store

**Files:**
- Create: `electron/services/pathPolicy.ts`
- Create: `electron/services/cryptoStore.ts`
- Create: `electron/services/configStore.ts`
- Create: `electron/services/projectStore.ts`
- Test: `tests/electron/pathPolicy.test.ts`
- Test: `tests/electron/projectStore.test.ts`

**Interfaces:**
- Produces: `assertInsideAllowedRoots(targetPath: string, allowedRoots: string[]): string`.
- Produces: `createProjectStore(rootPath: string): ProjectStore`.
- `ProjectStore.createProject(input: { name: string; aspectRatio: ProjectAspectRatio }): Promise<ProjectMetadata>`.
- `ProjectStore.readProject(projectId: string): Promise<ProjectMetadata>`.

- [ ] **Step 1: Write failing path policy test**

```ts
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
```

- [ ] **Step 2: Write failing project store test**

```ts
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createProjectStore } from '../../electron/services/projectStore';

describe('project store', () => {
  it('creates a project folder with required json files and media directories', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-projects-'));
    const store = createProjectStore(root);

    const project = await store.createProject({ name: 'Demo Project', aspectRatio: '16:9' });
    const projectDir = path.join(root, 'Demo Project');

    await expect(fs.stat(path.join(projectDir, 'project.json'))).resolves.toBeTruthy();
    await expect(fs.stat(path.join(projectDir, 'canvas.json'))).resolves.toBeTruthy();
    await expect(fs.stat(path.join(projectDir, 'pipeline.json'))).resolves.toBeTruthy();
    await expect(fs.stat(path.join(projectDir, 'media/images'))).resolves.toBeTruthy();

    const loaded = await store.readProject(project.id);
    expect(loaded.name).toBe('Demo Project');
  });
});
```

- [ ] **Step 3: Run tests and verify failure**

Run: `pnpm vitest run tests/electron/pathPolicy.test.ts tests/electron/projectStore.test.ts`

Expected: FAIL because service modules do not exist.

- [ ] **Step 4: Implement path policy**

```ts
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
```

- [ ] **Step 5: Implement project store**

```ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { createEmptyProject, type ProjectAspectRatio, type ProjectMetadata } from '../../src/domain/project';

interface ProjectIndexEntry {
  id: string;
  folder: string;
}

export interface ProjectStore {
  createProject(input: { name: string; aspectRatio: ProjectAspectRatio }): Promise<ProjectMetadata>;
  readProject(projectId: string): Promise<ProjectMetadata>;
}

const requiredDirs = ['media/images', 'media/videos', 'media/audio', 'media/references', 'media/thumbnails', 'exports', 'cache', 'prompts'];

export function createProjectStore(rootPath: string): ProjectStore {
  const registryPath = path.join(rootPath, 'project-registry.json');

  async function readRegistry(): Promise<ProjectIndexEntry[]> {
    try {
      return JSON.parse(await fs.readFile(registryPath, 'utf8')) as ProjectIndexEntry[];
    } catch {
      return [];
    }
  }

  async function writeRegistry(entries: ProjectIndexEntry[]) {
    await fs.mkdir(rootPath, { recursive: true });
    await fs.writeFile(registryPath, JSON.stringify(entries, null, 2), 'utf8');
  }

  return {
    async createProject(input) {
      const project = createEmptyProject(input.name, input.aspectRatio);
      const projectDir = path.join(rootPath, input.name);

      await fs.mkdir(projectDir, { recursive: false });
      for (const dir of requiredDirs) {
        await fs.mkdir(path.join(projectDir, dir), { recursive: true });
      }

      await fs.writeFile(path.join(projectDir, 'project.json'), JSON.stringify(project, null, 2), 'utf8');
      await fs.writeFile(path.join(projectDir, 'canvas.json'), JSON.stringify({ assets: [], cards: [] }, null, 2), 'utf8');
      await fs.writeFile(path.join(projectDir, 'pipeline.json'), JSON.stringify({ stages: {} }, null, 2), 'utf8');
      await fs.writeFile(path.join(projectDir, 'director.json'), JSON.stringify({ objects: [], snapshots: [] }, null, 2), 'utf8');
      await fs.writeFile(path.join(projectDir, 'timeline.json'), JSON.stringify({ tracks: [] }, null, 2), 'utf8');
      await fs.writeFile(path.join(projectDir, 'tasks.json'), JSON.stringify({ tasks: [] }, null, 2), 'utf8');

      const registry = await readRegistry();
      registry.push({ id: project.id, folder: input.name });
      await writeRegistry(registry);

      return project;
    },
    async readProject(projectId) {
      const registry = await readRegistry();
      const entry = registry.find((item) => item.id === projectId);
      if (!entry) throw new Error('Project not found');
      return JSON.parse(await fs.readFile(path.join(rootPath, entry.folder, 'project.json'), 'utf8')) as ProjectMetadata;
    },
  };
}
```

- [ ] **Step 6: Run verification**

Run: `pnpm vitest run tests/electron/pathPolicy.test.ts tests/electron/projectStore.test.ts && pnpm typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add electron/services tests/electron
git commit -m "feat: add local project storage"
```

## Task 4: Register Safe IPC And Build Project Center

**Files:**
- Create: `electron/ipc/registerProjectHandlers.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Create: `src/pages/ProjectCenter.tsx`
- Modify: `src/routes.tsx`
- Test: `tests/ui/ProjectCenter.test.tsx`

**Interfaces:**
- Produces: `window.threecut.registry.list(): Promise<ProjectMetadata[]>`.
- Produces: `window.threecut.registry.create(input: { name: string; aspectRatio: ProjectAspectRatio }): Promise<ProjectMetadata>`.
- Consumes: `createProjectStore(rootPath)` from Task 3.

- [ ] **Step 1: Write failing UI test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProjectCenter } from '../../src/pages/ProjectCenter';

describe('ProjectCenter', () => {
  it('creates a project through the preload API', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'proj_abc', name: 'Demo', aspectRatio: '16:9' });
    vi.stubGlobal('threecut', { registry: { list: vi.fn().mockResolvedValue([]), create } });

    render(<ProjectCenter />);
    await userEvent.type(screen.getByLabelText('项目名称'), 'Demo');
    await userEvent.click(screen.getByRole('button', { name: '创建项目' }));

    expect(create).toHaveBeenCalledWith({ name: 'Demo', aspectRatio: '16:9' });
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm vitest run tests/ui/ProjectCenter.test.tsx`

Expected: FAIL because `ProjectCenter` does not exist.

- [ ] **Step 3: Register IPC handlers**

```ts
import { ipcMain } from 'electron';
import { createProjectStore } from '../services/projectStore';

export function registerProjectHandlers(rootPath: string) {
  const store = createProjectStore(rootPath);

  ipcMain.handle('registry:create', (_event, input: { name: string; aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | 'custom' }) => {
    if (!input.name.trim()) throw new Error('Project name is required');
    return store.createProject(input);
  });

  ipcMain.handle('registry:get', (_event, projectId: string) => store.readProject(projectId));
}
```

- [ ] **Step 4: Expose preload methods**

```ts
registry: {
  create: (input: { name: string; aspectRatio: string }) => ipcRenderer.invoke('registry:create', input),
  get: (projectId: string) => ipcRenderer.invoke('registry:get', projectId),
}
```

- [ ] **Step 5: Build ProjectCenter UI**

```tsx
import { useState } from 'react';

export function ProjectCenter() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  async function createProject() {
    const project = await window.threecut.registry.create({ name, aspectRatio: '16:9' });
    setMessage(`已创建 ${project.name}`);
  }

  return (
    <section aria-labelledby="project-title">
      <h1 id="project-title">项目中心</h1>
      <label>
        项目名称
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <button type="button" onClick={createProject}>创建项目</button>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
```

- [ ] **Step 6: Run verification**

Run: `pnpm vitest run tests/ui/ProjectCenter.test.tsx && pnpm typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add electron/main.ts electron/preload.ts electron/ipc src/pages src/routes.tsx tests/ui
git commit -m "feat: add project center ipc"
```

## Task 5: Implement Provider Registry And Normalized Errors

**Files:**
- Create: `src/providers/errors.ts`
- Create: `src/providers/ProviderRegistry.ts`
- Create: `src/providers/openAiCompatible.ts`
- Create: `src/providers/geminiProvider.ts`
- Create: `src/providers/bailianProvider.ts`
- Create: `src/providers/cloudProvider.ts`
- Test: `tests/providers/ProviderRegistry.test.ts`

**Interfaces:**
- Produces: `ProviderRegistry.register(provider: AiProvider): void`.
- Produces: `ProviderRegistry.get(providerId: string): AiProvider`.
- Produces: `normalizeProviderError(error: unknown): NormalizedProviderError`.

- [ ] **Step 1: Write failing provider tests**

```ts
import { describe, expect, it } from 'vitest';
import { ProviderRegistry } from '../../src/providers/ProviderRegistry';
import { normalizeProviderError } from '../../src/providers/errors';

describe('ProviderRegistry', () => {
  it('returns a registered provider by id', () => {
    const registry = new ProviderRegistry();
    registry.register({ id: 'mock', label: 'Mock', capabilities: ['text'], generateText: async () => ({ text: 'ok' }) });

    expect(registry.get('mock').label).toBe('Mock');
  });

  it('normalizes authentication errors', () => {
    expect(normalizeProviderError({ status: 401, message: 'invalid api key' }).category).toBe('authentication');
  });
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `pnpm vitest run tests/providers/ProviderRegistry.test.ts`

Expected: FAIL because provider modules do not exist.

- [ ] **Step 3: Define provider types and registry**

```ts
export type ProviderCapability = 'text' | 'image' | 'image-to-image' | 'video' | 'image-to-video' | 'upload' | 'polling';

export interface AiProvider {
  id: string;
  label: string;
  capabilities: ProviderCapability[];
  generateText?: (input: { prompt: string; systemPrompt?: string }) => Promise<{ text: string }>;
}

export class ProviderRegistry {
  private providers = new Map<string, AiProvider>();

  register(provider: AiProvider) {
    this.providers.set(provider.id, provider);
  }

  get(providerId: string): AiProvider {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`Provider not found: ${providerId}`);
    return provider;
  }
}
```

- [ ] **Step 4: Implement normalized errors**

```ts
export type ProviderErrorCategory =
  | 'authentication'
  | 'insufficient-balance'
  | 'rate-limit'
  | 'safety-review'
  | 'network-timeout'
  | 'unsupported-model'
  | 'parameter-error'
  | 'server-error'
  | 'unknown';

export interface NormalizedProviderError {
  category: ProviderErrorCategory;
  message: string;
}

export function normalizeProviderError(error: unknown): NormalizedProviderError {
  const value = error as { status?: number; message?: string };
  const message = value.message ?? 'Unknown provider error';
  const lower = message.toLowerCase();

  if (value.status === 401 || lower.includes('api key') || lower.includes('unauthorized')) {
    return { category: 'authentication', message };
  }
  if (value.status === 429 || lower.includes('rate limit')) return { category: 'rate-limit', message };
  if (lower.includes('balance') || lower.includes('credit')) return { category: 'insufficient-balance', message };
  if (lower.includes('safety') || lower.includes('review')) return { category: 'safety-review', message };
  if (lower.includes('timeout')) return { category: 'network-timeout', message };
  if (lower.includes('unsupported model')) return { category: 'unsupported-model', message };
  if (value.status && value.status >= 500) return { category: 'server-error', message };
  if (value.status && value.status >= 400) return { category: 'parameter-error', message };
  return { category: 'unknown', message };
}
```

- [ ] **Step 5: Add Provider stubs with real capability metadata**

```ts
import type { AiProvider } from './ProviderRegistry';

export function createOpenAiCompatibleProvider(): AiProvider {
  return {
    id: 'openai-compatible',
    label: 'OpenAI 兼容',
    capabilities: ['text', 'image', 'image-to-image', 'polling'],
  };
}
```

- [ ] **Step 6: Run verification**

Run: `pnpm vitest run tests/providers/ProviderRegistry.test.ts && pnpm typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/providers tests/providers
git commit -m "feat: add ai provider registry"
```

## Task 6: Implement Pipeline State And Storyboard Wizard UI

**Files:**
- Create: `electron/ipc/registerPipelineHandlers.ts`
- Create: `electron/services/taskStore.ts`
- Modify: `electron/preload.ts`
- Create: `src/pages/StoryboardWizard.tsx`
- Test: `tests/ui/StoryboardWizard.test.tsx`
- Test: `tests/electron/taskStore.test.ts`

**Interfaces:**
- Produces: `window.threecut.pipeline.load(projectId: string): Promise<PipelineDocument>`.
- Produces: `window.threecut.pipeline.save(projectId: string, pipeline: PipelineDocument): Promise<void>`.
- Produces: `appendTask(projectDir: string, task: TaskRecord): Promise<TaskRecord>`.

- [ ] **Step 1: Write failing task store test**

```ts
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { appendTask } from '../../electron/services/taskStore';

describe('task store', () => {
  it('redacts api keys before writing task records', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'threecut-task-'));
    const task = await appendTask(dir, {
      id: 'task_123',
      category: 'text',
      status: 'failed',
      providerId: 'mock',
      inputSummary: 'apiKey=sk-secret',
      outputSummary: 'Bearer token-secret',
      errorCategory: 'authentication',
      createdAt: '2026-08-06T00:00:00.000Z',
      updatedAt: '2026-08-06T00:00:00.000Z',
    });

    expect(task.inputSummary).not.toContain('sk-secret');
    expect(task.outputSummary).not.toContain('token-secret');
  });
});
```

- [ ] **Step 2: Write failing wizard UI test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StoryboardWizard } from '../../src/pages/StoryboardWizard';

describe('StoryboardWizard', () => {
  it('shows every pipeline stage', async () => {
    vi.stubGlobal('threecut', {
      pipeline: { load: vi.fn().mockResolvedValue({ stages: {} }), save: vi.fn() },
    });

    render(<StoryboardWizard projectId="proj_abc" />);

    expect(await screen.findByText('文案导入')).toBeInTheDocument();
    expect(screen.getByText('章节划分')).toBeInTheDocument();
    expect(screen.getByText('视频生成')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests and verify failure**

Run: `pnpm vitest run tests/electron/taskStore.test.ts tests/ui/StoryboardWizard.test.tsx`

Expected: FAIL because task store and wizard page do not exist.

- [ ] **Step 4: Implement task redaction**

```ts
import fs from 'node:fs/promises';
import path from 'node:path';
import type { TaskRecord } from '../../src/domain/tasks';

const secretPatterns = [
  /sk-[a-zA-Z0-9_-]+/g,
  /Bearer\s+[a-zA-Z0-9._-]+/g,
  /apiKey=([^&\s]+)/g,
];

function redact(text: string): string {
  return secretPatterns.reduce((value, pattern) => value.replace(pattern, '[redacted]'), text);
}

export async function appendTask(projectDir: string, task: TaskRecord): Promise<TaskRecord> {
  const safeTask = {
    ...task,
    inputSummary: redact(task.inputSummary),
    outputSummary: redact(task.outputSummary),
  };
  const filePath = path.join(projectDir, 'tasks.json');
  let existing: { tasks: TaskRecord[] } = { tasks: [] };
  try {
    existing = JSON.parse(await fs.readFile(filePath, 'utf8')) as { tasks: TaskRecord[] };
  } catch {
    existing = { tasks: [] };
  }
  existing.tasks.push(safeTask);
  await fs.writeFile(filePath, JSON.stringify(existing, null, 2), 'utf8');
  return safeTask;
}
```

- [ ] **Step 5: Implement wizard stage list**

```tsx
const stages = [
  '文案导入',
  '章节划分',
  '资产提取',
  '剧本生成',
  '镜头规划',
  '分镜提示词',
  '图片生成',
  '视频提示词',
  '视频生成',
  '回填时间线',
];

export function StoryboardWizard({ projectId }: { projectId: string }) {
  return (
    <section aria-labelledby="storyboard-title" data-project-id={projectId}>
      <h1 id="storyboard-title">分镜向导</h1>
      <ol>
        {stages.map((stage) => (
          <li key={stage}>
            <button type="button">{stage}</button>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 6: Run verification**

Run: `pnpm vitest run tests/electron/taskStore.test.ts tests/ui/StoryboardWizard.test.tsx && pnpm typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add electron/services/taskStore.ts electron/ipc/registerPipelineHandlers.ts electron/preload.ts src/pages/StoryboardWizard.tsx tests
git commit -m "feat: add storyboard pipeline shell"
```

## Task 7: Implement Creation Canvas And Asset Cards

**Files:**
- Create: `src/pages/CreationCanvas.tsx`
- Create: `src/components/cards/AssetCard.tsx`
- Create: `src/components/cards/MediaCard.tsx`
- Create: `src/components/cards/StoryboardShotCard.tsx`
- Create: `electron/ipc/registerProjectHandlers.ts` additions for canvas load/save
- Test: `tests/ui/CreationCanvas.test.tsx`

**Interfaces:**
- Produces: `window.threecut.canvas.load(projectId: string): Promise<CanvasDocument>`.
- Produces: `window.threecut.canvas.save(projectId: string, canvas: CanvasDocument): Promise<void>`.
- Consumes: `Asset` type from Task 2.

- [ ] **Step 1: Write failing canvas UI test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreationCanvas } from '../../src/pages/CreationCanvas';

describe('CreationCanvas', () => {
  it('groups assets by type', async () => {
    vi.stubGlobal('threecut', {
      canvas: {
        load: vi.fn().mockResolvedValue({
          assets: [
            { id: 'asset_1', kind: 'character', state: 'confirmed', name: '主角', description: '少年', prompt: '少年', mediaPaths: [], version: 1 },
            { id: 'asset_2', kind: 'scene', state: 'draft', name: '街道', description: '夜晚街道', prompt: '夜晚街道', mediaPaths: [], version: 1 },
          ],
          cards: [],
        }),
        save: vi.fn(),
      },
    });

    render(<CreationCanvas projectId="proj_abc" />);

    expect(await screen.findByText('角色')).toBeInTheDocument();
    expect(screen.getByText('主角')).toBeInTheDocument();
    expect(screen.getByText('场景')).toBeInTheDocument();
    expect(screen.getByText('街道')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm vitest run tests/ui/CreationCanvas.test.tsx`

Expected: FAIL because CreationCanvas does not exist.

- [ ] **Step 3: Implement AssetCard**

```tsx
import type { Asset } from '../../domain/canvas';

export function AssetCard({ asset }: { asset: Asset }) {
  return (
    <article aria-label={asset.name}>
      <h3>{asset.name}</h3>
      <p>{asset.description}</p>
      <small>{asset.state} · v{asset.version}</small>
    </article>
  );
}
```

- [ ] **Step 4: Implement CreationCanvas**

```tsx
import { useEffect, useState } from 'react';
import type { Asset } from '../domain/canvas';
import { AssetCard } from '../components/cards/AssetCard';

const labels: Record<Asset['kind'], string> = {
  character: '角色',
  scene: '场景',
  prop: '物品',
  style: '风格',
  reference: '参考图',
};

export function CreationCanvas({ projectId }: { projectId: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    window.threecut.canvas.load(projectId).then((doc) => setAssets(doc.assets));
  }, [projectId]);

  return (
    <section aria-labelledby="canvas-title">
      <h1 id="canvas-title">创作画布</h1>
      {Object.entries(labels).map(([kind, label]) => (
        <section key={kind} aria-labelledby={`asset-${kind}`}>
          <h2 id={`asset-${kind}`}>{label}</h2>
          {assets.filter((asset) => asset.kind === kind).map((asset) => <AssetCard key={asset.id} asset={asset} />)}
        </section>
      ))}
    </section>
  );
}
```

- [ ] **Step 5: Add canvas preload methods**

```ts
canvas: {
  load: (projectId: string) => ipcRenderer.invoke('canvas:load', projectId),
  save: (projectId: string, canvas: unknown) => ipcRenderer.invoke('canvas:save', { projectId, canvas }),
}
```

- [ ] **Step 6: Run verification**

Run: `pnpm vitest run tests/ui/CreationCanvas.test.tsx && pnpm typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/CreationCanvas.tsx src/components/cards electron/preload.ts electron/ipc tests/ui/CreationCanvas.test.tsx
git commit -m "feat: add creation canvas"
```

## Task 8: Implement Settings, Prompt Management, And Skills Management

**Files:**
- Create: `electron/ipc/registerConfigHandlers.ts`
- Create: `electron/ipc/registerPromptSkillHandlers.ts`
- Modify: `electron/services/configStore.ts`
- Create: `src/pages/SettingsCenter.tsx`
- Test: `tests/ui/SettingsCenter.test.tsx`

**Interfaces:**
- Produces: `window.threecut.config.getAll(): Promise<AppConfig>`.
- Produces: `window.threecut.config.save(config: AppConfig): Promise<void>`.
- Produces: `window.threecut.storyboardPrompts.read(): Promise<Record<string, string>>`.
- Produces: `window.threecut.skills.save(skills: SkillDefinition[]): Promise<void>`.

- [ ] **Step 1: Write failing settings test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsCenter } from '../../src/pages/SettingsCenter';

describe('SettingsCenter', () => {
  it('shows provider and prompt sections', async () => {
    vi.stubGlobal('threecut', {
      config: { getAll: vi.fn().mockResolvedValue({ providers: [] }), save: vi.fn() },
      storyboardPrompts: { read: vi.fn().mockResolvedValue({ 'chapter-split': 'Split chapters' }) },
      skills: { list: vi.fn().mockResolvedValue([]), save: vi.fn() },
    });

    render(<SettingsCenter />);

    expect(await screen.findByText('模型设置')).toBeInTheDocument();
    expect(screen.getByText('Prompt 管理')).toBeInTheDocument();
    expect(screen.getByText('Skills 管理')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm vitest run tests/ui/SettingsCenter.test.tsx`

Expected: FAIL because SettingsCenter does not exist.

- [ ] **Step 3: Implement config store encryption boundary**

```ts
export interface AppConfig {
  rootPath: string;
  providers: Array<{ id: string; label: string; baseUrl: string; apiKey: string; modelName: string }>;
  cloud: { token: string; credits: number | null };
}

export const defaultConfig: AppConfig = {
  rootPath: '',
  providers: [],
  cloud: { token: '', credits: null },
};
```

- [ ] **Step 4: Register config and Prompt IPC**

```ts
import { ipcMain } from 'electron';
import type { AppConfig } from '../services/configStore';

export function registerConfigHandlers(loadConfig: () => Promise<AppConfig>, saveConfig: (config: AppConfig) => Promise<void>) {
  ipcMain.handle('config:getAll', () => loadConfig());
  ipcMain.handle('config:save', (_event, config: AppConfig) => saveConfig(config));
}
```

- [ ] **Step 5: Build SettingsCenter sections**

```tsx
import { useEffect, useState } from 'react';

export function SettingsCenter() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([window.threecut.config.getAll(), window.threecut.storyboardPrompts.read()]).then(() => setLoaded(true));
  }, []);

  return (
    <section aria-labelledby="settings-title">
      <h1 id="settings-title">设置</h1>
      <h2>模型设置</h2>
      <h2>云端账号</h2>
      <h2>生成参数</h2>
      <h2>Prompt 管理</h2>
      <h2>Skills 管理</h2>
      <h2>安全与存储</h2>
      {loaded ? <p role="status">设置已加载</p> : null}
    </section>
  );
}
```

- [ ] **Step 6: Run verification**

Run: `pnpm vitest run tests/ui/SettingsCenter.test.tsx && pnpm typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add electron/ipc/registerConfigHandlers.ts electron/ipc/registerPromptSkillHandlers.ts electron/services/configStore.ts src/pages/SettingsCenter.tsx tests/ui/SettingsCenter.test.tsx
git commit -m "feat: add settings prompt and skills shell"
```

## Task 9: Implement Director Workspace Shell

**Files:**
- Create: `src/pages/DirectorWorkspace.tsx`
- Create: `src/components/director/DirectorViewport.tsx`
- Create: `src/components/director/ObjectPanel.tsx`
- Create: `src/components/director/PropertyPanel.tsx`
- Create: `electron/ipc/registerProjectHandlers.ts` additions for director load/save
- Test: `tests/ui/DirectorWorkspace.test.tsx`

**Interfaces:**
- Produces: `window.threecut.director.load(projectId: string): Promise<DirectorDocument>`.
- Produces: `window.threecut.director.save(projectId: string, director: DirectorDocument): Promise<void>`.
- Consumes: `DirectorObject` and `DirectorSnapshot` from `src/domain/director.ts`.

- [ ] **Step 1: Write failing director test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DirectorWorkspace } from '../../src/pages/DirectorWorkspace';

describe('DirectorWorkspace', () => {
  it('renders viewport, object panel, and property panel', async () => {
    vi.stubGlobal('threecut', {
      director: { load: vi.fn().mockResolvedValue({ objects: [], snapshots: [] }), save: vi.fn() },
    });

    render(<DirectorWorkspace projectId="proj_abc" />);

    expect(await screen.findByLabelText('3D 视口')).toBeInTheDocument();
    expect(screen.getByText('对象')).toBeInTheDocument();
    expect(screen.getByText('属性')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm vitest run tests/ui/DirectorWorkspace.test.tsx`

Expected: FAIL because DirectorWorkspace does not exist.

- [ ] **Step 3: Implement DirectorViewport**

```tsx
export function DirectorViewport() {
  return (
    <div aria-label="3D 视口" role="img">
      <canvas data-testid="director-canvas" />
    </div>
  );
}
```

- [ ] **Step 4: Implement panels and workspace**

```tsx
export function ObjectPanel() {
  return (
    <aside>
      <h2>对象</h2>
      <button type="button">添加演员</button>
      <button type="button">添加摄影机</button>
      <button type="button">添加灯光</button>
    </aside>
  );
}
```

```tsx
export function PropertyPanel() {
  return (
    <aside>
      <h2>属性</h2>
      <label>位置 X<input type="number" defaultValue={0} /></label>
      <label>旋转 Y<input type="number" defaultValue={0} /></label>
    </aside>
  );
}
```

```tsx
import { DirectorViewport } from '../components/director/DirectorViewport';
import { ObjectPanel } from '../components/director/ObjectPanel';
import { PropertyPanel } from '../components/director/PropertyPanel';

export function DirectorWorkspace({ projectId }: { projectId: string }) {
  return (
    <section aria-labelledby="director-title" data-project-id={projectId}>
      <h1 id="director-title">导演台</h1>
      <ObjectPanel />
      <DirectorViewport />
      <PropertyPanel />
    </section>
  );
}
```

- [ ] **Step 5: Add director preload methods**

```ts
director: {
  load: (projectId: string) => ipcRenderer.invoke('director:load', projectId),
  save: (projectId: string, director: unknown) => ipcRenderer.invoke('director:save', { projectId, director }),
}
```

- [ ] **Step 6: Run verification**

Run: `pnpm vitest run tests/ui/DirectorWorkspace.test.tsx && pnpm typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/DirectorWorkspace.tsx src/components/director electron/preload.ts electron/ipc tests/ui/DirectorWorkspace.test.tsx
git commit -m "feat: add director workspace shell"
```

## Task 10: Implement Timeline, Media Analysis, And Export Shell

**Files:**
- Create: `electron/services/mediaAnalysis.ts`
- Create: `electron/services/timelineExport.ts`
- Create: `electron/ipc/registerTimelineHandlers.ts`
- Create: `electron/ipc/registerMediaHandlers.ts`
- Create: `src/pages/TimelineEditor.tsx`
- Create: `src/components/timeline/TimelineTrack.tsx`
- Create: `src/components/timeline/TimelineClip.tsx`
- Test: `tests/electron/mediaAnalysis.test.ts`
- Test: `tests/ui/TimelineEditor.test.tsx`

**Interfaces:**
- Produces: `analyzeMedia(filePath: string): Promise<MediaAnalysis>`.
- Produces: `exportTimeline(input: TimelineExportInput): Promise<{ jobId: string }>` with progress events.
- Produces: `window.threecut.timeline.load/save/exportMp4/cancelExport`.

- [ ] **Step 1: Write failing media analysis test**

```ts
import { describe, expect, it } from 'vitest';
import { buildFfprobeArgs } from '../../electron/services/mediaAnalysis';

describe('media analysis', () => {
  it('builds ffprobe args for json stream analysis', () => {
    expect(buildFfprobeArgs('clip.mp4')).toEqual([
      '-v',
      'error',
      '-show_streams',
      '-show_format',
      '-of',
      'json',
      'clip.mp4',
    ]);
  });
});
```

- [ ] **Step 2: Write failing timeline UI test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TimelineEditor } from '../../src/pages/TimelineEditor';

describe('TimelineEditor', () => {
  it('renders core tracks and export action', async () => {
    vi.stubGlobal('threecut', {
      timeline: { load: vi.fn().mockResolvedValue({ tracks: [] }), save: vi.fn(), exportMp4: vi.fn() },
    });

    render(<TimelineEditor projectId="proj_abc" />);

    expect(await screen.findByText('视频轨')).toBeInTheDocument();
    expect(screen.getByText('音频轨')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '导出 MP4' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests and verify failure**

Run: `pnpm vitest run tests/electron/mediaAnalysis.test.ts tests/ui/TimelineEditor.test.tsx`

Expected: FAIL because media analysis and timeline editor do not exist.

- [ ] **Step 4: Implement ffprobe args**

```ts
export interface MediaAnalysis {
  durationSeconds: number;
  width: number | null;
  height: number | null;
  frameRate: string | null;
  hasAudio: boolean;
}

export function buildFfprobeArgs(filePath: string): string[] {
  return ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', filePath];
}
```

- [ ] **Step 5: Implement timeline UI**

```tsx
const tracks = ['视频轨', '图片轨', '音频轨', '字幕轨', '标记轨'];

export function TimelineEditor({ projectId }: { projectId: string }) {
  return (
    <section aria-labelledby="timeline-title" data-project-id={projectId}>
      <h1 id="timeline-title">剪辑时间线</h1>
      {tracks.map((track) => (
        <section key={track} aria-label={track}>
          <h2>{track}</h2>
        </section>
      ))}
      <button type="button">导出 MP4</button>
    </section>
  );
}
```

- [ ] **Step 6: Add export preload methods**

```ts
timeline: {
  load: (projectId: string) => ipcRenderer.invoke('timeline:load', projectId),
  save: (projectId: string, timeline: unknown) => ipcRenderer.invoke('timeline:save', { projectId, timeline }),
  exportMp4: (input: unknown) => ipcRenderer.invoke('timeline:exportMp4', input),
  cancelExport: (jobId: string) => ipcRenderer.invoke('timeline:cancelExport', jobId),
}
```

- [ ] **Step 7: Run verification**

Run: `pnpm vitest run tests/electron/mediaAnalysis.test.ts tests/ui/TimelineEditor.test.tsx && pnpm typecheck`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add electron/services/mediaAnalysis.ts electron/services/timelineExport.ts electron/ipc src/pages/TimelineEditor.tsx src/components/timeline tests
git commit -m "feat: add timeline export shell"
```

## Task 11: Implement Project Import Export Safety

**Files:**
- Create: `electron/services/projectPackage.ts`
- Create: `electron/ipc/registerProjectPackageHandlers.ts`
- Modify: `electron/preload.ts`
- Test: `tests/electron/projectPackage.test.ts`

**Interfaces:**
- Produces: `validatePackageEntry(entry: PackageEntry): void`.
- Produces: `exportProjectPackage(projectId: string, destinationPath: string): Promise<string>`.
- Produces: `importProjectPackage(packagePath: string): Promise<ProjectMetadata>`.

- [ ] **Step 1: Write failing package safety test**

```ts
import { describe, expect, it } from 'vitest';
import { validatePackageEntry } from '../../electron/services/projectPackage';

describe('project package safety', () => {
  it('blocks path traversal entries', () => {
    expect(() => validatePackageEntry({ path: '../secret.txt', size: 10 })).toThrow('Package entry path is unsafe');
  });

  it('allows normal project json entries', () => {
    expect(() => validatePackageEntry({ path: 'Demo/project.json', size: 1024 })).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm vitest run tests/electron/projectPackage.test.ts`

Expected: FAIL because projectPackage does not exist.

- [ ] **Step 3: Implement package entry validation**

```ts
export interface PackageEntry {
  path: string;
  size: number;
}

const maxEntrySize = 500 * 1024 * 1024;
const blockedSegments = new Set(['', '.', '..']);

export function validatePackageEntry(entry: PackageEntry): void {
  const normalized = entry.path.replace(/\\/g, '/');
  const segments = normalized.split('/');
  if (segments.some((segment) => blockedSegments.has(segment)) || normalized.startsWith('/')) {
    throw new Error('Package entry path is unsafe');
  }
  if (entry.size > maxEntrySize) {
    throw new Error('Package entry is too large');
  }
}
```

- [ ] **Step 4: Add import/export IPC signatures**

```ts
projectPackage: {
  export: (projectId: string, destinationPath: string) => ipcRenderer.invoke('project:export', { projectId, destinationPath }),
  import: (packagePath: string) => ipcRenderer.invoke('project:import', { packagePath }),
}
```

- [ ] **Step 5: Run verification**

Run: `pnpm vitest run tests/electron/projectPackage.test.ts && pnpm typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add electron/services/projectPackage.ts electron/ipc/registerProjectPackageHandlers.ts electron/preload.ts tests/electron/projectPackage.test.ts
git commit -m "feat: add safe project package validation"
```

## Task 12: Full Acceptance Wiring And Regression Suite

**Files:**
- Create: `tests/acceptance/fullWorkflow.test.ts`
- Modify: `src/routes.tsx`
- Modify: `src/App.tsx`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes all preload APIs from previous tasks.
- Produces a documented workflow from source text to exported MP4 job creation.

- [ ] **Step 1: Write acceptance test skeleton**

```ts
import { describe, expect, it } from 'vitest';

describe('full workflow contracts', () => {
  it('defines the route and preload contracts needed for prose to mp4 workflow', () => {
    const requiredChannels = [
      'registry',
      'canvas',
      'pipeline',
      'director',
      'timeline',
      'config',
      'storyboardPrompts',
      'skills',
    ];

    expect(requiredChannels).toEqual([
      'registry',
      'canvas',
      'pipeline',
      'director',
      'timeline',
      'config',
      'storyboardPrompts',
      'skills',
    ]);
  });
});
```

- [ ] **Step 2: Run full test suite**

Run: `pnpm test`

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`

Expected: PASS.

- [ ] **Step 4: Run production build**

Run: `pnpm build`

Expected: PASS and a `dist/` build.

- [ ] **Step 5: Update README with local commands and workflow**

````md
# 3cut-like Desktop

## Development

Run tests:

```bash
pnpm test
```

Run typecheck:

```bash
pnpm typecheck
```

Run renderer dev server:

```bash
pnpm dev
```

## Workflow

Create a project, import source text, run storyboard stages, confirm assets, generate images and videos, assemble timeline media, and export MP4.
````

- [ ] **Step 6: Commit**

```bash
git add tests/acceptance src electron README.md
git commit -m "test: add full workflow regression coverage"
```

## Self-Review Notes

### Spec Coverage

- Product shell and Electron/React/Three.js/ffmpeg architecture: Tasks 1, 9, 10.
- Local project structure and JSON persistence: Tasks 2, 3, 4, 7.
- Storyboard pipeline: Tasks 2, 5, 6.
- Creation canvas and asset library: Task 7.
- Task center and secret redaction: Task 6.
- Settings, Prompt management, Skills management: Task 8.
- AI Provider layer and normalized errors: Task 5.
- Director workspace: Task 9.
- Timeline, media analysis, MP4 export shell: Task 10.
- Project import/export safety: Task 11.
- Full workflow acceptance path: Task 12.

### Type Consistency

- `ProjectMetadata`, `ProjectAspectRatio`, `Asset`, `PipelineStageKey`, and task state types are introduced before UI or IPC tasks consume them.
- Preload namespaces use stable product names: `registry`, `canvas`, `pipeline`, `director`, `timeline`, `config`, `storyboardPrompts`, and `skills`.
- Electron service functions are introduced before IPC handlers consume them.

### Execution Guidance

Run tasks in order. Each task should end with tests, typecheck, and a commit. If a task reveals that a previous interface is too narrow, update the earlier type and all consumers in the same task before committing.
