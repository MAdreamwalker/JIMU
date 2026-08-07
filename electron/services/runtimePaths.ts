import path from 'node:path';

export function resolveRendererUrl(electronDir: string, devServerUrl = process.env.VITE_DEV_SERVER_URL): string {
  if (devServerUrl) return devServerUrl;

  return `file://${path.join(electronDir, '..', '..', 'dist', 'index.html')}`;
}
