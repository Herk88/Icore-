
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

  useEffect(() => { profileRef.current = activeProfile; }, [activeProfile]);

  const resetStickyStates = () => {
    (Object.values(turboIntervalsRef.current) as any[]).forEach(t => clearInterval(t.interval));
    turboIntervalsRef.current = {};
    setState(prev => ({ ...prev, stickyStates: {}, toggleStates: {}, turboTicks: {} }));
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

      // NEURAL MAGNET PULL - Logic injection
      // Deflects the Right Stick towards AI target
      if (acc.yoloEnabled && aiTargetRef.current) {
        const target = aiTargetRef.current;
        const offsetX = target.x - 0.5;
        const offsetY = target.y - 0.5;
        const pullStrength = (acc.yoloTrackingPower / 100) * 0.35;
        translatedAxes[2] += offsetX * pullStrength;
        translatedAxes[3] += offsetY * pullStrength;
      }

      // VERTICAL ANTI-RECOIL - Pulls down when R2 is active
      if (acc.antiRecoilEnabled && rawButtons[7]) {
        translatedAxes[3] += (acc.antiRecoilStrength / 100) * 0.45;
      }

      // Clamp axes to valid hardware range
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
            if (mapping?.isSticky) nextStickyStates[btnName] = !nextStickyStates[btnName];
          }
        }

        const isLogicalActive = physicalPressed || nextStickyStates[btnName];

        // TURBO / BURST ENGINE
        if ((mapping?.isTurbo || (acc.rapidFireEnabled && btnName === 'R2')) && isLogicalActive) {
          if (!turboIntervalsRef.current[btnName]) {
            const rate = mapping?.turboSpeed || acc.globalTurboRate;
            const burstLimit = mapping?.burstMode ? (mapping.burstCount || 3) : Infinity;
            
            turboIntervalsRef.current[btnName] = {
              burstCount: burstLimit,
              currentBurst: 0,
              interval: setInterval(() => {
                const session = turboIntervalsRef.current[btnName];
                if (!session || session.currentBurst >= session.burstCount) return;
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
      (Object.values(turboIntervalsRef.current) as any[]).forEach(t => clearInterval(t.interval));
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
  if (!context) throw new Error('useGamepad error');
  return context;
};
