
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { GamepadState, Profile, Mapping, ControllerButton } from '../types';
import { DUALSENSE_INDICES } from '../constants';

interface GamepadContextType {
  state: GamepadState;
  resetStats: () => void;
  resetStickyStates: () => void;
  setAiTarget: (target: { x: number, y: number } | null) => void;
}

const GamepadContext = createContext<GamepadContextType | undefined>(undefined);

export const GamepadProvider: React.FC<{ children: React.ReactNode, activeProfile: Profile }> = ({ children, activeProfile }) => {
  const [state, setState] = useState<GamepadState>({
    connected: false,
    id: null,
    buttons: {},
    axes: [],
    rawAxes: [],
    heatmap: {},
    sessionStartTime: new Date(),
    totalInputs: 0,
    turboTicks: {},
    stickyStates: {},
    toggleStates: {},
    captureTriggered: false,
    aiDetectedTarget: null,
  });

  const lastButtonsRef = useRef<Record<number, boolean>>({});
  const requestRef = useRef<number | undefined>(undefined);
  const turboIntervalsRef = useRef<Record<string, { interval: any, burstCount: number, currentBurst: number }>>({});
  const profileRef = useRef(activeProfile);
  const aiTargetRef = useRef<{ x: number, y: number } | null>(null);
  
  // Aim Assist Persistence
  const prevRightStickRef = useRef({ x: 0, y: 0 });
  const snapActiveRef = useRef(false);

  useEffect(() => { profileRef.current = activeProfile; }, [activeProfile]);

  const triggerHaptic = (gamepad: Gamepad, intensity: number = 0.5, duration: number = 50) => {
    const profile = profileRef.current;
    if (profile.accessibility.hapticFeedbackEnabled && gamepad.vibrationActuator) {
      const strength = (profile.accessibility.hapticIntensity / 100) * intensity;
      (gamepad.vibrationActuator as any).playEffect('dual-rumble', {
        startDelay: 0,
        duration: duration,
        weakMagnitude: strength,
        strongMagnitude: strength,
      }).catch(() => {});
    }
  };

  const resetStickyStates = () => {
    Object.keys(turboIntervalsRef.current).forEach(key => {
      clearInterval(turboIntervalsRef.current[key].interval);
    });
    turboIntervalsRef.current = {};
    
    setState(prev => ({ 
      ...prev, 
      stickyStates: {}, 
      toggleStates: {}, 
      turboTicks: {} 
    }));
  };

  const updateGamepadState = () => {
    const gp = navigator.getGamepads()[0];
    const profile = profileRef.current;
    const acc = profile.accessibility;

    if (gp) {
      const rawButtons: Record<number, boolean> = {};
      gp.buttons.forEach((btn, idx) => { rawButtons[idx] = btn.pressed; });

      // QUICK RELEASE COMBO: Share (8) + Options (9)
      if (rawButtons[8] && rawButtons[9]) {
        if (!lastButtonsRef.current[8] || !lastButtonsRef.current[9]) {
          resetStickyStates();
          triggerHaptic(gp, 0.8, 150);
        }
      }

      let translatedAxes = [...gp.axes];
      const rawAxes = [...gp.axes];

      // --- ADVANCED AIM ASSIST ENGINE ---
      
      // 1. Aim Slowdown (Proximity Sensitivity Scaling)
      // If target is in the "Slowdown Zone" (center FOV), reduce sensitivity
      if (acc.aimSlowdownEnabled && aiTargetRef.current) {
        const target = aiTargetRef.current;
        const distFromCenter = Math.sqrt(Math.pow(target.x - 0.5, 2) + Math.pow(target.y - 0.5, 2));
        const slowdownThreshold = 0.25; // Define the "Bubble" size
        
        if (distFromCenter < slowdownThreshold) {
          // Linear slowdown based on proximity
          const factor = 1 - (acc.autoAimStrength / 100) * (1 - distFromCenter / slowdownThreshold);
          translatedAxes[2] *= factor; // RS-X
          translatedAxes[3] *= factor; // RS-Y
        }
      }

      // 2. Snap-to-Target (Initial ADS Pull)
      // Triggers when L2 (Index 6) is newly pressed
      if (acc.snapToTargetEnabled && rawButtons[6] && !lastButtonsRef.current[6] && aiTargetRef.current) {
        const target = aiTargetRef.current;
        const snapStrength = 0.45; // Fixed high-speed pull
        translatedAxes[2] += (target.x - 0.5) * snapStrength;
        translatedAxes[3] += (target.y - 0.5) * snapStrength;
        triggerHaptic(gp, 0.6, 40);
      }

      // 3. Aim Stabilization (Low-Pass Smoothing)
      if (acc.stabilizationMode !== 'Off') {
        const strengthMap = { 'Light': 0.15, 'Medium': 0.35, 'Heavy': 0.65, 'Custom': acc.aimStabilizationStrength / 100 };
        const lerpFactor = 1 - strengthMap[acc.stabilizationMode];
        
        translatedAxes[2] = prevRightStickRef.current.x + (translatedAxes[2] - prevRightStickRef.current.x) * lerpFactor;
        translatedAxes[3] = prevRightStickRef.current.y + (translatedAxes[3] - prevRightStickRef.current.y) * lerpFactor;
      }

      // 4. NEURAL MAGNET PULL (Continuous Tracking)
      if (acc.yoloEnabled && aiTargetRef.current) {
        const target = aiTargetRef.current;
        const offsetX = target.x - 0.5;
        const offsetY = target.y - 0.5;
        const pullStrength = (acc.yoloTrackingPower / 100) * 0.35;
        translatedAxes[2] += offsetX * pullStrength;
        translatedAxes[3] += offsetY * pullStrength;
      }

      // 5. VERTICAL ANTI-RECOIL
      if (acc.antiRecoilEnabled && rawButtons[7]) { 
        translatedAxes[3] += (acc.antiRecoilStrength / 100) * 0.45;
      }

      // Store current for next frame smoothing
      prevRightStickRef.current = { x: translatedAxes[2], y: translatedAxes[3] };

      translatedAxes = translatedAxes.map(v => Math.max(-1, Math.min(1, v)));
      
      const newHeatmap = { ...state.heatmap };
      const nextStickyStates = { ...state.stickyStates };
      let newTotalInputs = state.totalInputs;

      Object.keys(rawButtons).forEach((key) => {
        const idx = parseInt(key);
        const physicalPressed = rawButtons[idx];
        const btnName = DUALSENSE_INDICES[idx] as ControllerButton;
        const mapping = profile.mappings.find(m => m.button === btnName);

        if (physicalPressed && !lastButtonsRef.current[idx]) {
          if (btnName) {
            newTotalInputs++;
            newHeatmap[btnName] = (newHeatmap[btnName] || 0) + 1;
            if (mapping?.isSticky) {
              nextStickyStates[btnName] = !nextStickyStates[btnName];
              triggerHaptic(gp, nextStickyStates[btnName] ? 0.7 : 0.3, 60); 
            } else {
              triggerHaptic(gp, 0.4, 25);
            }
          }
        }

        const isLogicalActive = physicalPressed || nextStickyStates[btnName];

        if ((mapping?.isTurbo || (acc.rapidFireEnabled && btnName === 'R2')) && isLogicalActive) {
          if (!turboIntervalsRef.current[btnName]) {
            const rate = mapping?.turboSpeed || acc.globalTurboRate;
            const burstLimit = mapping?.burstMode ? (mapping.burstCount || 3) : Infinity;
            
            turboIntervalsRef.current[btnName] = {
              burstCount: burstLimit,
              currentBurst: 0,
              interval: setInterval(() => {
                const session = turboIntervalsRef.current[btnName];
                if (!session) return;
                if (session.currentBurst >= session.burstCount) return;
                session.currentBurst++;
                setState(prev => ({
                  ...prev,
                  turboTicks: { ...prev.turboTicks, [idx]: (prev.turboTicks[idx] || 0) + 1 }
                }));
              }, 1000 / rate)
            };
          }
        } else if (turboIntervalsRef.current[btnName] && !isLogicalActive) {
          clearInterval(turboIntervalsRef.current[btnName].interval);
          delete turboIntervalsRef.current[btnName];
        }
      });

      lastButtonsRef.current = rawButtons;
      setState(prev => ({
        ...prev,
        connected: true,
        id: gp.id,
        buttons: rawButtons,
        axes: translatedAxes,
        rawAxes: rawAxes,
        heatmap: newHeatmap,
        totalInputs: newTotalInputs,
        stickyStates: nextStickyStates,
        aiDetectedTarget: aiTargetRef.current,
        motion: gp.axes.length >= 6 ? { gyro: { x: gp.axes[4], y: gp.axes[5], z: gp.axes[6] } } : prev.motion
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
      Object.keys(turboIntervalsRef.current).forEach(key => clearInterval(turboIntervalsRef.current[key].interval));
    };
  }, []);

  return (
    <GamepadContext.Provider value={{ state, resetStats: () => setState(p => ({...p, totalInputs: 0, heatmap: {}})), resetStickyStates, setAiTarget: (t) => { aiTargetRef.current = t; } }}>
      {children}
    </GamepadContext.Provider>
  );
};

export const useGamepad = () => {
  const context = useContext(GamepadContext);
  if (!context) throw new Error('useGamepad failure');
  return context;
};
