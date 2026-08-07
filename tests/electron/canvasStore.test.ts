import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createCanvasStore, validateCanvasDocument } from '../../electron/services/canvasStore';
import { createProjectStore } from '../../electron/services/projectStore';
import type { CanvasDocument } from '../../src/domain/canvas';

describe('canvas store', () => {
  it.each([
    [undefined],
    [{}],
    [{ assets: [], cards: [], payload: 'unexpected' }],
    [{ assets: [{ ...createCanvas().assets[0], prompt: undefined }], cards: [] }],
  ])('rejects malformed canvas documents', (canvas) => {
    expect(() => validateCanvasDocument(canvas)).toThrow('Invalid canvas document');
  });

  it.each([
    '/tmp/asset.png',
    'C:\\assets\\asset.png',
    'https://example.com/asset.png',
    'data:image/png;base64,abc',
    '../outside.png',
    '..\\outside.png',
    'media/../outside.png',
  ])('rejects unsafe media path %s', (mediaPath) => {
    expect(() => validateCanvasDocument(createCanvas({ mediaPaths: [mediaPath] }))).toThrow('Invalid media path');
  });

  it('rejects malformed persisted canvas documents on load', async () => {
    const { canvasStore, canvasPath } = await createTestCanvasStore();
    await fs.writeFile(canvasPath, JSON.stringify({ assets: 'bad', cards: [] }), 'utf8');

    await expect(canvasStore.load()).rejects.toThrow('Invalid canvas document');
  });

  it('persists a valid canvas with relative media paths', async () => {
    const { canvasStore, canvasPath } = await createTestCanvasStore();
    const canvas = createCanvas({ mediaPaths: ['media/images/hero.png', 'media/references/style.jpg'] });

    await canvasStore.save(canvas);

    await expect(fs.readFile(canvasPath, 'utf8')).resolves.toBe(JSON.stringify(canvas, null, 2));
    await expect(canvasStore.load()).resolves.toEqual(canvas);
  });
});

function createCanvas(overrides: Partial<CanvasDocument['assets'][number]> = {}): CanvasDocument {
  return {
    assets: [{
      id: 'asset_1',
      kind: 'character',
      state: 'confirmed',
      name: 'Hero',
      description: 'Lead character',
      prompt: 'Young protagonist',
      mediaPaths: ['media/images/hero.png'],
      version: 1,
      ...overrides,
    }],
    cards: [{
      id: 'card_1',
      assetId: 'asset_1',
      title: 'Hero card',
      notes: 'Reference',
      position: { x: 0, y: 0 },
    }],
  };
}

async function createTestCanvasStore() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jimu-canvas-root-'));
  const projectStore = createProjectStore(root);
  const project = await projectStore.createProject({ name: 'Canvas Project', aspectRatio: '16:9' });

  return {
    canvasStore: createCanvasStore(projectStore, project.id),
    canvasPath: await projectStore.getProjectFilePath(project.id, 'canvas.json'),
  };
}
