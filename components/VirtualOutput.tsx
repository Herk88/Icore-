
import React from 'react';
import { useGamepad } from './GamepadProvider';
import { Profile } from '../types';
import { Terminal, Activity, Move, MousePointer2, Keyboard as KbIcon } from 'lucide-react';

interface VirtualOutputProps {
  profile: Profile;
}

const VirtualOutput: React.FC<VirtualOutputProps> = ({ profile }) => {
  const { state } = useGamepad();

  const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  const isKeyPressed = (k: string) => {
    const code = `Key${k}`;
    return state.virtualKeys.has(code) || state.virtualKeys.has(k);
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-[2rem] p-8 border border-blue-500/20 shadow-xl overflow-hidden bg-slate-950/40">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-blue-400">
            <KbIcon className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Virtual Keyboard Hook</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${state.virtualKeys.size > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
            <span className="text-[9px] font-black text-slate-500 uppercase">Signals Active</span>
          </div>
        </div>

        <div className="space-y-3">
          {keys.map((row, i) => (
            <div key={i} className="flex gap-2 justify-center">
              {row.map(k => (
                <div 
                  key={k} 
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-75 font-black text-xs ${
                    isKeyPressed(k) 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110' 
                      : 'bg-slate-900 border-white/5 text-slate-700'
                  }`}
                >
                  {k}
                </div>
              ))}
            </div>
          ))}
          <div className="flex gap-2 justify-center mt-4">
             <div className={`h-8 w-48 rounded-xl border flex items-center justify-center transition-all font-black text-[10px] uppercase tracking-widest ${
               state.virtualKeys.has('Space') ? 'bg-blue-600 border-blue-400 text-white scale-105' : 'bg-slate-900 border-white/5 text-slate-700'
             }`}>SPACE</div>
          </div>
        </div>
      </div>

      <div className="glass rounded-[2rem] p-8 border border-purple-500/20 shadow-xl overflow-hidden bg-slate-950/40">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-purple-400">
            <MousePointer2 className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Virtual Mouse Matrix</span>
          </div>
          <span className="text-[9px] font-mono text-purple-500/60">X: {state.mousePosition.x.toFixed(0)} Y: {state.mousePosition.y.toFixed(0)}</span>
        </div>

        <div className="aspect-video bg-slate-950 rounded-2xl border border-white/5 relative overflow-hidden group">
           <div className="absolute inset-0 opacity-10">
              <div className="h-full w-px bg-white/20 absolute left-1/4" />
              <div className="h-full w-px bg-white/20 absolute left-1/2" />
              <div className="h-full w-px bg-white/20 absolute left-3/4" />
              <div className="w-full h-px bg-white/20 absolute top-1/2" />
           </div>
           <div 
             className="absolute w-6 h-6 -ml-3 -mt-3 text-purple-400 transition-all duration-75"
             style={{ left: `${(state.mousePosition.x / 1000) * 100}%`, top: `${(state.mousePosition.y / 1000) * 100}%` }}
           >
              <MousePointer2 className="w-full h-full fill-current drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualOutput;
