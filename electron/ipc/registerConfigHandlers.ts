import { ipcMain } from 'electron';
import type { AppConfig } from '../services/configStore.js';

export function registerConfigHandlers(
  loadConfig: () => Promise<AppConfig>,
  saveConfig: (config: AppConfig) => Promise<void>,
): void {
  ipcMain.handle('config:getAll', () => loadConfig());
  ipcMain.handle('config:save', (_event, config: AppConfig) => saveConfig(config));
}
