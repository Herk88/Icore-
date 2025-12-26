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
  });

  const lastButtonsRef = useRef<Record<number, boolean>>({});
  const requestRef = useRef<number | undefined>(undefined);
  const profileRef = useRef(activeProfile);
  const aiTargetRef = useRef<{ x: number, y: number } | null>(null);
  
  // High-performance State Refs
  const currentAiPull = useRef({ x: 0, y: 0 });
  const prevRightStickRef = useRef({ x: 0, y: 0 });
  const snapFlareRef = useRef(0); 
  const slowdownFactorRef = useRef(1.0);

  useEffect(() => { 
    profileRef.current = activeProfile; 
  }, [activeProfile]);

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

  const updateGamepadState = () => {
    const gp = navigator.getGamepads()[0];
    const profile = profileRef.current;
    const acc = profile.accessibility;

    if (gp) {
      const rawButtons: Record<number, boolean> = {};
      gp.buttons.forEach((btn, idx) => { rawButtons[idx] = btn.pressed; });

      let translatedAxes = [...gp.axes];
      const rawAxes = [...gp.axes];

      // --- NEURAL MAGNET INJECTION (PRO LOGIC) ---
      if (acc.yoloEnabled && aiTargetRef.current) {
        const target = aiTargetRef.current;
        const targetDX = target.x - 0.5;
        const targetDY = target.y - 0.5;
        
        let pullStrength = (acc.yoloTrackingPower / 100) * 0.65; 
        
        // --- EXPONENTIAL SNAP LOGIC ---
        if (acc.snapToTargetEnabled && snapFlareRef.current < 1.0) {
          // Intense initial pull that decays exponentially (PRO-feel)
          const snapMultiplier = 2.5 * Math.pow(0.92, snapFlareRef.current * 15);
          pullStrength *= (1 + snapMultiplier);
          snapFlareRef.current += 0.04; 
        }
        
        const smoothing = 0.92 - (acc.yoloTrackingPower / 600);
        currentAiPull.current.x = currentAiPull.current.x * smoothing + targetDX * (1 - smoothing);
        currentAiPull.current.y = currentAiPull.current.y * smoothing + targetDY * (1 - smoothing);

        translatedAxes[2] += currentAiPull.current.x * pullStrength;
        translatedAxes[3] += currentAiPull.current.y * pullStrength;
      } else {
        currentAiPull.current.x *= 0.82;
        currentAiPull.current.y *= 0.82;
        snapFlareRef.current = 0; 
      }

      // --- SMOOTH AIM SLOWDOWN ---
      if (acc.aimSlowdownEnabled && aiTargetRef.current) {
        const dist = Math.sqrt(Math.pow(aiTargetRef.current.x - 0.5, 2) + Math.pow(aiTargetRef.current.y - 0.5, 2));
        const targetSlowdown = dist < 0.22 ? 0.55 : 1.0;
        // Interpolate slowdown for smoothness
        slowdownFactorRef.current = slowdownFactorRef.current * 0.85 + targetSlowdown * 0.15;
        
        translatedAxes[2] *= slowdownFactorRef.current; 
        translatedAxes[3] *= slowdownFactorRef.current;
      } else {
        slowdownFactorRef.current = slowdownFactorRef.current * 0.9 + 1.0 * 0.1;
      }

      // --- DYNAMIC ANTI-RECOIL ---
      if (acc.antiRecoilEnabled && rawButtons[7]) { // R2
        const recoilVal = (acc.antiRecoilStrength / 100) * 0.32;
        const jitter = (Math.random() - 0.5) * 0.012;
        translatedAxes[3] += recoilVal + jitter;
      }

      // --- SIGNAL STABILIZATION MATRIX ---
      if (acc.stabilizationMode !== 'Off') {
        const modeMap = { 
          'Light': 0.18, 
          'Medium': 0.32, 
          'Heavy': 0.52, 
          'Custom': acc.aimStabilizationStrength / 100 
        };
        const factor = modeMap[acc.stabilizationMode] || 0;
        
        translatedAxes[2] = prevRightStickRef.current.x * factor + translatedAxes[2] * (1 - factor);
        translatedAxes[3] = prevRightStickRef.current.y * factor + translatedAxes[3] * (1 - factor);
      }

      prevRightStickRef.current = { x: translatedAxes[2], y: translatedAxes[3] };
      translatedAxes = translatedAxes.map(v => Math.max(-1, Math.min(1, v)));
      
      const newHeatmap = { ...state.heatmap };
      const nextStickyStates = { ...state.stickyStates };
      let newTotalInputs = state.totalInputs;

      Object.keys(rawButtons).forEach((key) => {
        const idx = parseInt(key);
        if (rawButtons[idx] && !lastButtonsRef.current[idx]) {
          const btnName = DUALSENSE_INDICES[idx] as ControllerButton;
          if (btnName) {
            newTotalInputs++;
            newHeatmap[btnName] = (newHeatmap[btnName] || 0) + 1;
            const mapping = profile.mappings.find(m => m.button === btnName);
            if (mapping?.isSticky) {
              nextStickyStates[btnName] = !nextStickyStates[btnName];
              triggerHaptic(gp, 0.45, 90);
            }
          }
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
      }));
    } else {
      setState(prev => prev.connected ? { ...prev, connected: false } : prev);
    }
    requestRef.current = requestAnimationFrame(updateGamepadState);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateGamepadState);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, []);

  const resetStickyStates = () => {
    setState(prev => ({ ...prev, stickyStates: {} }));
  };

  return (
    <GamepadContext.Provider value={{ 
      state, 
      resetStats: () => setState(p => ({...p, totalInputs: 0, heatmap: {}})), 
      resetStickyStates, 
      setAiTarget: (t) => { aiTargetRef.current = t; } 
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
