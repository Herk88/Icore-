
import React from 'react';
import { Profile, Mapping, ControllerButton } from '../types';
import { Keyboard, MousePointer2, Edit3, Lock, Zap, RefreshCcw, LayoutGrid, MonitorDot, ListMusic, Layers } from 'lucide-react';

interface MappingListProps {
  profile: Profile;
  onUpdateMapping: (updatedMapping: Mapping) => void;
  onSelectButton?: (btn: ControllerButton) => void;
}

const TYPE_CONFIG = {
  KEYBOARD: { icon: Keyboard, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  MOUSE: { icon: MousePointer2, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  MACRO: { icon: ListMusic, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  RADIAL_MENU: { icon: LayoutGrid, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  SYSTEM_ACTION: { icon: MonitorDot, color: 'text-rose-400', bg: 'bg-rose-400/10' },
};

const MappingList: React.FC<MappingListProps> = ({ profile, onSelectButton }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hardware Bindings</h3>
        <div className="flex items-center gap-2">
           <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
           <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{profile.mappings.length} Active Stacks</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {profile.mappings.length === 0 ? (
          <div className="p-12 border border-dashed border-white/5 rounded-3xl text-center flex flex-col items-center gap-4 bg-slate-900/20">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Active Hardware Hooks</p>
          </div>
        ) : profile.mappings.map((m, idx) => {
          const config = TYPE_CONFIG[m.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.KEYBOARD;
          const Icon = config.icon;
          
          return (
            <div 
              key={idx} 
              onClick={() => onSelectButton?.(m.button)}
              className="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group backdrop-blur-sm cursor-pointer hover:bg-slate-900/60"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 flex items-center justify-center bg-slate-800 rounded-2xl text-[12px] font-black text-white border border-white/5 shadow-inner group-hover:text-blue-400 transition-colors">
                  {m.button}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-1 rounded-md ${config.bg}`}>
                      <Icon className={`w-3 h-3 ${config.color}`} />
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${config.color}`}>
                      {m.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-white uppercase tracking-tighter">
                      {m.mappedTo}
                    </p>
                    <div className="flex gap-1.5 items-center">
                      {m.isSticky && <Lock className="w-3 h-3 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />}
                      {m.isToggle && <RefreshCcw className="w-3 h-3 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />}
                      {m.isTurbo && (
                        <div className="flex items-center gap-1">
                           <Zap className="w-3 h-3 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
                           {m.burstMode && <Layers className="w-2.5 h-2.5 text-yellow-500/60" />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                  <Edit3 className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MappingList;
