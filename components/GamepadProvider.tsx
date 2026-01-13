import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { GamepadState, Profile, Mapping, ControllerButton, AxisMapping } from '../types';
import { DUALSENSE_INDICES } from '../constants';

interface GamepadContextType {
  state: GamepadState;
  resetStats: () => void;
  resetStickyStates: () => void;
  setAiTarget: (target: { x: number, y: number } | null) => void;
  isKernelActive: boolean;
  setKernelActive: (active: boolean) => void;
  connectHID: () => Promise<void>;
}

const GamepadContext = createContext<GamepadContextType | undefined>(undefined);

// Helper functions defined outside component to ensure stability
const applyResponseCurve = (val: number, type: string) => {
    const sign = Math.sign(val);
    const abs = Math.abs(val);
    let res = abs;

    switch (type) {
        case 'EXPONENTIAL':
            res = Math.pow(abs, 2.5);
            break;
        case 'S_CURVE':
            res = (abs * abs) / (abs * abs + (1 - abs) * (1 - abs));
            break;
        case 'INSTANT':
            res = abs > 0 ? 1 : 0;
            break;
        case 'LINEAR':
        default:
            res = abs;
    }
    return res * sign;
};

const processAxisPair = (rawX: number, rawY: number, configX?: AxisMapping, configY?: AxisMapping) => {
    const deadzone = configX?.deadzone || 0.1;
    const deadzoneOuter = configX?.deadzoneOuter || 1.0;
    const type = configX?.deadzoneType || 'CIRCULAR';
    const curve = configX?.curve || 'LINEAR';

    let x = rawX;
    let y = rawY;
    let mag = Math.sqrt(x*x + y*y);

    if (type === 'CIRCULAR') {
        if (mag < deadzone) {
            x = 0; y = 0; mag = 0;
        } else {
           const outer = deadzoneOuter;
           const effectiveMag = Math.min(mag, outer);
           const scale = (effectiveMag - deadzone) / (outer - deadzone);
           x = (x / mag) * scale;
           y = (y / mag) * scale;
           mag = scale; 
        }
    } else if (type === 'SQUARE' || type === 'AXIAL') {
        if (Math.abs(x) < deadzone) x = 0;
        else {
            const sign = Math.sign(x);
            x = sign * ((Math.abs(x) - deadzone) / (deadzoneOuter - deadzone));
            x = Math.max(-1, Math.min(1, x));
        }

        if (Math.abs(y) < deadzone) y = 0;
        else {
            const sign = Math.sign(y);
            y = sign * ((Math.abs(y) - deadzone) / (deadzoneOuter - deadzone));
            y = Math.max(-1, Math.min(1, y));
        }
        mag = Math.sqrt(x*x + y*y);
    } else if (type === 'CROSS') {
        if (Math.abs(x) < deadzone) x = 0;
        if (Math.abs(y) < deadzone) y = 0;
        if (x !== 0) x = Math.sign(x) * ((Math.abs(x) - deadzone) / (deadzoneOuter - deadzone));
        if (y !== 0) y = Math.sign(y) * ((Math.abs(y) - deadzone) / (deadzoneOuter - deadzone));
        x = Math.max(-1, Math.min(1, x));
        y = Math.max(-1, Math.min(1, y));
        mag = Math.sqrt(x*x + y*y);
    }

    if (type === 'CIRCULAR' && mag > 0) {
        const curvedMag = applyResponseCurve(mag, curve);
        const scale = curvedMag / mag;
        x *= scale;
        y *= scale;
    } else {
        x = applyResponseCurve(x, curve);
        y = applyResponseCurve(y, curve);
    }
    return [x, y];
};

