
# Known Issues & Limitations (v3.5.0)

## Critical Limitations
1.  **Input Injection (OS Automation)**:
    *   This build uses OS-level automation (nut-js) for keyboard and mouse injection.
    *   It works in desktop applications (Notepad, browsers, windowed games).
    *   It may not work in games that use kernel-level anti-cheat or exclusive fullscreen.
    *   **Workaround**: Run the application as **Administrator**.

2.  **Background Throttling (Hybrid Architecture)**:
    *   Because controller reading is currently handled by the Renderer (WebHID), input polling may pause or stutter if the application window is minimized or fully obscured.
    *   **Workaround**: Keep the 1Man1Machine window open and visible on a secondary monitor or behind your game window (do not minimize to tray yet).

## Minor Bugs
1.  **Audio Exclusive Mode**:
    *   If another app takes exclusive control of the audio device, the startup sound effect may fail silently.

## Visual Glitches
1.  **Stick Drift Visualization**:
    *   The "Testing Hub" visualizer might show slight jitter even if deadzones are set. This is raw sensor noise visualization and does not affect the output (which is smoothed).
