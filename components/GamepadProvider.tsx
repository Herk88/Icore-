
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

export const GamepadProvider: React.FC<{ children: React.ReactNode, activeProfile: Profile }> = ({ children, activeProfile }) => {
  const [isKernelActive, setKernelActive] = useState(true);
  const [state, setState] = useState<GamepadState>({
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

  const lastButtonsRef = useRef<Record<number, boolean>>({});
  const requestRef = useRef<number | undefined>(undefined);
  const profileRef = useRef(activeProfile);
  const aiTargetRef = useRef<{ x: number, y: number } | null>(null);
  const virtualKeysRef = useRef<Set<string>>(new Set());
  const lastPollTimeRef = useRef<number>(0);
  
  // State refs for event detection
  const prevVirtualKeysRef = useRef<Set<string>>(new Set());
  const prevMouseButtonsRef = useRef<Set<'left' | 'middle' | 'right'>>(new Set());

  // Mouse Accumulators
  const mousePosRef = useRef({ x: 500, y: 500 });
  const prevTimeRef = useRef(performance.now());
  
  // Stabilization Filters
  const smoothedRightStickRef = useRef({ x: 0, y: 0 });

  useEffect(() => { 
    profileRef.current = activeProfile; 
  }, [activeProfile]);

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

  const connectHID = async () => {
    try {
      if ('hid' in navigator) {
        const devices = await (navigator as any).hid.requestDevice({
          filters: [{ vendorId: 0x054C }, { vendorId: 0x054c }]
        });
        
        if (devices.length > 0) {
           console.log("HID Device Connected:", devices[0]);
           await devices[0].open();
        }
      }
    } catch (e) {
      console.error("HID Connection failed:", e);
    }
  };

  const emergencyReset = () => {
    setState(prev => ({
        ...prev,
        stickyStates: {},
        virtualKeys: new Set(),
        turboTicks: {}
    }));
    // CRITICAL: Tell Main process to release all held keys
    if (window.icoreBridge?.emergencyReset) {
        window.icoreBridge.emergencyReset();
    }
    console.log("Emergency Reset Triggered - All Keys Released");
  };

  const updateGamepadState = () => {
    requestRef.current = requestAnimationFrame(updateGamepadState);
    if (!isKernelActive) return;

    const now = performance.now();
    const profile = profileRef.current;
    
    if (now - lastPollTimeRef.current < 1000 / profile.pollingRate) {
      return;
    }
    lastPollTimeRef.current = now;
    const deltaTime = (now - prevTimeRef.current) / 1000;
    prevTimeRef.current = now;

    const gp = navigator.getGamepads()[0];

    if (gp) {
      const rawButtons: Record<number, boolean> = {};
      gp.buttons.forEach((btn, idx) => { rawButtons[idx] = btn.pressed; });

      // EMERGENCY COMBO: L1 (4) + R1 (5) + SHARE (8)
      if (rawButtons[4] && rawButtons[5] && rawButtons[8]) {
          emergencyReset();
          return;
      }

      const rawAxes = [...gp.axes];
      const lsConfigX = profile.axisMappings.find(a => a.axis === 'LEFT_STICK_X');
      const lsConfigY = profile.axisMappings.find(a => a.axis === 'LEFT_STICK_Y');
      const [lsX, lsY] = processAxisPair(rawAxes[0], rawAxes[1], lsConfigX, lsConfigY);

      const rsConfigX = profile.axisMappings.find(a => a.axis === 'RIGHT_STICK_X');
      const rsConfigY = profile.axisMappings.find(a => a.axis === 'RIGHT_STICK_Y');
      const [rsX_Proc, rsY_Proc] = processAxisPair(rawAxes[2], rawAxes[3], rsConfigX, rsConfigY);

      let rsX = rsX_Proc;
      let rsY = rsY_Proc;
      
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

      const target = aiTargetRef.current;
      const neuralConfig = profile.accessibility;
      let finalVelX = 0;
      let finalVelY = 0;

      if (neuralConfig.yoloEnabled && target) {
        const dx = target.x - 0.5; 
        const dy = target.y - 0.5;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (neuralConfig.aimSlowdownEnabled && dist < 0.15) {
             const slowdownFactor = 0.35; 
             rsX *= slowdownFactor;
             rsY *= slowdownFactor;
        }

        const sensitivity = rsConfigX?.sensitivity || 50;
        finalVelX = rsX * sensitivity * 0.5;
        finalVelY = rsY * sensitivity * 0.5;

        const pullPower = neuralConfig.yoloTrackingPower / 100;
        if (pullPower > 0) {
          finalVelX += dx * 2 * pullPower * 12;
          finalVelY += dy * 2 * pullPower * 12;
        }

        if (neuralConfig.snapToTargetEnabled) {
           const snapStrength = 2.5; 
           finalVelX += dx * snapStrength * 20;
           finalVelY += dy * snapStrength * 20;
        }

      } else {
         const sensitivity = rsConfigX?.sensitivity || 50;
         finalVelX = rsX * sensitivity * 0.5;
         finalVelY = rsY * sensitivity * 0.5;
      }

      if (Math.abs(finalVelX) > 0 || Math.abs(finalVelY) > 0) {
        mousePosRef.current.x += finalVelX * deltaTime * 100;
        mousePosRef.current.y += finalVelY * deltaTime * 100;
        mousePosRef.current.x = Math.max(0, Math.min(1000, mousePosRef.current.x));
        mousePosRef.current.y = Math.max(0, Math.min(1000, mousePosRef.current.y));
        window.icoreBridge?.sendMouseMove({ x: mousePosRef.current.x, y: mousePosRef.current.y });
      }
      
      const nextVirtualKeys = new Set<string>();
      const nextMouseButtons = new Set<'left' | 'middle' | 'right'>();
      const nextStickyStates = { ...state.stickyStates };
      const nextHeatmap = { ...state.heatmap };
      let newTotalInputs = state.totalInputs;

      const leftStickConfig = profile.axisMappings.find(a => a.axis === 'LEFT_STICK_X' && a.mappedTo === 'WASD');
      if (leftStickConfig) {
        const threshold = 0.5; 
        if (lsY < -threshold) nextVirtualKeys.add('KeyW');
        else if (lsY > threshold) nextVirtualKeys.add('KeyS');
        if (lsX < -threshold) nextVirtualKeys.add('KeyA');
        else if (lsX > threshold) nextVirtualKeys.add('KeyD');
      }

      Object.keys(rawButtons).forEach((key) => {
        const idx = parseInt(key);
        const btnName = DUALSENSE_INDICES[idx] as ControllerButton;
        const mapping = profile.mappings.find(m => m.button === btnName);

        if (rawButtons[idx] && !lastButtonsRef.current[idx]) {
          newTotalInputs++;
          if (btnName) nextHeatmap[btnName] = (nextHeatmap[btnName] || 0) + 1;
          if (mapping?.isSticky) nextStickyStates[btnName] = !nextStickyStates[btnName];
        }

        const active = rawButtons[idx] || nextStickyStates[btnName];
        if (active && mapping) {
          if (mapping.type === 'KEYBOARD' && mapping.keyCode) {
            nextVirtualKeys.add(mapping.keyCode);
          } else if (mapping.type === 'MOUSE') {
            const btn = mapping.mouseButton === 0 ? 'left' : mapping.mouseButton === 1 ? 'middle' : 'right';
            nextMouseButtons.add(btn);
          }
        }
      });
      
      const prevKeys = prevVirtualKeysRef.current;
      for (const key of nextVirtualKeys) if (!prevKeys.has(key)) window.icoreBridge?.sendKeyEvent({ keyCode: key, type: 'keydown' });
      for (const key of prevKeys) if (!nextVirtualKeys.has(key)) window.icoreBridge?.sendKeyEvent({ keyCode: key, type: 'keyup' });
      prevVirtualKeysRef.current = nextVirtualKeys;

      const prevMouse = prevMouseButtonsRef.current;
      for (const btn of nextMouseButtons) if (!prevMouse.has(btn)) window.icoreBridge?.sendMouseButtonEvent({ button: btn, type: 'mousedown' });
      for (const btn of prevMouse) if (!nextMouseButtons.has(btn)) window.icoreBridge?.sendMouseButtonEvent({ button: btn, type: 'mouseup' });
      prevMouseButtonsRef.current = nextMouseButtons;
      
      lastButtonsRef.current = rawButtons;
      virtualKeysRef.current = nextVirtualKeys;

      const processedAxes = [lsX, lsY, rsX, rsY];

      setState(prev => ({
        ...prev,
        connected: true,
        id: gp.id,
        buttons: rawButtons,
        axes: processedAxes,
        rawAxes: [...gp.axes],
        heatmap: nextHeatmap,
        totalInputs: newTotalInputs,
        stickyStates: nextStickyStates,
        virtualKeys: nextVirtualKeys,
        mousePosition: { ...mousePosRef.current },
        aiDetectedTarget: aiTargetRef.current
      }));
    } else {
      if (state.connected) setState(prev => ({ ...prev, connected: false }));
    }
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateGamepadState);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isKernelActive]);

  return (
    <GamepadContext.Provider value={{ 
      state, 
      resetStats: () => setState(p => ({...p, totalInputs: 0, heatmap: {}})), 
      resetStickyStates: () => setState(p => ({...p, stickyStates: {}})),
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
