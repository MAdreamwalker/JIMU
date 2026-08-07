export type IdPrefix = 'proj' | 'asset' | 'shot' | 'task' | 'clip' | 'snap' | 'provider';

export function createId(prefix: IdPrefix): string {
  const body = globalThis.crypto.getRandomValues(new Uint8Array(12))
    .reduce((acc, value) => acc + (value % 36).toString(36), '');
  return `${prefix}_${body}`;
}
