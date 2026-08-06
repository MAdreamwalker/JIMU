import fs from 'node:fs/promises';
import path from 'node:path';
import type { Asset, AssetKind, AssetState, CanvasCard, CanvasDocument } from '../../src/domain/canvas.js';
import type { ProjectStore } from './projectStore.js';

const assetKinds: readonly AssetKind[] = ['character', 'scene', 'prop', 'style', 'reference'];
const assetStates: readonly AssetState[] = ['draft', 'confirmed', 'bound', 'deprecated'];

export interface CanvasStore {
  load(): Promise<CanvasDocument>;
  save(canvas: unknown): Promise<void>;
}

export function createCanvasStore(projectStore: ProjectStore, projectId: unknown): CanvasStore {
  const validProjectId = validateProjectId(projectId);

  async function getCanvasPath(): Promise<string> {
    return projectStore.getProjectFilePath(validProjectId, 'canvas.json');
  }

  return {
    async load() {
      const canvasPath = await getCanvasPath();
      let parsed: unknown;

      try {
        parsed = JSON.parse(await fs.readFile(canvasPath, 'utf8')) as unknown;
      } catch {
        throw new Error('Invalid canvas document');
      }

      return validateCanvasDocument(parsed);
    },
    async save(canvas) {
      const document = validateCanvasDocument(canvas);
      await fs.writeFile(await getCanvasPath(), JSON.stringify(document, null, 2), 'utf8');
    },
  };
}

export function validateCanvasDocument(value: unknown): CanvasDocument {
  if (!hasExactKeys(value, ['assets', 'cards']) || !Array.isArray(value.assets) || !Array.isArray(value.cards)) {
    throw new Error('Invalid canvas document');
  }

  return {
    assets: value.assets.map(validateAsset),
    cards: value.cards.map(validateCanvasCard),
  };
}

function validateAsset(value: unknown): Asset {
  if (!hasExactKeys(value, ['id', 'kind', 'state', 'name', 'description', 'prompt', 'mediaPaths', 'version'])
    || !isNonEmptyString(value.id)
    || !assetKinds.includes(value.kind as AssetKind)
    || !assetStates.includes(value.state as AssetState)
    || !isString(value.name)
    || !isString(value.description)
    || !isString(value.prompt)
    || !Array.isArray(value.mediaPaths)
    || typeof value.version !== 'number'
    || !Number.isSafeInteger(value.version)
    || value.version < 1) {
    throw new Error('Invalid canvas document');
  }

  if (!value.mediaPaths.every(isSafeProjectRelativePath)) {
    throw new Error('Invalid media path');
  }

  return {
    id: value.id,
    kind: value.kind as AssetKind,
    state: value.state as AssetState,
    name: value.name,
    description: value.description,
    prompt: value.prompt,
    mediaPaths: value.mediaPaths,
    version: value.version,
  };
}

function validateCanvasCard(value: unknown): CanvasCard {
  if (!hasExactKeys(value, ['id', 'assetId', 'title', 'notes', 'position'])
    || !isNonEmptyString(value.id)
    || (value.assetId !== null && !isNonEmptyString(value.assetId))
    || !isString(value.title)
    || !isString(value.notes)
    || !hasExactKeys(value.position, ['x', 'y'])
    || typeof value.position.x !== 'number'
    || typeof value.position.y !== 'number'
    || !Number.isFinite(value.position.x)
    || !Number.isFinite(value.position.y)) {
    throw new Error('Invalid canvas document');
  }

  return {
    id: value.id,
    assetId: value.assetId,
    title: value.title,
    notes: value.notes,
    position: { x: value.position.x, y: value.position.y },
  };
}

function validateProjectId(value: unknown): string {
  if (!isNonEmptyString(value)) {
    throw new Error('Invalid project id');
  }

  return value;
}

function isSafeProjectRelativePath(value: unknown): value is string {
  if (!isNonEmptyString(value)
    || value !== value.trim()
    || value.includes('\u0000')
    || path.posix.isAbsolute(value)
    || path.win32.isAbsolute(value)
    || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return false;
  }

  return value.split('/').every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

function hasExactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return !!value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}
