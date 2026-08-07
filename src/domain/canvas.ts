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

export interface CanvasCard {
  id: string;
  assetId: string | null;
  title: string;
  notes: string;
  position: { x: number; y: number };
}

export interface CanvasDocument {
  assets: Asset[];
  cards: CanvasCard[];
}
