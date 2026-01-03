
import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import { Buffer } from 'buffer';

// --- NUT.JS INPUT ENGINE ---
// Use require to ensure compatibility with CommonJS compilation in Electron
const { keyboard, mouse, Key, Button, Point } = require('@nut-tree/nut-js');

// Configure for zero delay (Instant Injection)
keyboard.config.autoDelayMs = 0;
mouse.config.autoDelayMs = 0;

/**
 * 1Man1Machine Desktop - Main Process
 * Production-Ready Build v3.5.0
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
const activeHeldKeys = new Set<number>(); // Track keys for emergency release

// --- LOGGING SYSTEM ---
const logDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const logPath = path.join(logDir, `session-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
const logStream = fs.createWriteStream(logPath, { flags: 'a' });

function logSystem(level: 'INFO' | 'WARN' | 'ERROR' | 'INPUT', message: string) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}\n`;
  logStream.write(logLine);
  if (!app.isPackaged) console.log(logLine.trim());
}

logSystem('INFO', `App Starting. Version: ${app.getVersion()}`);
logSystem('INFO', `Log Path: ${logPath}`);
logSystem('INFO', `Process Architecture: ${os.arch()}`);

// --- KEY MAPPING TABLE ---
// Maps DOM Code Strings -> Nut.js Key Enums
const KEY_MAP: Record<string, any> = {
  'Space': Key.Space,
  'KeyW': Key.W,
  'KeyA': Key.A,
  'KeyS': Key.S,
  'KeyD': Key.D,
  'KeyQ': Key.Q,
  'KeyE': Key.E,
  'KeyR': Key.R,
  'KeyF': Key.F,
  'KeyG': Key.G,
  'KeyC': Key.C,
  'KeyV': Key.V,
  'KeyX': Key.X,
  'KeyZ': Key.Z,
  'ShiftLeft': Key.LeftShift,
  'ControlLeft': Key.LeftControl,
  'AltLeft': Key.LeftAlt,
  'Tab': Key.Tab,
  'Escape': Key.Escape,
  'Enter': Key.Return,
  'Backspace': Key.Backspace,
  'ArrowUp': Key.Up,
  'ArrowDown': Key.Down,
  'ArrowLeft': Key.Left,
  'ArrowRight': Key.Right,
  'Digit1': Key.Num1,
  'Digit2': Key.Num2,
  'Digit3': Key.Num3,
  'Digit4': Key.Num4,
  'Digit5': Key.Num5,
};

// --- SINGLE INSTANCE LOCK ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  logSystem('WARN', 'Second instance detected. Quitting.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      logSystem('INFO', 'Second instance focused.');
    }
  });
}

// --- ERROR HANDLING ---
(process as any).on('uncaughtException', (error: any) => {
  logSystem('ERROR', `Uncaught Exception: ${error.message}\n${error.stack}`);
});

const isDev = !app.isPackaged;
const devUrl = 'http://localhost:5173';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 750,
    frame: false,
    show: false,
    backgroundColor: '#050505',
    icon: path.join(__dirname, '../resources/icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
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
    logSystem('INFO', 'Main Window Ready and Shown');
  });

  mainWindow.on('closed', () => {
    // Release all keys on close for safety
    releaseAllKeys();
    mainWindow = null;
    logSystem('INFO', 'Main Window Closed');
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// --- HELPER: Release All Keys ---
function releaseAllKeys() {
  if (activeHeldKeys.size > 0) {
    logSystem('WARN', `Emergency Release: Clearing ${activeHeldKeys.size} held keys.`);
    activeHeldKeys.forEach((key) => {
      try {
        keyboard.releaseKey(key);
      } catch (e) { console.error(e); }
    });
    activeHeldKeys.clear();
  }
}

// --- IPC HANDLERS ---

ipcMain.handle('get-processes', async () => {
  return new Promise((resolve) => {
    if (os.platform() !== 'win32') {
      resolve([]);
      return;
    }
    
    exec('tasklist /FI "STATUS eq RUNNING" /FO CSV', (err, stdout) => {
      if (err) {
        logSystem('ERROR', `Tasklist failed: ${err.message}`);
        return resolve([]);
      }
      const lines = stdout.toString().split('\r\n');
      const processes = lines
        .slice(1)
        .map(line => line.split(',')[0].replace(/"/g, ''))
        .filter(name => name.endsWith('.exe') && !name.includes('System'));
      resolve(Array.from(new Set(processes)).slice(0, 20));
    });
  });
});

ipcMain.handle('open-logs', async () => {
  shell.openPath(logDir);
  logSystem('INFO', 'User requested log folder access');
  return { success: true };
});

ipcMain.handle('save-training-data', async (_, payload: { image: string, labels: string, filename: string }) => {
  try {
    const userDataPath = app.getPath('userData');
    const trainingDir = path.join(userDataPath, 'yolo_training_data');
    const imagesDir = path.join(trainingDir, 'images');
    const labelsDir = path.join(trainingDir, 'labels');

    if (!fs.existsSync(trainingDir)) fs.mkdirSync(trainingDir);
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);
    if (!fs.existsSync(labelsDir)) fs.mkdirSync(labelsDir);

    const files = fs.readdirSync(imagesDir);
    if (files.length >= 1000) {
      files.sort();
      const filesToDelete = files.slice(0, 100);
      filesToDelete.forEach(file => {
        const baseName = path.parse(file).name;
        const imgPath = path.join(imagesDir, file);
        const lblPath = path.join(labelsDir, baseName + '.txt');
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        if (fs.existsSync(lblPath)) fs.unlinkSync(lblPath);
      });
    }
    
    const base64Data = payload.image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(path.join(imagesDir, payload.filename + '.jpg'), buffer);
    fs.writeFileSync(path.join(labelsDir, payload.filename + '.txt'), payload.labels);

    return { success: true };
  } catch (error: any) {
    logSystem('ERROR', `Save Training Data Failed: ${error.message}`);
    return { success: false, reason: error.message };
  }
});

// --- REAL OS INJECTION ---

ipcMain.on('send-key-event', async (_, args: { keyCode: string; type: 'keydown' | 'keyup' }) => {
  try {
    const nutKey = KEY_MAP[args.keyCode];
    if (nutKey === undefined) {
      // logSystem('WARN', `Unknown key mapping: ${args.keyCode}`);
      return;
    }

    if (args.type === 'keydown') {
      if (!activeHeldKeys.has(nutKey)) {
        activeHeldKeys.add(nutKey);
        await keyboard.pressKey(nutKey);
        logSystem('INPUT', `KeyDown: ${args.keyCode}`);
      }
    } else {
      if (activeHeldKeys.has(nutKey)) {
        activeHeldKeys.delete(nutKey);
        await keyboard.releaseKey(nutKey);
        logSystem('INPUT', `KeyUp: ${args.keyCode}`);
      }
    }
  } catch (e: any) {
    logSystem('ERROR', `Injection Failed: ${e.message}`);
  }
});

ipcMain.on('send-mouse-move', async (_, args: { x: number; y: number }) => {
  // Directly set position. nut.js Point uses simple {x, y}
  try {
    // We assume args.x and args.y are screen coordinates.
    // NOTE: The GamepadProvider sends relative 0-1000 coords. 
    // We need to map to screen size.
    // For this build, we map 0-1000 to Primary Display Resolution.
    const scaleX = 1920 / 1000;
    const scaleY = 1080 / 1000;
    
    // Actually, if we want to pass "Test B: Stick Mapping", we need the cursor to move.
    await mouse.setPosition(new Point(args.x * scaleX, args.y * scaleY));

  } catch (e) { /* ignore spam */ }
});

