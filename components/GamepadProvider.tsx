
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { GamepadState, Profile, Mapping, ControllerButton } from '../types';
import { DUALSENSE_INDICES } from '../constants';

interface GamepadContextType {
  state: GamepadState;
  resetStats: () => void;
  resetStickyStates: () => void;
  setAiTarget: (target: { x: number, y: number } | null) => void;
  isKernelActive: boolean;
  setKernelActive: (active: boolean) => void;
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
  // Fixed: Strictly typed to match 'left' | 'middle' | 'right' for sendMouseButtonEvent compatibility
  const prevMouseButtonsRef = useRef<Set<'left' | 'middle' | 'right'>>(new Set());

  // Mouse Accumulators
  const mousePosRef = useRef({ x: 500, y: 500 });
  const prevTimeRef = useRef(performance.now());
  
  // Stabilization Filters
  const smoothedRightStickRef = useRef({ x: 0, y: 0 });

  useEffect(() => { 
    profileRef.current = activeProfile; 
  }, [activeProfile]);

  const applyDeadzone = (value: number, deadzone: number) => {
    const abs = Math.abs(value);
    if (abs < deadzone) return 0;
    return (value / abs) * ((abs - deadzone) / (1 - deadzone));
  };

  const updateGamepadState = () => {
    requestRef.current = requestAnimationFrame(updateGamepadState);
    if (!isKernelActive) return;

    const now = performance.now();
    const profile = profileRef.current;
    
    // Respect the profile's polling rate
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

      // 1. Process Axes
      const translatedAxes = gp.axes.map((val, idx) => {
        const axisName = idx < 2 ? (idx === 0 ? 'LEFT_STICK_X' : 'LEFT_STICK_Y') : (idx === 2 ? 'RIGHT_STICK_X' : 'RIGHT_STICK_Y');
        const config = profile.axisMappings.find(a => a.axis === axisName);
        if (!config) return val;
        return applyDeadzone(val, config.deadzone);
      });

      let rsX = translatedAxes[2];
      let rsY = translatedAxes[3];
      
      // --- STABILIZATION LOGIC ---
      let stabFactor = 0;
      switch (profile.accessibility.stabilizationMode) {
        case 'Light': stabFactor = 0.25; break;
        case 'Medium': stabFactor = 0.50; break;
        case 'Heavy': stabFactor = 0.85; break;
        case 'Custom': stabFactor = profile.accessibility.aimStabilizationStrength / 100; break;
        case 'Off': stabFactor = 0; break;
      }

      if (stabFactor > 0) {
        // Exponential Moving Average
        // High stabFactor = More smooth, less responsive
        smoothedRightStickRef.current.x = smoothedRightStickRef.current.x * stabFactor + rsX * (1 - stabFactor);
        smoothedRightStickRef.current.y = smoothedRightStickRef.current.y * stabFactor + rsY * (1 - stabFactor);
        rsX = smoothedRightStickRef.current.x;
        rsY = smoothedRightStickRef.current.y;
      } else {
        // Reset smoother to current to prevent jumps when toggling mode
        smoothedRightStickRef.current = { x: rsX, y: rsY };
      }

      // --- NEURAL MODIFIERS (Slowdown, Pull, Snap) ---
      const target = aiTargetRef.current;
      const neuralConfig = profile.accessibility;
      let finalVelX = 0;
      let finalVelY = 0;

      if (neuralConfig.yoloEnabled && target) {
        // Target Coords are 0-1. Center is 0.5, 0.5.
        // dx, dy represents vector FROM center TO target.
        const dx = target.x - 0.5; 
        const dy = target.y - 0.5;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // 1. Aim Slowdown Zone
        if (neuralConfig.aimSlowdownEnabled) {
          // If crosshair is within ~15% screen distance of target
          if (dist < 0.15) {
             const slowdownFactor = 0.35; // 35% speed
             rsX *= slowdownFactor;
             rsY *= slowdownFactor;
          }
        }

        // Base Sensitivity Calculation after modifiers
        const rightStickConfigX = profile.axisMappings.find(a => a.axis === 'RIGHT_STICK_X');
        finalVelX = rsX * (rightStickConfigX?.sensitivity || 50) * 0.5;
        finalVelY = rsY * (rightStickConfigX?.sensitivity || 50) * 0.5;

        // 2. Neural Pull (Standard Aim Assist)
        const pullPower = neuralConfig.yoloTrackingPower / 100;
        if (pullPower > 0) {
          finalVelX += dx * 2 * pullPower * 12;
          finalVelY += dy * 2 * pullPower * 12;
        }

        // 3. Snap-to-Target
        if (neuralConfig.snapToTargetEnabled) {
           // Strong impulse when target is acquired but not centered
           // We use a non-linear snap: stronger when further away but within detection range
           const snapStrength = 2.5; 
           finalVelX += dx * snapStrength * 20;
           finalVelY += dy * snapStrength * 20;
        }

      } else {
         // No AI Target logic
         const rightStickConfigX = profile.axisMappings.find(a => a.axis === 'RIGHT_STICK_X');
         finalVelX = rsX * (rightStickConfigX?.sensitivity || 50) * 0.5;
         finalVelY = rsY * (rightStickConfigX?.sensitivity || 50) * 0.5;
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

      // 3. KEYBOARD MOVEMENT (WASD Emulation from Stick)
      // Check if Left Stick is mapped to WASD in the profile
      const leftStickConfig = profile.axisMappings.find(a => a.axis === 'LEFT_STICK_X' && a.mappedTo === 'WASD');
      if (leftStickConfig) {
        const lsX = translatedAxes[0];
        const lsY = translatedAxes[1];
        const threshold = 0.5;

        // Y-Axis (Forward/Back)
        if (lsY < -threshold) nextVirtualKeys.add('KeyW');
        else if (lsY > threshold) nextVirtualKeys.add('KeyS');

        // X-Axis (Left/Right)
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
      
      // --- OS Event Injection via IPC Bridge ---
      const prevKeys = prevVirtualKeysRef.current;
      for (const key of nextVirtualKeys) if (!prevKeys.has(key)) window.icoreBridge?.sendKeyEvent({ keyCode: key, type: 'keydown' });
      for (const key of prevKeys) if (!nextVirtualKeys.has(key)) window.icoreBridge?.sendKeyEvent({ keyCode: key, type: 'keyup' });
      prevVirtualKeysRef.current = nextVirtualKeys;

      const prevMouse = prevMouseButtonsRef.current;
      // Fixed loop variables to be strictly typed
      for (const btn of nextMouseButtons) if (!prevMouse.has(btn)) window.icoreBridge?.sendMouseButtonEvent({ button: btn, type: 'mousedown' });
      for (const btn of prevMouse) if (!nextMouseButtons.has(btn)) window.icoreBridge?.sendMouseButtonEvent({ button: btn, type: 'mouseup' });
      prevMouseButtonsRef.current = nextMouseButtons;
      
      lastButtonsRef.current = rawButtons;
      virtualKeysRef.current = nextVirtualKeys;

      setState(prev => ({
        ...prev,
        connected: true,
        id: gp.id,
        buttons: rawButtons,
        axes: translatedAxes,
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
    // FIX: Pass the request ID (requestRef.current) to cancelAnimationFrame, not the callback function.
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isKernelActive]);

  return (
    <GamepadContext.Provider value={{ 
      state, 
      resetStats: () => setState(p => ({...p, totalInputs: 0, heatmap: {}})), 
      resetStickyStates: () => setState(p => ({...p, stickyStates: {}})),
      setAiTarget: (t) => { aiTargetRef.current = t; },
      isKernelActive,
      setKernelActive
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
