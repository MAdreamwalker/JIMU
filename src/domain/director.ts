export type DirectorObjectKind = 'actor' | 'camera' | 'light' | 'prop';

export interface DirectorVector3 {
  x: number;
  y: number;
  z: number;
}

export interface DirectorObject {
  id: string;
  kind: DirectorObjectKind;
  name: string;
  position: DirectorVector3;
  rotation: DirectorVector3;
  scale: DirectorVector3;
  assetId?: string;
}

export interface DirectorSnapshot {
  id: string;
  name: string;
  objectIds: string[];
  createdAt: string;
}

export interface DirectorDocument {
  objects: DirectorObject[];
  snapshots: DirectorSnapshot[];
}
