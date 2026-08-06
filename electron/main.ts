import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerPipelineHandlers } from './ipc/registerPipelineHandlers.js';
import { registerProjectHandlers } from './ipc/registerProjectHandlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

  await win.loadURL(
    process.env.VITE_DEV_SERVER_URL ?? `file://${path.join(__dirname, '../dist/index.html')}`,
  );
}

app.whenReady().then(async () => {
  const projectsPath = path.join(app.getPath('userData'), 'projects');
  registerProjectHandlers(projectsPath);
  registerPipelineHandlers(projectsPath);
  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
