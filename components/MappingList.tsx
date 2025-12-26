
import React from 'react';
import { Profile, Mapping, ControllerButton } from '../types';
import { Keyboard, MousePointer2, Edit3, Lock, Zap, RefreshCcw, LayoutGrid, MonitorDot, ListMusic, Layers, ChevronRight } from 'lucide-react';

interface MappingListProps {
  profile: Profile;
  onUpdateMapping: (btn: ControllerButton, updatedMapping: Partial<Mapping>) => void;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Active Hardware Stacks</h3>
        <div className="flex items-center gap-3">
           <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,1)]" />
           <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{profile.mappings.length} Hooks Engaged</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
        {profile.mappings.length === 0 ? (
          <div className="p-16 border border-dashed border-white/5 rounded-[2.5rem] text-center flex flex-col items-center gap-6 bg-slate-900/10">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/40 flex items-center justify-center">
              <Zap className="w-6 h-6 text-slate-700" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Awaiting Command Link</p>
              <p className="text-[9px] font-bold text-slate-700 uppercase">Select a controller button to begin mapping</p>
            </div>
          </div>
        ) : profile.mappings.map((m, idx) => {
          const config = TYPE_CONFIG[m.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.KEYBOARD;
          const Icon = config.icon;
          
          return (
            <div 
              key={`${m.button}-${idx}`} 
              onClick={() => onSelectButton?.(m.button)}
              className="flex items-center justify-between p-5 bg-slate-950/40 rounded-3xl border border-white/5 hover:border-blue-500/40 transition-all group backdrop-blur-xl cursor-pointer hover:bg-slate-900/40 shadow-xl"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 flex flex-col items-center justify-center bg-slate-900 rounded-2xl text-[14px] font-black text-white border border-white/5 shadow-inner group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all">
                  <span className="text-[8px] text-slate-600 mb-0.5 font-bold uppercase tracking-widest">HW</span>
                  {m.button}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1.5 rounded-lg ${config.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${config.color}`}>
                      {m.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-black text-white uppercase tracking-tighter group-hover:text-blue-200 transition-colors">
                      {m.mappedTo === 'None' ? 'Unlinked' : m.mappedTo}
                    </p>
                    <div className="flex gap-2 items-center">
                      {m.isSticky && <Lock className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-in zoom-in" />}
                      {m.isToggle && <RefreshCcw className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-in zoom-in" />}
                      {m.isTurbo && (
                        <div className="flex items-center gap-1 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">
                           <Zap className="w-3 h-3 text-yellow-400" />
                           <span className="text-[7px] font-black text-yellow-500 uppercase">Turbo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl transition-all opacity-40 group-hover:opacity-100 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                  <ChevronRight className="w-5 h-5" />
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
