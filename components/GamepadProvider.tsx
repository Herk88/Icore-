
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
    if (!isKernelActive) {
      requestRef.current = requestAnimationFrame(updateGamepadState);
      return;
    }

    const gp = navigator.getGamepads()[0];
    const profile = profileRef.current;
    const now = performance.now();
    const deltaTime = (now - prevTimeRef.current) / 1000;
    prevTimeRef.current = now;

    // Simulation Mode: If no hardware, allow AI to "move" the virtual mouse if targets exist
    const isSimulatingHardware = !gp;

    if (gp || (isSimulatingHardware && profile.accessibility.yoloEnabled)) {
      const rawButtons: Record<number, boolean> = {};
      if (gp) {
        gp.buttons.forEach((btn, idx) => { rawButtons[idx] = btn.pressed; });
      }

      // 1. Process Axes
      const translatedAxes = gp ? gp.axes.map((val, idx) => {
        const axisName = idx < 2 ? (idx === 0 ? 'LEFT_STICK_X' : 'LEFT_STICK_Y') : (idx === 2 ? 'RIGHT_STICK_X' : 'RIGHT_STICK_Y');
        const config = profile.axisMappings.find(a => a.axis === axisName);
        if (!config) return val;
        return applyDeadzone(val, config.deadzone);
      }) : [0, 0, 0, 0];

      // --- AIM STABILIZATION LOGIC ---
      let rsX = translatedAxes[2];
      let rsY = translatedAxes[3];
      
      const stabStrength = profile.accessibility.aimStabilizationStrength / 100;
      if (profile.accessibility.stabilizationMode !== 'Off') {
        let alpha = 0.3; 
        if (profile.accessibility.stabilizationMode === 'Medium') alpha = 0.15;
        if (profile.accessibility.stabilizationMode === 'Heavy') alpha = 0.05;
        if (profile.accessibility.stabilizationMode === 'Custom') alpha = 1.0 - stabStrength;
        
        smoothedRightStickRef.current.x = smoothedRightStickRef.current.x * (1 - alpha) + rsX * alpha;
        smoothedRightStickRef.current.y = smoothedRightStickRef.current.y * (1 - alpha) + rsY * alpha;
        
        rsX = smoothedRightStickRef.current.x;
        rsY = smoothedRightStickRef.current.y;
      }

      const nextVirtualKeys = new Set<string>();

      // 2. STICK TO MOUSE & AI PULL
      const rightStickConfigX = profile.axisMappings.find(a => a.axis === 'RIGHT_STICK_X');
      const rightStickConfigY = profile.axisMappings.find(a => a.axis === 'RIGHT_STICK_Y');

      if (rightStickConfigX?.mappedTo === 'MOUSE_MOVEMENT' || rightStickConfigY?.mappedTo === 'MOUSE_MOVEMENT' || isSimulatingHardware) {
        let velX = rsX * (rightStickConfigX?.sensitivity || 50) * 0.5;
        let velY = rsY * (rightStickConfigY?.sensitivity || 50) * 0.5;

        // --- AI TARGETING LOGIC ---
        const target = aiTargetRef.current;
        if (profile.accessibility.yoloEnabled && target) {
          const targetRelX = (target.x - 0.5) * 2;
          const targetRelY = (target.y - 0.5) * 2;
          const distToTarget = Math.sqrt(targetRelX * targetRelX + targetRelY * targetRelY);

          if (profile.accessibility.snapToTargetEnabled && distToTarget < 0.3 && (Math.abs(rsX) > 0.1 || Math.abs(rsY) > 0.1 || isSimulatingHardware)) {
             velX += targetRelX * 25;
             velY += targetRelY * 25;
          }

          if (profile.accessibility.aimSlowdownEnabled && distToTarget < 0.2 && !isSimulatingHardware) {
             velX *= 0.4;
             velY *= 0.4;
          }

          const pullPower = profile.accessibility.yoloTrackingPower / 100;
          velX += targetRelX * pullPower * 12;
          velY += targetRelY * pullPower * 12;
        }

        mousePosRef.current.x += velX * deltaTime * 100;
        mousePosRef.current.y += velY * deltaTime * 100;
      }

      mousePosRef.current.x = Math.max(0, Math.min(1000, mousePosRef.current.x));
      mousePosRef.current.y = Math.max(0, Math.min(1000, mousePosRef.current.y));

      const nextStickyStates = { ...state.stickyStates };
      const nextHeatmap = { ...state.heatmap };
      let newTotalInputs = state.totalInputs;

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
        if (active && mapping?.type === 'KEYBOARD' && mapping.keyCode) {
          nextVirtualKeys.add(mapping.keyCode);
        }
      });

      lastButtonsRef.current = rawButtons;
      virtualKeysRef.current = nextVirtualKeys;

      setState(prev => ({
        ...prev,
        connected: gp ? true : false,
        id: gp ? gp.id : (profile.accessibility.yoloEnabled ? 'NEURAL_SIMULATOR_ACTIVE' : null),
        buttons: rawButtons,
        axes: translatedAxes,
        rawAxes: gp ? [...gp.axes] : [0, 0, 0, 0],
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
    requestRef.current = requestAnimationFrame(updateGamepadState);
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
