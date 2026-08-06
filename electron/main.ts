import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerPipelineHandlers } from './ipc/registerPipelineHandlers.js';
import { registerProjectHandlers } from './ipc/registerProjectHandlers.js';
import { registerConfigHandlers } from './ipc/registerConfigHandlers.js';
import { registerPromptSkillHandlers } from './ipc/registerPromptSkillHandlers.js';
import { registerTimelineHandlers } from './ipc/registerTimelineHandlers.js';
import { registerMediaHandlers } from './ipc/registerMediaHandlers.js';
import { registerProjectPackageHandlers } from './ipc/registerProjectPackageHandlers.js';
import { createConfigStore } from './services/configStore.js';
import { createCryptoStore } from './services/cryptoStore.js';

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
  const userDataPath = app.getPath('userData');
  const projectsPath = path.join(app.getPath('userData'), 'projects');
  const configStore = createConfigStore(path.join(userDataPath, '3cut-clone-config.json'), createCryptoStore());
  registerProjectHandlers(projectsPath);
  registerPipelineHandlers(projectsPath);
  registerConfigHandlers(() => configStore.load(), (config) => configStore.save(config));
  registerPromptSkillHandlers({
    storyboardPromptsPath: path.join(userDataPath, 'storyboard-prompts.json'),
    skillsPath: path.join(userDataPath, 'skills.json'),
  });
  registerTimelineHandlers(projectsPath);
  registerMediaHandlers(projectsPath);
  registerProjectPackageHandlers();
  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
