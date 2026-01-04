
# 1Man1Machine Testing Directive (Hybrid Build)

## Phase 1: Installation & Setup
1.  **Extract/Install**: Run `1Man1Machine Setup 3.5.0.exe` or extract the portable ZIP.
2.  **Prerequisites**: Ensure **Visual C++ Redistributable 2015-2022** is installed.
3.  **Run**: Launch `1Man1Machine.exe`.
4.  **Security**: If prompted by Windows SmartScreen, click **More Info -> Run Anyway**.

## Phase 2: Hardware Handshake
1.  **Connect**: Plug in DualSense via USB-C.
2.  **Link**: Click the **"CONNECT_HID"** button in the top right dashboard.
3.  **Select**: Choose **"Wireless Controller"** from the browser popup.
4.  **Verify**: Top-right status changes to `HID_SYNC_OK` (Green Pulse).

## Phase 3: Functional Smoke Test
**1. Notepad Injection Test**
*   Open Windows Notepad.
*   Press **CROSS** on controller.
*   **Pass**: A space character is typed.

**2. Mouse Movement Test**
*   Move **Right Stick**.
*   **Pass**: Mouse cursor moves on screen.
*   Press **R2**.
*   **Pass**: Left click is registered.

**3. Emergency Reset (Safety)**
*   **Hold CROSS** (typing spaces continuously).
*   **Hold L1 + R1 + SHARE** simultaneously.
*   **Pass**: Input stops immediately. All keys released.

## Phase 4: Final Check
*   Close the application.
*   Verify no "stuck" keys (e.g., keyboard isn't still typing spaces).
