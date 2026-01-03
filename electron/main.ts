
import { app, BrowserWindow, ipcMain, Tray, Menu } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import { exec } from 'child_process';
import * as fs from 'fs';
import { Buffer } from 'buffer';

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
      sandbox: false, // Preload script needs access to node primitives
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
      // Return empty list or basic shell on non-Windows dev environments
      resolve([]);
      return;
    }
    
    exec('tasklist /FI "STATUS eq RUNNING" /FO CSV', (err, stdout) => {
      if (err) return resolve([]); // Fail gracefully with empty list
      const lines = stdout.toString().split('\r\n');
      const processes = lines
        .slice(1)
        .map(line => line.split(',')[0].replace(/"/g, ''))
        .filter(name => name.endsWith('.exe') && !name.includes('System'));
      resolve(Array.from(new Set(processes)).slice(0, 20));
    });
  });
});

// IPC Handler for Saving Training Data
ipcMain.handle('save-training-data', async (_, payload: { image: string, labels: string, filename: string }) => {
  try {
    const userDataPath = app.getPath('userData');
    const trainingDir = path.join(userDataPath, 'yolo_training_data');
    const imagesDir = path.join(trainingDir, 'images');
    const labelsDir = path.join(trainingDir, 'labels');

    // Ensure directories exist
    if (!fs.existsSync(trainingDir)) fs.mkdirSync(trainingDir);
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);
    if (!fs.existsSync(labelsDir)) fs.mkdirSync(labelsDir);

    // 1. Manage Dataset Limit (Max 1000)
    const files = fs.readdirSync(imagesDir);
    if (files.length >= 1000) {
      // Sort by creation time (simulated by name if timestamped, or stat)
      // Since our filenames are capture_TIMESTAMP.jpg, basic sort works for FIFO
      files.sort();
      const filesToDelete = files.slice(0, 100); // Batch delete oldest 100
      
      filesToDelete.forEach(file => {
        const baseName = path.parse(file).name;
        const imgPath = path.join(imagesDir, file);
        const lblPath = path.join(labelsDir, baseName + '.txt');
        
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        if (fs.existsSync(lblPath)) fs.unlinkSync(lblPath);
      });
    }
    
    // 3. Save Image
    const base64Data = payload.image.replace(/^data:image\/\w+;base64,/, "");
    // Use global Buffer in Node environment
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(path.join(imagesDir, payload.filename + '.jpg'), buffer);

    // 4. Save Labels
    fs.writeFileSync(path.join(labelsDir, payload.filename + '.txt'), payload.labels);

    return { success: true };
  } catch (error: any) {
    console.error("Save failed:", error);
    return { success: false, reason: error.message };
  }
});

// IPC Handlers for OS-level input simulation
// NOTE: For system-wide input injection in a compiled production build,
// one would typically integrate a native node module like 'robotjs' or 'nut.js'.
// Since this environment restricts native dependency compilation, we log the intent.
// In a full local environment, replace console.log with native calls.
ipcMain.on('send-key-event', (_, args: { keyCode: string; type: 'keydown' | 'keyup' }) => {
  console.log(`[KERNEL_IO] Key Event: ${args.keyCode} ${args.type}`);
});
ipcMain.on('send-mouse-move', (_, args: { x: number; y: number }) => {
  console.log(`[KERNEL_IO] Mouse Move: X=${args.x.toFixed(0)}, Y=${args.y.toFixed(0)}`);
});
ipcMain.on('send-mouse-button-event', (_, args: { button: 'left' | 'middle' | 'right'; type: 'mousedown' | 'mouseup' }) => {
  const isDown = args.type === 'mousedown';
  console.log(`[KERNEL_IO] Mouse Button: ${args.button} ${isDown ? 'Down' : 'Up'}`);
});


app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('window-close', () => mainWindow?.close());
