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

const applyResponseCurve = (val: number, type: string) => {
    const sign = Math.sign(val);
    const abs = Math.abs(val);
    let res = abs;
    switch (type) {
        case 'EXPONENTIAL': res = Math.pow(abs, 2.5); break;
        case 'S_CURVE': res = (abs * abs) / (abs * abs + (1 - abs) * (1 - abs)); break;
        case 'INSTANT': res = abs > 0 ? 1 : 0; break;
        default: res = abs;
    }
    return res * sign;
};

const processAxisPair = (rawX: number, rawY: number, configX?: AxisMapping, configY?: AxisMapping) => {
    const deadzone = configX?.deadzone || 0.1;
    const type = configX?.deadzoneType || 'CIRCULAR';
    const curve = configX?.curve || 'LINEAR';
    let x = rawX;
    let y = rawY;
    let mag = Math.sqrt(x*x + y*y);

    if (type === 'CIRCULAR') {
        if (mag < deadzone) { x = 0; y = 0; }
        else {
           const scale = (mag - deadzone) / (1 - deadzone);
           x = (x / mag) * scale;
           y = (y / mag) * scale;
        }
    } else {
        if (Math.abs(x) < deadzone) x = 0;
        if (Math.abs(y) < deadzone) y = 0;
    }
    x = applyResponseCurve(x, curve);
    y = applyResponseCurve(y, curve);
    return [x, y];
};

