
import React from 'react';
import { Profile, Mapping } from '../types';
import { Keyboard, MousePointer2, Edit3, Lock, Zap, RefreshCcw } from 'lucide-react';

interface MappingListProps {
  profile: Profile;
  onUpdateMapping: (updatedMapping: Mapping) => void;
}

const MappingList: React.FC<MappingListProps> = ({ profile }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hardware Bindings</h3>
        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{profile.mappings.length} Active</span>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {profile.mappings.length === 0 ? (
          <div className="p-8 border border-dashed border-white/5 rounded-3xl text-center">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Custom Mappings</p>
          </div>
        ) : profile.mappings.map((m, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-xl text-[10px] font-black text-blue-400 border border-white/5">
                {m.button}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">Redirected To</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-white uppercase tracking-tighter">{m.mappedTo}</p>
                  <div className="flex gap-1.5 items-center">
                    {m.isSticky && <Lock className="w-3 h-3 text-amber-400" />}
                    {m.isToggle && <RefreshCcw className="w-3 h-3 text-cyan-400" />}
                    {m.isTurbo && <Zap className="w-3 h-3 text-yellow-400" />}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg">
                {m.type === 'KEYBOARD' ? (
                  <Keyboard className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <MousePointer2 className="w-3.5 h-3.5 text-purple-400" />
                )}
              </div>
              <button className="p-2 hover:bg-white/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                <Edit3 className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MappingList;
