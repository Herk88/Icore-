
# 1Man1Machine Testing Directive

## Phase 1: Installation & Setup
1.  **Extract the ZIP**: If using the portable build, extract all files to a local folder (e.g., Desktop). Do not run from inside the ZIP.
2.  **Run the Executable**: Launch `1Man1Machine.exe`.
3.  **Security Prompt**: Windows may flag the app as "Unrecognized". Click **More Info -> Run Anyway** (this is normal for unsigned independent software).

## Phase 2: Hardware Link
1.  **Plug in DualSense**: Connect via USB-C.
2.  **Check Status**: Look at the top-right of the dashboard window.
    *   **RED PULSE**: Controller not found.
    *   **GREEN PULSE**: `HID_SYNC_OK`.
3.  **Manual Sync**: If RED, click the status badge. A browser-style popup may appear. Select "Wireless Controller" and click "Connect".

## Phase 3: Validation Testing
**Test A: Input Recognition**
1.  Navigate to the **Console** tab.
2.  Press buttons on your physical controller.
3.  Verify the on-screen 3D controller highlights the corresponding buttons in Blue.

**Test B: Stick Mapping**
1.  Move the Left Stick. Verify the on-screen Left Stick moves.
2.  Move the Right Stick. Verify the on-screen Right Stick moves.
3.  Go to **Stacks** -> **Universal Native** (Default Profile).
4.  Verify moving the Right Stick moves your Windows Mouse Cursor.

**Test C: Emergency Reset**
1.  Press **L2** (Mapped to Right Click toggle). If it gets stuck or behaves unexpectedly:
2.  **HOLD L1 + R1 + SHARE** simultaneously.
3.  Verify all inputs stop immediately.

## Phase 4: Troubleshooting
**Logs**:
*   Go to **Analytics** tab.
*   Click **View System Logs**.
*   A folder will open containing `.log` files. Attach these if reporting bugs.

**Known Issue**: Input Injection requires the app to be run as Administrator for some games (Valorant, COD) due to anti-cheat protections.
