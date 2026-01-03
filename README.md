
# 1Man1Machine by Hernan H
## Neural Performance Suite // Deployment Directive v3.5.0

**1Man1Machine** is a high-performance, low-latency neural mapping engine specifically engineered for the Sony DualSense controller. It combines a 1000Hz HID intercept kernel with a YOLOv8n neural tracking pipeline to provide professional-grade stick-to-mouse translation and aim stabilization.

---

### 🖥️ System Requirements
*   **Operating System**: Windows 11 (22H2 or newer recommended).
*   **Hardware**: Sony DualSense Controller (CFI-ZCT1W or CFI-ZCT1G).
*   **Interface**: USB-C Cable (Required for 1000Hz polling) or Bluetooth 5.0+.
*   **Software**: Node.js v18.0.0+ and a Chromium-based browser (Chrome/Edge) for WebHID support.
*   **Dependencies**: Visual C++ Redistributable 2015-2022 (Required for Input Injection).

---

### 🚀 Step-by-Step Installation

#### 1. Environment Preparation
Ensure you have **Node.js** installed on your Windows 11 machine.
*   Open PowerShell and type: `node -v`
*   If not installed, download the LTS version from [nodejs.org](https://nodejs.org/).

#### 2. Project Initialization
Download or clone the repository to your local drive.
```powershell
# Navigate to your project folder
cd C:\Path\To\1Man1Machine

# Install all neural and hardware dependencies (Ensure Visual Studio Build Tools are present)
npm install
```

#### 3. Launching the Suite
You can run the suite in two modes:

**A. Web Interface (Instant Deployment)**
Best for quick calibration and testing.
```powershell
npm run dev
```
*   Open [http://localhost:5173](http://localhost:5173) in Chrome or Edge.

**B. Desktop Application (Production Mode)**
Required for system-wide mapping and anti-cheat stealth protocols.
```powershell
npm run build:win
```
*   The installer will be generated in the `release/` folder.
*   Run the `.exe` to install the standalone 1Man1Machine kernel.

---

### 🎮 Hardware Linkage

1.  **USB Sync**: Connect your DualSense via USB-C.
2.  **Kernel Handshake**: 
    *   In the app, click the **"Engage Kernel"** button.
    *   If using the browser version, a popup will ask for HID permission. Select **"Wireless Controller"** or **"DualSense"** and click **Connect**.
3.  **Verification**: The top status bar should pulse green with the message `HID_SYNC_OK`.

---

### 🧠 Using the Neural Pipeline

1.  **Neural Vision**: Navigate to the **Console** tab.
2.  **Stream Source**: Click the **Monitor** icon to capture your game window or the **Camera** icon for a physical setup.
3.  **Targeting**: Toggle **"AI Neural Tracking"** in the Aim Assistance section.
4.  **Optimization**: Adjust the **"Neural Pull Weight"** to determine how much the AI assists your right-stick movement.

---

### 🛠️ Troubleshooting for Windows 11

*   **HID Access Denied**: Ensure no other remapper (like DS4Windows or Steam) is "hiding" the controller. Close those apps before launching 1Man1Machine.
*   **Input Injection Failed**: Ensure you have installed the Visual C++ Redistributables. Run the application as Administrator if targeted games block input.
*   **Latency Spikes**: Connect to a USB 3.0 port. Avoid USB hubs for the lowest possible interrupt latency.
*   **Neural Lag**: Ensure your GPU drivers are updated. 1Man1Machine uses WebGL/WebGPU acceleration via TensorFlow.js.

---
**Authored by Hernan H**  
*Production Build // Neural Interceptor Kernel v3.5.0*
