
import { contextBridge, ipcRenderer } from 'electron';

/**
 * 1Man1Machine Desktop - Preload Bridge
 * Securely exposes HID Kernel APIs to the renderer process.
 */

const ICORE_API = {
  version: "3.5.0-STABLE",
  
  // Window Controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Process Info
  getRunningProcesses: () => ipcRenderer.invoke('get-processes'),

  // Logs
  openLogsFolder: () => ipcRenderer.invoke('open-logs'),

  // OS-Level Input Injection
  sendKeyEvent: (args: { keyCode: string; type: 'keydown' | 'keyup' }) => {
    ipcRenderer.send('send-key-event', args);
  },
  sendMouseMove: (args: { x: number; y: number }) => {
    ipcRenderer.send('send-mouse-move', args);
  },
  sendMouseButtonEvent: (args: { button: 'left' | 'middle' | 'right'; type: 'mousedown' | 'mouseup' }) => {
    ipcRenderer.send('send-mouse-button-event', args);
  },
  
  // Critical Safety
  emergencyReset: () => ipcRenderer.send('emergency-reset'),
  
  // File System Access for Training Data
  saveTrainingData: (data: any) => ipcRenderer.invoke('save-training-data', data),

  // Callbacks from Main
  onKernelLog: (callback: (log: string) => void) => 
    ipcRenderer.on('kernel-log', (_event, log) => callback(log)),
  
  onGameDetected: (callback: (processName: string | null) => void) => 
    ipcRenderer.on('game-detected', (_event, processName) => callback(processName)),
};

contextBridge.exposeInMainWorld('icoreBridge', ICORE_API);
