
import React from 'react';
import { RadialItem } from '../types';
import { MousePointer2, Zap, Shield, Sword } from 'lucide-react';

interface RadialMenuProps {
  isOpen: boolean;
  items: RadialItem[];
  onSelect: (item: RadialItem) => void;
}

const RadialMenu: React.FC<RadialMenuProps> = ({ isOpen, items, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-80 h-80">
        {/* Center Point */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.5)] border-4 border-white/20 z-10">
          <Zap className="text-white w-8 h-8 animate-pulse" />
        </div>

        {items.map((item, i) => {
          const angle = (i / items.length) * 2 * Math.PI;
          const x = Math.cos(angle) * 120;
          const y = Math.sin(angle) * 120;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
              className="absolute top-1/2 left-1/2 w-24 h-24 bg-slate-900 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-blue-600 hover:scale-110 transition-all group shadow-xl"
            >
              <div className="text-blue-400 group-hover:text-white transition-colors">
                {item.icon === 'Sword' && <Sword className="w-8 h-8" />}
                {item.icon === 'Shield' && <Shield className="w-8 h-8" />}
                {item.icon === 'Zap' && <Zap className="w-8 h-8" />}
                {item.icon === 'Mouse' && <MousePointer2 className="w-8 h-8" />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">{item.label}</span>
            </button>
          );
        })}
      </div>
      <p className="absolute bottom-20 text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">Move Stick to Select</p>
    </div>
  );
};

export default RadialMenu;
