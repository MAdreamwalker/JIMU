import { ipcMain } from 'electron';
import { analyzeMedia } from '../services/mediaAnalysis.js';

export function registerMediaHandlers(): void {
  ipcMain.handle('media:analyze', (_event, filePath: unknown) => {
    if (typeof filePath !== 'string' || !filePath.trim()) {
      throw new Error('Invalid media file path');
    }

    return analyzeMedia(filePath);
  });
}
