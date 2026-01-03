
# Known Issues & Limitations (v3.5.0)

## Critical Limitations
1.  **Input Injection (Portable Mode)**:
    *   The portable ZIP build relies on system-level hooks. If you encounter errors, please install the Visual C++ Redistributable 2015-2022.
    *   **Impact**: It may NOT work inside full-screen exclusive games with aggressive Anti-Cheat (Ricochet, Vanguard) without signing the driver.
    *   **Workaround**: Run the application as **Administrator**.

## Minor Bugs
1.  **Audio Exclusive Mode**:
    *   If another app takes exclusive control of the audio device, the startup sound effect may fail silently.

## Visual Glitches
1.  **Stick Drift Visualization**:
    *   The "Testing Hub" visualizer might show slight jitter even if deadzones are set. This is raw sensor noise visualization and does not affect the output (which is smoothed).
