import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('threecut', {
  app: {
    getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath') as Promise<string>,
  },
});