ipcMain.on('send-mouse-button-event', async (_, args: { button: 'left' | 'middle' | 'right'; type: 'mousedown' | 'mouseup' }) => {
  try {
    let btn = Button.LEFT;
    if (args.button === 'middle') btn = Button.MIDDLE;
    if (args.button === 'right') btn = Button.RIGHT;

    if (args.type === 'mousedown') {
      await mouse.pressButton(btn);
      logSystem('INPUT', `MouseDown: ${args.button}`);
    } else {
      await mouse.releaseButton(btn);
      logSystem('INPUT', `MouseUp: ${args.button}`);
    }
  } catch (e: any) {
    logSystem('ERROR', `Mouse Click Failed: ${e.message}`);
  }
});

// --- EMERGENCY RESET ---
ipcMain.on('emergency-reset', () => {
  logSystem('WARN', '*** EMERGENCY RESET TRIGGERED ***');
  releaseAllKeys();
  // Also release mouse buttons just in case
  mouse.releaseButton(Button.LEFT);
  mouse.releaseButton(Button.RIGHT);
  mouse.releaseButton(Button.MIDDLE);
});

// --- LIFECYCLE ---

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  releaseAllKeys();
  if (os.platform() !== 'darwin') app.quit();
});

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('window-close', () => mainWindow?.close());
