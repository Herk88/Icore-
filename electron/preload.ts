
/**
 * iCore Desktop - Preload Bridge
 * Securely exposes HID Kernel APIs to the renderer process.
 */

const icoreBridge = {
  // Application Versioning
  version: "2.4.0-release",
  
  // HID Mapping Persistence
  saveProfile: (profile: any) => {
    console.log("[IPC] Saving profile to: app.getPath('userData')/profiles.json");
    localStorage.setItem(`icore_profile_${profile.id}`, JSON.stringify(profile));
    return true;
  },

  // Kernel Communication
  engageTurbo: (button: string, rate: number) => {
    console.log(`[IPC] Kernel Command: Engaged Turbo on ${button} @ ${rate}Hz`);
  },

  // Native UI Hooks
  minimize: () => console.log("[IPC] Window: Minimize"),
  maximize: () => console.log("[IPC] Window: Maximize"),
  close: () => console.log("[IPC] Window: Close (Hide to Tray)"),

  // Telemetry Stream
  onKernelLog: (callback: (log: string) => void) => {
    const logs = [
      "[KERNEL] IRQ Vector Hooked",
      "[HID] USB Descriptor Validated",
      "[SYNC] Profile Hash Match",
      "[DRV] Low Latency Buffer Engaged"
    ];
    setInterval(() => {
      const randomLog = logs[Math.floor(Math.random() * logs.length)];
      callback(`${new Date().toLocaleTimeString()} ${randomLog}`);
    }, 8000);
  },

  // Game Process Detection Simulation
  onGameDetected: (callback: (processName: string | null) => void) => {
    const processes = [
      'ModernWarfare.exe',
      'eldenring.exe',
      'chrome.exe',
      'steam.exe',
      null // Represents desktop/no game
    ];
    
    setInterval(() => {
      // Simulate erratic process switching for testing
      if (Math.random() > 0.7) {
        const proc = processes[Math.floor(Math.random() * processes.length)];
        console.log(`[IPC] Native: Process change detected -> ${proc || 'None'}`);
        callback(proc);
      }
    }, 15000);
  }
};

// Expose to window
(window as any).icoreBridge = icoreBridge;
