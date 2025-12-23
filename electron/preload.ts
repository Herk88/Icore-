
// Preload Script for IPC Bridge
// Context Isolation: True

window.addEventListener('DOMContentLoaded', () => {
  console.log("[PRELOAD] iCore Bridge Active.");
});

// Expose safe APIs to renderer
(window as any).icoreBridge = {
  getSystemInfo: () => ({ platform: 'win32', version: '2.4.0' }),
  sendMapping: (mapping: any) => console.log("[IPC] Outbound mapping to kernel:", mapping),
  onKernelLog: (callback: Function) => {
    // Simulated subscription
    setInterval(() => callback(`Log: ${Date.now()}`), 5000);
  }
};