export const GamepadProvider: React.FC<{ children: React.ReactNode, activeProfile: Profile }> = ({ children, activeProfile }) => {
  const [isKernelActive, setKernelActive] = useState(true);
  
  // LOGIC STATE (Source of Truth for High-Freq Loop)
  const logicState = useRef<GamepadState>({
    connected: false,
    id: null,
    buttons: {},
    axes: [0, 0, 0, 0],
    rawAxes: [0, 0, 0, 0],
    heatmap: {},
    sessionStartTime: new Date(),
    totalInputs: 0,
    turboTicks: {},
    stickyStates: {},
    toggleStates: {},
    captureTriggered: false,
    aiDetectedTarget: null,
    virtualKeys: new Set<string>(),
    mousePosition: { x: 500, y: 500 },
  });

  // UI STATE (Snapshot for React Rendering)
  const [uiState, setUiState] = useState<GamepadState>(logicState.current);

  // Event Tracking Refs
  const lastButtonsRef = useRef<Record<number, boolean>>({});
  const prevVirtualKeysRef = useRef<Set<string>>(new Set());
  const prevMouseButtonsRef = useRef<Set<'left' | 'middle' | 'right'>>(new Set());
  
  // Logic Helpers Refs
  const mousePosRef = useRef({ x: 500, y: 500 });
  const smoothedRightStickRef = useRef({ x: 0, y: 0 });
  const prevTimeRef = useRef(performance.now());
  const lastPollTimeRef = useRef(0);
  const profileRef = useRef(activeProfile);
  const aiTargetRef = useRef<{ x: number, y: number } | null>(null);

  // --- NEURAL CONTROL REFS ---
  const pidStateRef = useRef({ 
      integralX: 0, integralY: 0, 
      prevErrorX: 0, prevErrorY: 0 
  });
  const lastKnownTargetRef = useRef<{ x: number, y: number } | null>(null);
  const targetLossTimeoutRef = useRef(0);
  
  // Predictive Tracking Ref
  const targetVelocityRef = useRef({ vx: 0, vy: 0, lastX: 0, lastY: 0, lastTime: 0 });

  useEffect(() => { 
    profileRef.current = activeProfile; 
  }, [activeProfile]);

  const connectHID = async () => {
    try {
      if ('hid' in navigator) {
        const devices = await (navigator as any).hid.requestDevice({
          filters: [{ vendorId: 0x054C }, { vendorId: 0x054c }]
        });
        
        if (devices.length > 0) {
           const device = devices[0];
           console.log("HID Device Authorized:", device.productName);
           if (!device.opened) {
              await device.open();
           }
           logicState.current.connected = true;
           logicState.current.id = device.productName;
        }
      }
    } catch (e) {
      console.error("HID Connection failed:", e);
    }
  };

  // HID Lifecycle Management
  useEffect(() => {
    if (!('hid' in navigator)) return;

    const handleConnect = (e: any) => {
        console.log("HID Device Connected:", e.device.productName);
        logicState.current.connected = true;
    };

    const handleDisconnect = (e: any) => {
        console.log("HID Device Disconnected:", e.device.productName);
        logicState.current.connected = false;
    };

    (navigator as any).hid.addEventListener('connect', handleConnect);
    (navigator as any).hid.addEventListener('disconnect', handleDisconnect);

    // Attempt to restore persistent permissions
    (navigator as any).hid.getDevices().then((devices: any[]) => {
        const sony = devices.find(d => d.vendorId === 0x054C || d.vendorId === 0x054c);
        if (sony) {
           console.log("Restoring HID Session:", sony.productName);
           if (!sony.opened) {
               sony.open().catch((err: any) => console.warn("Failed to open HID:", err));
           }
           logicState.current.connected = true;
           logicState.current.id = sony.productName;
        }
    }).catch((err: any) => {
        // Suppress errors if policy blocks auto-access (user must manually connect)
        console.warn("HID Auto-Restore blocked by policy:", err);
    });

    return () => {
        (navigator as any).hid.removeEventListener('connect', handleConnect);
        (navigator as any).hid.removeEventListener('disconnect', handleDisconnect);
    };
  }, []);

  const emergencyReset = () => {
    logicState.current.stickyStates = {};
    logicState.current.virtualKeys = new Set();
    logicState.current.turboTicks = {};
    
    if (window.icoreBridge?.emergencyReset) {
        window.icoreBridge.emergencyReset();
    }
    console.log("Emergency Reset Triggered - All Keys Released");
  };

  const resetStats = () => {
      logicState.current.totalInputs = 0;
      logicState.current.heatmap = {};
  };

  const resetStickyStates = () => {
      logicState.current.stickyStates = {};
  };

  // --- ENGINE 1: HIGH FREQUENCY POLLING LOOP (Interval) ---
  // Decoupled from Frame Rate for 1000Hz Capability
  useEffect(() => {
    if (!isKernelActive) return;

    const intervalId = setInterval(() => {
        const now = performance.now();
        const profile = profileRef.current;
        
        // Throttling Check based on Profile
        if (now - lastPollTimeRef.current < 1000 / profile.pollingRate) {
           return;
        }
        lastPollTimeRef.current = now;
        const deltaTime = (now - prevTimeRef.current) / 1000;
        prevTimeRef.current = now;

        const gp = navigator.getGamepads()[0];
        if (!gp) {
            // Note: We don't force false here if HID is active, to allow hybrid state
            // But if getGamepads is null, we can't read inputs anyway.
            if (logicState.current.connected && !logicState.current.id?.includes("HID")) {
                 logicState.current.connected = false; 
            }
            return;
        }

        const state = logicState.current;
        const rawButtons: Record<number, boolean> = {};
        gp.buttons.forEach((btn, idx) => { rawButtons[idx] = btn.pressed; });

        // EMERGENCY COMBO: L1 (4) + R1 (5) + SHARE (8)
        if (rawButtons[4] && rawButtons[5] && rawButtons[8]) {
            emergencyReset();
            return;
        }

        // --- AXIS PROCESSING ---
        const rawAxes = [...gp.axes];
        const lsConfigX = profile.axisMappings.find(a => a.axis === 'LEFT_STICK_X');
        const lsConfigY = profile.axisMappings.find(a => a.axis === 'LEFT_STICK_Y');
        const [lsX, lsY] = processAxisPair(rawAxes[0], rawAxes[1], lsConfigX, lsConfigY);

        const rsConfigX = profile.axisMappings.find(a => a.axis === 'RIGHT_STICK_X');
        const rsConfigY = profile.axisMappings.find(a => a.axis === 'RIGHT_STICK_Y');
        const [rsX_Proc, rsY_Proc] = processAxisPair(rawAxes[2], rawAxes[3], rsConfigX, rsConfigY);

        let rsX = rsX_Proc;
        let rsY = rsY_Proc;
        
        // Stabilization
        let stabFactor = 0;
        switch (profile.accessibility.stabilizationMode) {
            case 'Light': stabFactor = 0.25; break;
            case 'Medium': stabFactor = 0.50; break;
            case 'Heavy': stabFactor = 0.85; break;
            case 'Custom': stabFactor = profile.accessibility.aimStabilizationStrength / 100; break;
            case 'Off': stabFactor = 0; break;
        }

        if (stabFactor > 0) {
            smoothedRightStickRef.current.x = smoothedRightStickRef.current.x * stabFactor + rsX * (1 - stabFactor);
            smoothedRightStickRef.current.y = smoothedRightStickRef.current.y * stabFactor + rsY * (1 - stabFactor);
            rsX = smoothedRightStickRef.current.x;
            rsY = smoothedRightStickRef.current.y;
        } else {
            smoothedRightStickRef.current = { x: rsX, y: rsY };
        }

        // --- NEURAL AIM ASSIST & TARGET TRACKING ---
        // Logic: If target is detected AND (Right Click/R2 OR Left Click/L2 is held), Lock & Follow
        let target = aiTargetRef.current;
        const neuralConfig = profile.accessibility;
        let finalVelX = 0;
        let finalVelY = 0;

        const sensitivity = rsConfigX?.sensitivity || 50;
        finalVelX = rsX * sensitivity * 0.5;
        finalVelY = rsY * sensitivity * 0.5;

        // TARGET PERSISTENCE / MEMORY
        // If AI loses target momentarily, keep aiming at last known spot for ~400ms
        if (target) {
            lastKnownTargetRef.current = target;
            targetLossTimeoutRef.current = 0;
            
            // PREDICTIVE TRACKING: Update Velocity
            const dtVelocity = (now - targetVelocityRef.current.lastTime) / 1000;
            if (dtVelocity > 0 && dtVelocity < 0.2) {
                const rawVx = (target.x - targetVelocityRef.current.lastX) / dtVelocity;
                const rawVy = (target.y - targetVelocityRef.current.lastY) / dtVelocity;
                
                // Exponential Smoothing for Velocity (Low Pass Filter)
                const alpha = 0.3; 
                targetVelocityRef.current.vx = targetVelocityRef.current.vx * (1 - alpha) + rawVx * alpha;
                targetVelocityRef.current.vy = targetVelocityRef.current.vy * (1 - alpha) + rawVy * alpha;
            }
            targetVelocityRef.current.lastX = target.x;
            targetVelocityRef.current.lastY = target.y;
            targetVelocityRef.current.lastTime = now;

        } else if (lastKnownTargetRef.current) {
            targetLossTimeoutRef.current += deltaTime * 1000;
            if (targetLossTimeoutRef.current < 400) {
                target = lastKnownTargetRef.current;
                
                // Decay velocity on signal loss
                targetVelocityRef.current.vx *= 0.95;
                targetVelocityRef.current.vy *= 0.95;
            } else {
                lastKnownTargetRef.current = null;
                targetVelocityRef.current = { vx: 0, vy: 0, lastX: 0, lastY: 0, lastTime: 0 };
            }
        }

        // Check Trigger States for Activation (L2=6, R2=7)
        // User requested tracking on "R2 or Right Click Release" (interpreted as Hold R2 or L2)
        const isTriggerActive = rawButtons[6] || rawButtons[7];

        if (neuralConfig.yoloEnabled && target && isTriggerActive) {
            // Apply Prediction: Where will the target be in 50ms?
            const predictionLookahead = 0.05; // 50ms compensation
            const predX = target.x + (targetVelocityRef.current.vx * predictionLookahead);
            const predY = target.y + (targetVelocityRef.current.vy * predictionLookahead);

            const dx = predX - 0.5; 
            const dy = predY - 0.5;
            
            // PID Controller Implementation for "Sticky" Lock
            // Increased Gains for Snappier Locking
            const Kp = (neuralConfig.yoloTrackingPower || 35) / 80; // Slightly higher base gain
            const Ki = 0.15; // Increased Integral for holding power
            const Kd = 0.08; // Increased Derivative for damping prediction overshoot

            pidStateRef.current.integralX += dx * deltaTime;
            pidStateRef.current.integralY += dy * deltaTime;

            // Anti-Windup
            const maxIntegral = 0.3;
            pidStateRef.current.integralX = Math.max(-maxIntegral, Math.min(maxIntegral, pidStateRef.current.integralX));
            pidStateRef.current.integralY = Math.max(-maxIntegral, Math.min(maxIntegral, pidStateRef.current.integralY));

            const derivativeX = (dx - pidStateRef.current.prevErrorX) / deltaTime;
            const derivativeY = (dy - pidStateRef.current.prevErrorY) / deltaTime;

            pidStateRef.current.prevErrorX = dx;
            pidStateRef.current.prevErrorY = dy;

            // Calculate Force
            const forceX = (Kp * dx + Ki * pidStateRef.current.integralX + Kd * derivativeX) * 2000;
            const forceY = (Kp * dy + Ki * pidStateRef.current.integralY + Kd * derivativeY) * 2000;

            // Apply Tracking Force
            finalVelX += forceX; 
            finalVelY += forceY;
        } else {
            // Reset PID when lock is released or lost
            pidStateRef.current = { integralX: 0, integralY: 0, prevErrorX: 0, prevErrorY: 0 };
        }

        // Mouse Injection
        if (Math.abs(finalVelX) > 0 || Math.abs(finalVelY) > 0) {
            mousePosRef.current.x += finalVelX * deltaTime * 100;
            mousePosRef.current.y += finalVelY * deltaTime * 100;
            // Clamp roughly to screen space logic (though actual injection uses OS coords via IPC)
            mousePosRef.current.x = Math.max(0, Math.min(1000, mousePosRef.current.x));
            mousePosRef.current.y = Math.max(0, Math.min(1000, mousePosRef.current.y));
            window.icoreBridge?.sendMouseMove({ x: mousePosRef.current.x, y: mousePosRef.current.y });
        }

        // --- BUTTON PROCESSING ---
        const nextVirtualKeys = new Set<string>();
        const nextMouseButtons = new Set<'left' | 'middle' | 'right'>();
        const nextStickyStates = state.stickyStates; // Mutation allowed on ref state
        const nextHeatmap = state.heatmap;
        let newTotalInputs = state.totalInputs;

        // Stick-to-WASD Logic
        const leftStickConfig = profile.axisMappings.find(a => a.axis === 'LEFT_STICK_X' && a.mappedTo === 'WASD');
        if (leftStickConfig) {
            const threshold = 0.5; 
            if (lsY < -threshold) nextVirtualKeys.add('KeyW');
            else if (lsY > threshold) nextVirtualKeys.add('KeyS');
            if (lsX < -threshold) nextVirtualKeys.add('KeyA');
            else if (lsX > threshold) nextVirtualKeys.add('KeyD');
        }
        
        // --- RAPID FIRE (TURBO) LOGIC PRE-CALCULATION ---
        const turboRate = profile.accessibility.globalTurboRate || 10; // Clicks per second
        const turboInterval = 1000 / turboRate; // ms per cycle
        // If current time falls in the first half of the interval, it's ON. Otherwise OFF.
        const isTurboPhase = Math.floor(now / turboInterval) % 2 === 0;

        Object.keys(rawButtons).forEach((key) => {
            const idx = parseInt(key);
            const btnName = DUALSENSE_INDICES[idx] as ControllerButton;
            const mapping = profile.mappings.find(m => m.button === btnName);

            // Edge Detection
            if (rawButtons[idx] && !lastButtonsRef.current[idx]) {
                newTotalInputs++;
                if (btnName) nextHeatmap[btnName] = (nextHeatmap[btnName] || 0) + 1;
                if (mapping?.isSticky) nextStickyStates[btnName] = !nextStickyStates[btnName];
            }

            const active = rawButtons[idx] || nextStickyStates[btnName];
            if (active && mapping) {
                // RAPID FIRE INJECTION
                // If this is R2 (Fire) and Rapid Fire is enabled in global accessibility
                // We suppress the output during the "OFF" phase
                let shouldRegister = true;
                if ((btnName === 'R2' || mapping.mappedTo === 'FIRE') && profile.accessibility.rapidFireEnabled) {
                    if (!isTurboPhase) {
                        shouldRegister = false;
                    }
                }

                if (shouldRegister) {
                    if (mapping.type === 'KEYBOARD' && mapping.keyCode) {
                        nextVirtualKeys.add(mapping.keyCode);
                    } else if (mapping.type === 'MOUSE') {
                        const btn = mapping.mouseButton === 0 ? 'left' : mapping.mouseButton === 1 ? 'middle' : 'right';
                        nextMouseButtons.add(btn);
                    }
                }
            }
        });

        // --- IPC INJECTION ---
        const prevKeys = prevVirtualKeysRef.current;
        for (const key of nextVirtualKeys) if (!prevKeys.has(key)) window.icoreBridge?.sendKeyEvent({ keyCode: key, type: 'keydown' });
        for (const key of prevKeys) if (!nextVirtualKeys.has(key)) window.icoreBridge?.sendKeyEvent({ keyCode: key, type: 'keyup' });
        prevVirtualKeysRef.current = nextVirtualKeys;

        const prevMouse = prevMouseButtonsRef.current;
        for (const btn of nextMouseButtons) if (!prevMouse.has(btn)) window.icoreBridge?.sendMouseButtonEvent({ button: btn, type: 'mousedown' });
        for (const btn of prevMouse) if (!nextMouseButtons.has(btn)) window.icoreBridge?.sendMouseButtonEvent({ button: btn, type: 'mouseup' });
        prevMouseButtonsRef.current = nextMouseButtons;
        
        lastButtonsRef.current = rawButtons;

        // UPDATE SOURCE OF TRUTH
        logicState.current = {
            ...state,
            connected: true,
            id: gp.id,
            buttons: rawButtons,
            axes: [lsX, lsY, rsX, rsY],
            rawAxes: [...gp.axes],
            heatmap: nextHeatmap,
            totalInputs: newTotalInputs,
            stickyStates: nextStickyStates,
            virtualKeys: nextVirtualKeys,
            mousePosition: { ...mousePosRef.current },
            aiDetectedTarget: aiTargetRef.current
        };

    }, 2); // 2ms = 500Hz Polling Target

    return () => clearInterval(intervalId);
  }, [isKernelActive]);

  // --- ENGINE 2: VISUAL SYNC LOOP (RAF) ---
  // Synchronizes Logic State to UI at Screen Refresh Rate (60/144Hz)
  useEffect(() => {
    let rafId: number;
    const loop = () => {
        // Clone state to trigger React render, but only for UI consumption
        setUiState({ ...logicState.current });
        rafId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <GamepadContext.Provider value={{ 
      state: uiState, 
      resetStats, 
      resetStickyStates,
      setAiTarget: (t) => { aiTargetRef.current = t; },
      isKernelActive,
      setKernelActive,
      connectHID
    }}>
      {children}
    </GamepadContext.Provider>
  );
};

export const useGamepad = () => {
  const context = useContext(GamepadContext);
  if (!context) throw new Error('useGamepad failure');
  return context;
};