export const GamepadProvider: React.FC<{ children: React.ReactNode, activeProfile: Profile }> = ({ children, activeProfile }) => {
  const [isKernelActive, setKernelActive] = useState(true);
  
  const logicState = useRef<GamepadState>({
    connected: false, id: null, buttons: {}, axes: [0,0,0,0], rawAxes: [0,0,0,0],
    heatmap: {}, sessionStartTime: new Date(), totalInputs: 0, turboTicks: {},
    stickyStates: {}, toggleStates: {}, captureTriggered: false, aiDetectedTarget: null,
    virtualKeys: new Set(), mousePosition: { x: 500, y: 500 },
  });

  const [uiState, setUiState] = useState<GamepadState>(logicState.current);
  const prevVirtualKeysRef = useRef<Set<string>>(new Set());
  const prevMouseButtonsRef = useRef<Set<'left' | 'middle' | 'right'>>(new Set());
  const lastPollTimeRef = useRef(0);
  const profileRef = useRef(activeProfile);
  const aiTargetRef = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => { profileRef.current = activeProfile; }, [activeProfile]);

  const connectHID = async () => {
    try {
      if ('hid' in navigator) {
        const devices = await (navigator as any).hid.requestDevice({ filters: [{ vendorId: 0x054C }] });
        if (devices.length > 0) {
           await devices[0].open();
           logicState.current.connected = true;
        }
      }
    } catch (e) { console.error("HID Connection failed:", e); }
  };

  useEffect(() => {
    if (!isKernelActive) return;
    const intervalId = setInterval(() => {
        const now = performance.now();
        const profile = profileRef.current;
        if (now - lastPollTimeRef.current < 1000 / profile.pollingRate) return;
        lastPollTimeRef.current = now;

        const gp = navigator.getGamepads()[0];
        if (!gp) { if(logicState.current.connected) logicState.current.connected=false; return; }

        const rawButtons: Record<number, boolean> = {};
        gp.buttons.forEach((btn, idx) => { rawButtons[idx] = btn.pressed; });
        const rawAxes = [...gp.axes];
        
        const [lsX, lsY] = processAxisPair(rawAxes[0], rawAxes[1], profile.axisMappings.find(a=>a.axis==='LEFT_STICK_X'), profile.axisMappings.find(a=>a.axis==='LEFT_STICK_Y'));
        let [rsX, rsY] = processAxisPair(rawAxes[2], rawAxes[3], profile.axisMappings.find(a=>a.axis==='RIGHT_STICK_X'), profile.axisMappings.find(a=>a.axis==='RIGHT_STICK_Y'));

        // --- Aim Physics: Friction & Magnetism ---
        if (aiTargetRef.current) {
            // 1. Aim Slowdown (Friction)
            if (profile.accessibility.aimSlowdownEnabled) {
                const SLOWDOWN_FACTOR = 0.6; // 40% reduction
                rsX *= SLOWDOWN_FACTOR;
                rsY *= SLOWDOWN_FACTOR;
            }

            // 2. Snap-to-Target (Magnetism)
            if (profile.accessibility.snapToTargetEnabled) {
                // Calculate vector to target from center (0.5, 0.5)
                // Convert normalized coordinates to relative vector (-1 to 1)
                const tx = (aiTargetRef.current.x - 0.5) * 2; 
                const ty = (aiTargetRef.current.y - 0.5) * 2;
                
                // Only engage if stick is active (anti-stick-drift measure)
                if (Math.abs(rsX) > 0.05 || Math.abs(rsY) > 0.05) {
                    const PULL_STRENGTH = 0.02 * (profile.accessibility.autoAimStrength || 15) / 10;
                    rsX += tx * PULL_STRENGTH;
                    rsY += ty * PULL_STRENGTH;
                }
            }
        }
        // ----------------------------------------

        const nextVirtualKeys = new Set<string>();
        Object.keys(rawButtons).forEach((key) => {
            const idx = parseInt(key);
            const btnName = DUALSENSE_INDICES[idx] as ControllerButton;
            const mapping = profile.mappings.find(m => m.button === btnName);
            if (rawButtons[idx] && mapping?.type === 'KEYBOARD') nextVirtualKeys.add(mapping.keyCode);
        });
        
        // Simulating IPC for demo
        const prevKeys = prevVirtualKeysRef.current;
        for (const key of nextVirtualKeys) if (!prevKeys.has(key)) window.icoreBridge?.sendKeyEvent({ keyCode: key, type: 'keydown' });
        for (const key of prevKeys) if (!nextVirtualKeys.has(key)) window.icoreBridge?.sendKeyEvent({ keyCode: key, type: 'keyup' });
        prevVirtualKeysRef.current = nextVirtualKeys;

        // Send Mouse Movement (Inject smoothed/modified stick values)
        // Check if Right Stick is mapped to MOUSE_MOVEMENT
        const isRsMouse = profile.axisMappings.find(a => a.axis === 'RIGHT_STICK_X')?.mappedTo === 'MOUSE_MOVEMENT';
        if (isRsMouse && (Math.abs(rsX) > 0 || Math.abs(rsY) > 0)) {
            // Scale -1..1 to reasonable pixel delta
            const sensitivity = profile.axisMappings.find(a => a.axis === 'RIGHT_STICK_X')?.sensitivity || 50;
            const deltaX = rsX * (sensitivity * 0.5); 
            const deltaY = rsY * (sensitivity * 0.5);
            window.icoreBridge?.sendMouseMove({ x: deltaX, y: deltaY }); 
        }

        logicState.current = {
            ...logicState.current, connected: true, id: gp.id, buttons: rawButtons,
            axes: [lsX, lsY, rsX, rsY], rawAxes: rawAxes, totalInputs: logicState.current.totalInputs + 1,
            virtualKeys: nextVirtualKeys, aiDetectedTarget: aiTargetRef.current
        };
    }, 2);
    return () => clearInterval(intervalId);
  }, [isKernelActive]);

  useEffect(() => {
    let rafId: number;
    const loop = () => { setUiState({ ...logicState.current }); rafId = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <GamepadContext.Provider value={{ state: uiState, resetStats: () => {}, resetStickyStates: () => {}, setAiTarget: (t) => { aiTargetRef.current = t; }, isKernelActive, setKernelActive, connectHID }}>
      {children}
    </GamepadContext.Provider>
  );
};
export const useGamepad = () => { const c = useContext(GamepadContext); if (!c) throw new Error('useGamepad failure'); return c; };