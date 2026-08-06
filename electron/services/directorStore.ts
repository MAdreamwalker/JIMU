import fs from 'node:fs/promises';
import type {
  DirectorDocument,
  DirectorObject,
  DirectorObjectKind,
  DirectorSnapshot,
  DirectorVector3,
} from '../../src/domain/director.js';
import type { ProjectStore } from './projectStore.js';

const objectKinds: readonly DirectorObjectKind[] = ['actor', 'camera', 'light', 'prop'];

export interface DirectorStore {
  load(): Promise<DirectorDocument>;
  save(director: unknown): Promise<void>;
}

export function createDirectorStore(projectStore: ProjectStore, projectId: unknown): DirectorStore {
  const validProjectId = validateProjectId(projectId);

  async function getDirectorPath(): Promise<string> {
    return projectStore.getProjectFilePath(validProjectId, 'director.json');
  }

  return {
    async load() {
      let parsed: unknown;

      try {
        parsed = JSON.parse(await fs.readFile(await getDirectorPath(), 'utf8')) as unknown;
      } catch {
        throw new Error('Invalid director document');
      }

      return validateDirectorDocument(parsed);
    },
    async save(director) {
      const document = validateDirectorDocument(director);
      await fs.writeFile(await getDirectorPath(), JSON.stringify(document, null, 2), 'utf8');
    },
  };
}

export function validateDirectorDocument(value: unknown): DirectorDocument {
  if (!hasExactKeys(value, ['objects', 'snapshots'])
    || !Array.isArray(value.objects)
    || !Array.isArray(value.snapshots)) {
    throw new Error('Invalid director document');
  }

  return {
    objects: value.objects.map(validateDirectorObject),
    snapshots: value.snapshots.map(validateDirectorSnapshot),
  };
}

function validateDirectorObject(value: unknown): DirectorObject {
  if (!hasRequiredKeys(value, ['id', 'kind', 'name', 'position', 'rotation', 'scale'])
    || !isNonEmptyString(value.id)
    || !objectKinds.includes(value.kind as DirectorObjectKind)
    || !isString(value.name)
    || !isDirectorVector3(value.position)
    || !isDirectorVector3(value.rotation)
    || !isDirectorVector3(value.scale)
    || (Object.prototype.hasOwnProperty.call(value, 'assetId') && !isNonEmptyString(value.assetId))) {
    throw new Error('Invalid director document');
  }

  return {
    id: value.id,
    kind: value.kind as DirectorObjectKind,
    name: value.name,
    position: value.position,
    rotation: value.rotation,
    scale: value.scale,
    ...(Object.prototype.hasOwnProperty.call(value, 'assetId') ? { assetId: value.assetId as string } : {}),
  };
}

function validateDirectorSnapshot(value: unknown): DirectorSnapshot {
  if (!hasExactKeys(value, ['id', 'name', 'objectIds', 'createdAt'])
    || !isNonEmptyString(value.id)
    || !isString(value.name)
    || !Array.isArray(value.objectIds)
    || !value.objectIds.every(isNonEmptyString)
    || !isNonEmptyString(value.createdAt)) {
    throw new Error('Invalid director document');
  }

  return {
    id: value.id,
    name: value.name,
    objectIds: value.objectIds,
    createdAt: value.createdAt,
  };
}

function isDirectorVector3(value: unknown): value is DirectorVector3 {
  return hasExactKeys(value, ['x', 'y', 'z'])
    && typeof value.x === 'number'
    && Number.isFinite(value.x)
    && typeof value.y === 'number'
    && Number.isFinite(value.y)
    && typeof value.z === 'number'
    && Number.isFinite(value.z);
}

function validateProjectId(value: unknown): string {
  if (!isNonEmptyString(value)) {
    throw new Error('Invalid project id');
  }

  return value;
}

function hasExactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return !!value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function hasRequiredKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return !!value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).every((key) => [...keys, 'assetId'].includes(key))
    && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}
