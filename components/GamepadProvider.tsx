
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { GamepadState, Profile, Mapping, ControllerButton } from '../types';
import { DUALSENSE_INDICES } from '../constants';

interface GamepadContextType {
  state: GamepadState;
  resetStats: () => void;
  setLayer: (layer: number) => void;
  toggleGyro: () => void;
  resetStickyStates: () => void;
}

const GamepadContext = createContext<GamepadContextType | undefined>(undefined);

const IDLE_THRESHOLD = 30000; // 30 seconds

const NAME_TO_INDEX: Record<string, number> = Object.entries(DUALSENSE_INDICES).reduce((acc, [idx, name]) => {
  acc[name] = parseInt(idx);
  return acc;
}, {} as Record<string, number>);

export const GamepadProvider: React.FC<{ children: React.ReactNode, activeProfile: Profile }> = ({ children, activeProfile }) => {
  const [state, setState] = useState<GamepadState>({
    connected: false,
    id: null,
    buttons: {},
    axes: [],
    heatmap: {},
    sessionStartTime: Date.now(),
    totalInputs: 0,
    lastInputTime: Date.now(),
    isThrottled: false,
    activeLayer: 0,
    turboTicks: {},
    gyroActive: false,
    stickyStates: {},
    toggleStates: {},
    oneHandedShiftActive: false,
  });

  const lastButtonsRef = useRef<Record<number, boolean>>({});
  const requestRef = useRef<number | undefined>(undefined);
  const axesBuffer = useRef<number[][]>([]);
  const stickyTimersRef = useRef<Record<string, any>>({});
  const turboIntervalsRef = useRef<Record<string, { interval: any, rate: number }>>({});

  // Active refs to ensure polling loop has latest config without re-running effects
  const profileRef = useRef(activeProfile);
  const stickyStatesRef = useRef<Record<string, boolean>>({});
  const toggleStatesRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    profileRef.current = activeProfile;
  }, [activeProfile]);

  const resetStats = () => {
    setState(prev => ({
      ...prev,
      heatmap: {},
      totalInputs: 0,
      sessionStartTime: Date.now(),
    }));
  };

  const triggerHaptic = (gamepad: Gamepad, intensity: number = 0.5, duration: number = 100) => {
    const profile = profileRef.current;
    if (profile?.accessibility.hapticFeedbackEnabled && gamepad.vibrationActuator) {
      (gamepad.vibrationActuator as any).playEffect('dual-rumble', {
        startDelay: 0,
        duration: duration,
        weakMagnitude: intensity,
        strongMagnitude: intensity,
      }).catch(() => {});
    }
  };

  const setLayer = (layer: number) => {
    setState(prev => ({ ...prev, activeLayer: layer }));
  };

  const toggleGyro = () => {
    setState(prev => ({ ...prev, gyroActive: !prev.gyroActive }));
  };

  const resetStickyStates = () => {
    Object.values(stickyTimersRef.current).forEach(clearTimeout);
    stickyTimersRef.current = {};
    stickyStatesRef.current = {};
    toggleStatesRef.current = {};
    setState(prev => ({ ...prev, stickyStates: {}, toggleStates: {} }));
  };

  const updateGamepadState = () => {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0];
    const profile = profileRef.current;

    if (gp) {
      const rawButtons: Record<number, boolean> = {};
      gp.buttons.forEach((btn, idx) => { rawButtons[idx] = btn.pressed; });

      const acc = profile?.accessibility;
      const oneHandedMode = profile?.oneHandedMode || 'NONE';
      const shiftBtnName = acc?.oneHandedShiftButton || 'L3';
      const shiftIdx = NAME_TO_INDEX[shiftBtnName];
      const isShifted = oneHandedMode !== 'NONE' && !!rawButtons[shiftIdx];

      const translatedButtons: Record<number, boolean> = { ...rawButtons };
      let translatedAxes = [...gp.axes];

      // Handle One-Handed Mapping Logic
      if (oneHandedMode === 'LEFT' && isShifted) {
        translatedButtons[3] = rawButtons[12];
        translatedButtons[0] = rawButtons[13];
        translatedButtons[2] = rawButtons[14];
        translatedButtons[1] = rawButtons[15];
        translatedButtons[12] = translatedButtons[13] = translatedButtons[14] = translatedButtons[15] = false;
        translatedButtons[5] = rawButtons[4];
        translatedButtons[7] = rawButtons[6];
        translatedButtons[4] = translatedButtons[6] = false;
        translatedAxes[2] = translatedAxes[0];
        translatedAxes[3] = translatedAxes[1];
        translatedAxes[0] = translatedAxes[1] = 0;
      } else if (oneHandedMode === 'RIGHT' && isShifted) {
        translatedButtons[12] = rawButtons[3];
        translatedButtons[13] = rawButtons[0];
        translatedButtons[14] = rawButtons[2];
        translatedButtons[15] = rawButtons[1];
        translatedButtons[3] = translatedButtons[0] = translatedButtons[2] = translatedButtons[1] = false;
        translatedButtons[4] = rawButtons[5];
        translatedButtons[6] = rawButtons[7];
        translatedButtons[5] = translatedButtons[7] = false;
        translatedAxes[0] = translatedAxes[2];
        translatedAxes[1] = translatedAxes[3];
        translatedAxes[2] = translatedAxes[3] = 0;
      }

      const newHeatmap = { ...state.heatmap };
      let newInputs = state.totalInputs;
      let activityDetected = false;
      
      const nextStickyStates = { ...stickyStatesRef.current };
      const nextToggleStates = { ...toggleStatesRef.current };

      Object.keys(translatedButtons).forEach((key) => {
        const idx = parseInt(key);
        const physicalPressed = translatedButtons[idx];
        if (physicalPressed) activityDetected = true;
        
        const btnName = DUALSENSE_INDICES[idx];
        const mapping = profile?.mappings.find(m => m.button === btnName);

        // Edge Detection: Physical Button just went DOWN
        if (physicalPressed && !lastButtonsRef.current[idx]) {
          if (btnName) {
            newHeatmap[btnName] = (newHeatmap[btnName] || 0) + 1;
            newInputs++;
            triggerHaptic(gp, 0.4, 50);
          }

          // Toggle Sticky State if configured
          if (mapping?.isSticky) {
            const currentlyStuck = !!nextStickyStates[btnName];
            nextStickyStates[btnName] = !currentlyStuck;

            // Handle Sticky Release Timer
            if (nextStickyStates[btnName]) {
              if (acc && acc.stickyDurationLimit > 0) {
                if (stickyTimersRef.current[btnName]) clearTimeout(stickyTimersRef.current[btnName]);
                stickyTimersRef.current[btnName] = setTimeout(() => {
                  stickyStatesRef.current[btnName] = false;
                  setState(prev => ({ 
                    ...prev, 
                    stickyStates: { ...prev.stickyStates, [btnName]: false } 
                  }));
                  delete stickyTimersRef.current[btnName];
                }, acc.stickyDurationLimit * 1000);
              }
            } else {
              if (stickyTimersRef.current[btnName]) {
                clearTimeout(stickyTimersRef.current[btnName]);
                delete stickyTimersRef.current[btnName];
              }
            }
          }

          if (mapping?.isToggle) {
            nextToggleStates[btnName] = !nextToggleStates[btnName];
          }
        }

        // Logical State: Is the virtual output "ON"?
        const isLogicalActive = physicalPressed || nextStickyStates[btnName] || nextToggleStates[btnName];

        // Turbo Logic
        if (mapping?.isTurbo && isLogicalActive) {
          const currentRate = mapping.turboSpeed || acc?.globalTurboRate || 10;
          if (!turboIntervalsRef.current[btnName] || turboIntervalsRef.current[btnName].rate !== currentRate) {
            if (turboIntervalsRef.current[btnName]) clearInterval(turboIntervalsRef.current[btnName].interval);
            turboIntervalsRef.current[btnName] = {
              rate: currentRate,
              interval: setInterval(() => {
                setState(prev => ({
                  ...prev,
                  turboTicks: { ...prev.turboTicks, [idx]: (prev.turboTicks[idx] || 0) + 1 }
                }));
              }, 1000 / currentRate)
            };
          }
        } else if (turboIntervalsRef.current[btnName]) {
          clearInterval(turboIntervalsRef.current[btnName].interval);
          delete turboIntervalsRef.current[btnName];
          setState(prev => {
            const nextTicks = { ...prev.turboTicks };
            delete nextTicks[idx];
            return { ...prev, turboTicks: nextTicks };
          });
        }
      });

      // Quick Release Combo (Share + Options)
      if (acc?.quickReleaseCombo && gp.buttons[8].pressed && gp.buttons[9].pressed) {
        resetStickyStates();
        triggerHaptic(gp, 0.8, 200);
        return; // Early exit to ensure state clears effectively
      }

      stickyStatesRef.current = nextStickyStates;
      toggleStatesRef.current = nextToggleStates;

      // Analog smoothing logic
      let currentAxes = [...translatedAxes];
      if (acc && acc.aimStabilizationStrength) {
        axesBuffer.current.push([...translatedAxes]);
        const windowSize = Math.max(2, Math.floor(acc.aimStabilizationStrength / 10));
        if (axesBuffer.current.length > windowSize) axesBuffer.current.shift();
        [0, 1, 2, 3].forEach(i => {
          const sum = axesBuffer.current.reduce((sumAcc, curr) => sumAcc + (curr[i] || 0), 0);
          currentAxes[i] = sum / (axesBuffer.current.length || 1);
        });
      }

      translatedAxes.forEach(axis => { if (Math.abs(axis) > 0.1) activityDetected = true; });

      lastButtonsRef.current = translatedButtons;

      const now = Date.now();
      const lastInput = activityDetected ? now : state.lastInputTime;
      const isThrottled = now - lastInput > IDLE_THRESHOLD;

      setState(prev => ({
        ...prev,
        connected: true,
        id: gp.id,
        buttons: translatedButtons,
        axes: currentAxes,
        heatmap: newHeatmap,
        totalInputs: newInputs,
        lastInputTime: lastInput,
        isThrottled,
        stickyStates: nextStickyStates,
        toggleStates: nextToggleStates,
        oneHandedShiftActive: isShifted,
        motion: gp.axes.length >= 6 ? {
           gyro: { x: gp.axes[4] || 0, y: gp.axes[5] || 0, z: gp.axes[6] || 0 },
           accel: { x: 0, y: 0, z: 0 }
        } : prev.motion
      }));
    } else {
      setState(prev => prev.connected ? { ...prev, connected: false } : prev);
    }
    
    requestRef.current = requestAnimationFrame(updateGamepadState);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateGamepadState);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      Object.values(stickyTimersRef.current).forEach(clearTimeout);
      Object.values(turboIntervalsRef.current).forEach((t: any) => clearInterval(t.interval));
    };
  }, []);

  return (
    <GamepadContext.Provider value={{ state, resetStats, setLayer, toggleGyro, resetStickyStates }}>
      {children}
    </GamepadContext.Provider>
  );
};

export const useGamepad = () => {
  const context = useContext(GamepadContext);
  if (!context) throw new Error('useGamepad must be used within GamepadProvider');
  return context;
};
