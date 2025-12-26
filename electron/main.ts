
import { app, BrowserWindow, ipcMain, Tray, Menu } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import { exec } from 'child_process';

/**
 * 1Man1Machine Desktop - Main Process
 * Handles native OS interactions like window management and process enumeration.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = !app.isPackaged;
const devUrl = 'http://localhost:5173';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 750,
    frame: false, // Frameless for custom title bar
    show: false,
    backgroundColor: '#050505',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Desktop features
ipcMain.handle('get-processes', async () => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve(['Chrome.exe', 'Discord.exe', 'Spotify.exe']);
      return;
    }
    
    exec('tasklist /FI "STATUS eq RUNNING" /FO CSV', (err, stdout) => {
      if (err) return resolve(['ModernWarfare.exe', 'eldenring.exe']);
      const lines = stdout.toString().split('\r\n');
      const processes = lines
        .slice(1)
        .map(line => line.split(',')[0].replace(/"/g, ''))
        .filter(name => name.endsWith('.exe') && !name.includes('System'));
      resolve(Array.from(new Set(processes)).slice(0, 20));
    });
  });
});

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('window-close', () => mainWindow?.hide());
