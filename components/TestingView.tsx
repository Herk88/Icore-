
import React, { useMemo, useState, useEffect } from 'react';
import { useGamepad } from './GamepadProvider';
import { Profile } from '../types';
import { Crosshair, Move, Activity, Zap, Lock, Compass } from 'lucide-react';
import { DUALSENSE_INDICES, NAME_TO_INDEX } from '../constants';

interface TestingViewProps {
  profile: Profile;
}

const TestingView: React.FC<TestingViewProps> = ({ profile }) => {
  const { state } = useGamepad();
  const [history, setHistory] = useState<{ raw: number, smoothed: number }[]>([]);

  // Track Axis 3 (Right Stick Y) for smoothing visualization
  useEffect(() => {
    if (state.connected) {
      setHistory(prev => {
        const next = [...prev, { raw: state.rawAxes[3] || 0, smoothed: state.axes[3] || 0 }];
        return next.slice(-100);
      });
    }
  }, [state.axes, state.rawAxes, state.connected]);

  const leftStickX = state.axes[0] || 0;
  const leftStickY = state.axes[1] || 0;
  const rightStickX = state.axes[2] || 0;
  const rightStickY = state.axes[3] || 0;

  const deadzone = profile.axisMappings.find(a => a.axis === 'LEFT_STICK_X')?.deadzone || 0.1;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="space-y-2">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Calibration & Testing</h2>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Live hardware feedback and signal processing visualizers.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deadzone & Stick Visualizer */}
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
           <div className="flex items-center gap-3">
              <Crosshair className="w-5 h-5 text-blue-500" />
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Stick Precision & Deadzone</h4>
           </div>

           <div className="grid grid-cols-2 gap-8">
             {/* Left Stick Visualizer */}
             <div className="space-y-4">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center block">Left Analog</span>
               <div className="aspect-square bg-slate-950 rounded-full border border-white/5 relative flex items-center justify-center overflow-hidden">
                  {/* Deadzone Overlay */}
                  <div 
                    className="absolute rounded-full bg-red-500/10 border border-red-500/20" 
                    style={{ width: `${deadzone * 100}%`, height: `${deadzone * 100}%` }}
                  />
                  {/* Grid */}
                  <div className="absolute inset-0 border-t border-white/5 top-1/2" />
                  <div className="absolute inset-0 border-l border-white/5 left-1/2" />
                  
                  {/* Stick Position Dot */}
                  <div 
                    className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-transform duration-75 z-10"
                    style={{ transform: `translate(${leftStickX * 100}%, ${leftStickY * 100}%)` }}
                  />
               </div>
               <div className="text-center">
                 <p className="text-[10px] font-black text-blue-500 mono uppercase">X: {leftStickX.toFixed(3)} Y: {leftStickY.toFixed(3)}</p>
               </div>
             </div>

             {/* Right Stick Visualizer */}
             <div className="space-y-4">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center block">Right Analog</span>
               <div className="aspect-square bg-slate-950 rounded-full border border-white/5 relative flex items-center justify-center overflow-hidden">
                  {/* Grid */}
                  <div className="absolute inset-0 border-t border-white/5 top-1/2" />
                  <div className="absolute inset-0 border-l border-white/5 left-1/2" />
                  
                  {/* Stick Position Dot */}
                  <div 
                    className="w-4 h-4 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)] transition-transform duration-75 z-10"
                    style={{ transform: `translate(${rightStickX * 100}%, ${rightStickY * 100}%)` }}
                  />
               </div>
               <div className="text-center">
                 <p className="text-[10px] font-black text-purple-500 mono uppercase">X: {rightStickX.toFixed(3)} Y: {rightStickY.toFixed(3)}</p>
               </div>
             </div>
           </div>
        </div>

        {/* Gyro Scope Visualizer */}
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="flex items-center gap-3 self-start w-full">
            <Compass className="w-5 h-5 text-blue-400" />
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Gyroscope Telemetry</h4>
          </div>

          <div className="flex-1 flex items-center justify-center w-full min-h-[200px]">
             <div 
               className="w-32 h-32 rounded-3xl bg-blue-600/20 border-2 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)] transition-transform duration-100 flex items-center justify-center"
               style={{ 
                 transform: `perspective(500px) rotateX(${(state.motion?.gyro?.x || 0) * 45}deg) rotateY(${(state.motion?.gyro?.z || 0) * 45}deg) rotateZ(${(state.motion?.gyro?.y || 0) * 45}deg)` 
               }}
             >
               <Compass className="w-12 h-12 text-blue-400 opacity-50" />
             </div>
          </div>
          
          <div className="grid grid-cols-3 gap-8 w-full">
             <div className="text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Pitch</p>
                <p className="text-[10px] font-black text-white">{(state.motion?.gyro?.x || 0).toFixed(4)}</p>
             </div>
             <div className="text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Roll</p>
                <p className="text-[10px] font-black text-white">{(state.motion?.gyro?.y || 0).toFixed(4)}</p>
             </div>
             <div className="text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Yaw</p>
                <p className="text-[10px] font-black text-white">{(state.motion?.gyro?.z || 0).toFixed(4)}</p>
             </div>
          </div>
        </div>

        {/* Smoothing Visualizer */}
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl relative lg:col-span-2">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-green-500" />
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Signal Smoothing (RS-Y)</h4>
          </div>

          <div className="h-48 bg-slate-950 rounded-2xl border border-white/5 relative overflow-hidden flex items-end px-4 gap-0.5">
             {history.map((point, i) => (
               <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 h-full py-4">
                 <div 
                   className="w-full bg-slate-700/50 rounded-t-sm" 
                   style={{ height: `${Math.abs(point.raw) * 50}%` }}
                 />
                 <div 
                   className="w-full bg-green-500/80 rounded-t-sm shadow-[0_0_8px_rgba(34,197,94,0.3)]" 
                   style={{ height: `${Math.abs(point.smoothed) * 50}%` }}
                 />
               </div>
             ))}
             <div className="absolute top-4 right-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-slate-700 rounded-full" />
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Raw HID</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full" />
                   <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Smoothed</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Logic State Indicators */}
      <div className="bg-slate-950/80 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Hardware Signal States</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {profile.mappings.map((m, i) => {
            const isSticky = state.stickyStates[m.button];
            const isTurbo = !!state.turboTicks[NAME_TO_INDEX[m.button]];
            return (
              <div key={i} className={`p-4 rounded-2xl border transition-all ${isSticky || isTurbo ? 'bg-white/5 border-blue-500/30' : 'bg-slate-900 border-white/5 opacity-40'}`}>
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] font-black text-white uppercase">{m.button}</span>
                   <div className="flex gap-1">
                     {isSticky && <Lock className="w-3 h-3 text-amber-500" />}
                     {isTurbo && <Zap className="w-3 h-3 text-yellow-500" />}
                   </div>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                   {(isSticky || isTurbo) && <div className="h-full bg-blue-500 w-full animate-pulse" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestingView;
