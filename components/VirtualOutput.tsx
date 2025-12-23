
import React, { useEffect, useState, useRef } from 'react';
import { useGamepad } from './GamepadProvider';
import { Profile } from '../types';
import { Terminal, Activity, Move } from 'lucide-react';
import { DUALSENSE_INDICES } from '../constants';

interface VirtualOutputProps {
  profile: Profile;
}

const VirtualOutput: React.FC<VirtualOutputProps> = ({ profile }) => {
  const { state } = useGamepad();
  const [logs, setLogs] = useState<string[]>([]);
  const lastStateRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    if (!state.connected) return;

    const newLogs: string[] = [];
    
    // Log Physical Hardware Events
    Object.keys(state.buttons).forEach(key => {
      const idx = parseInt(key);
      const isPressed = state.buttons[idx];
      const wasPressed = lastStateRef.current[idx] || false;

      if (isPressed && !wasPressed) {
        const btnName = DUALSENSE_INDICES[idx];
        const mapping = profile.mappings.find(m => m.button === btnName);
        if (mapping) {
          const mode = mapping.isTurbo ? 'TURBO' : mapping.isSticky ? 'STICKY' : 'NATIVE';
          newLogs.push(`[${mode}] Hardware IRQ: ${btnName} -> Virtual ${mapping.mappedTo} ON`);
        } else {
          newLogs.push(`[SYSTEM] Button ${btnName} Pressed (Unmapped)`);
        }
      } else if (!isPressed && wasPressed) {
        const btnName = DUALSENSE_INDICES[idx];
        const mapping = profile.mappings.find(m => m.button === btnName);
        if (mapping && !mapping.isSticky) {
          newLogs.push(`[NATIVE] Hardware IRQ: ${btnName} -> Virtual ${mapping.mappedTo} OFF`);
        }
      }
    });

    // Right Stick Aim telemetry
    if (Math.abs(state.axes[2] || 0) > 0.1 || Math.abs(state.axes[3] || 0) > 0.1) {
       if (Math.random() < 0.1) {
         newLogs.push(`[MOUSE] Aim Vector: (${state.axes[2]?.toFixed(2)}, ${state.axes[3]?.toFixed(2)}) Sensitivity=${profile.axisMappings.find(a => a.axis === 'RIGHT_STICK_X')?.sensitivity || 50}%`);
       }
    }

    if (newLogs.length > 0) {
      setLogs(prev => [...newLogs, ...prev].slice(0, 20));
    }
    lastStateRef.current = { ...state.buttons };
  }, [state.buttons, profile.mappings, state.axes]);

  return (
    <div className="glass rounded-[2rem] p-6 border border-blue-500/20 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-blue-400">
          <Terminal className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Hardware Injection Stream</span>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2">
              <Move className="w-3 h-3 text-slate-500" />
              <span className="text-[9px] font-black text-slate-500">POLLING: {profile.pollingRate}HZ</span>
           </div>
           <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-75" />
           </div>
        </div>
      </div>
      <div className="bg-slate-950/90 rounded-[1.5rem] p-5 h-64 overflow-hidden font-mono text-[10px] border border-white/5 shadow-inner">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3">
            <Activity className="w-8 h-8 opacity-20 animate-pulse" />
            <p className="italic uppercase tracking-widest font-black text-[9px]">Awaiting Signal Input</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`mb-1.5 border-l-2 pl-3 py-1 animate-in fade-in slide-in-from-left-4 duration-300 ${
              log.includes('MOUSE') ? 'border-purple-500/50 text-purple-300' : 
              log.includes('TURBO') ? 'border-yellow-500/50 text-yellow-200' : 
              log.includes('SYSTEM') ? 'border-slate-500/30 text-slate-400' :
              'border-blue-500/30 text-slate-200'}`}>
              <span className="text-slate-700 mr-2 text-[8px]">
                {/* Fixed: Cast to any because fractionalSecondDigits is valid in browsers but missing in some TS versions */}
                {new Date().toLocaleTimeString([], { 
                  hour12: false, 
                  minute: '2-digit', 
                  second: '2-digit', 
                  ...({ fractionalSecondDigits: 3 } as any) 
                })}
              </span>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VirtualOutput;
