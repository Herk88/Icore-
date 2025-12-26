
import React from 'react';
import { useGamepad } from './GamepadProvider';
import { DUALSENSE_INDICES } from '../constants';
import { ControllerButton } from '../types';
import { Activity, Target, Lock, Zap, RefreshCw, Move } from 'lucide-react';

interface DualSenseSVGProps {
  selectedButton?: ControllerButton | null;
  onSelectButton?: (btn: ControllerButton) => void;
  showHeatmap?: boolean;
}

const DualSenseSVG: React.FC<DualSenseSVGProps> = ({ 
  selectedButton, 
  onSelectButton,
  showHeatmap = false 
}) => {
  const { state } = useGamepad();

  const isPressed = (idx: number) => state.buttons[idx] || false;
  const isStickyActive = (idx: number) => state.stickyStates[DUALSENSE_INDICES[idx]] || false;
  
  const isTurboFiring = (idx: number) => {
    const ticks = state.turboTicks[idx] || 0;
    const isActive = isPressed(idx) || isStickyActive(idx);
    return isActive && Math.floor(ticks / 2) % 2 === 0;
  };

  const getHeatmapColor = (btnName: string) => {
    if (!showHeatmap) return null;
    const count = state.heatmap[btnName] || 0;
    if (count === 0) return 'fill-slate-700';
    if (count > 100) return 'fill-red-500';
    if (count > 50) return 'fill-orange-500';
    if (count > 20) return 'fill-yellow-500';
    return 'fill-cyan-500';
  };

  const renderButton = (idx: number, cx: number, cy: number, r = 12, label: string) => {
    const btnName = DUALSENSE_INDICES[idx] as ControllerButton;
    const isSelected = selectedButton === btnName;
    const heatmapColor = getHeatmapColor(btnName);
    const firing = isTurboFiring(idx);
    const sticky = isStickyActive(idx);
    const active = isPressed(idx) || sticky;

    return (
      <g 
        key={idx}
        className="cursor-pointer group" 
        onClick={() => onSelectButton?.(btnName)}
      >
        {sticky && (
          <circle cx={cx} cy={cy} r={r + 8} className="fill-amber-400/10 animate-pulse pointer-events-none" />
        )}
        
        {active && (
          <circle cx={cx} cy={cy} r={r + 5} className="fill-blue-500/20 animate-ping pointer-events-none" />
        )}

        <circle 
          cx={cx} cy={cy} r={r} 
          className={`
            transition-all duration-100 group-hover:fill-slate-600
            ${heatmapColor || (firing ? 'fill-yellow-400' : sticky ? 'fill-amber-400' : active ? 'fill-blue-600' : 'fill-slate-700')} 
            ${isSelected ? 'stroke-blue-400 stroke-[3px]' : ''}
            ${sticky ? 'stroke-amber-300 stroke-[3px]' : ''}
            ${!isSelected && !sticky ? 'stroke-slate-500 stroke-1' : ''}
          `}
        />
        <text 
          x={cx} y={cy + 4} 
          textAnchor="middle" 
          className={`text-[9px] font-black pointer-events-none uppercase select-none ${sticky || firing ? 'fill-slate-950' : 'fill-white'}`}
        >
          {label}
        </text>

        {sticky && (
          <foreignObject x={cx - 8} y={cy - 28} width="16" height="16" className="overflow-visible">
            <div className="flex items-center justify-center bg-amber-400 rounded-full p-1 shadow-2xl border border-slate-950 animate-in zoom-in slide-in-from-top-2">
              <Lock className="w-3 h-3 text-slate-950" strokeWidth={4} />
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  const renderDpad = (idx: number, x: number, y: number) => {
    const btnName = DUALSENSE_INDICES[idx] as ControllerButton;
    const isSelected = selectedButton === btnName;
    const sticky = isStickyActive(idx);
    const firing = isTurboFiring(idx);
    const active = isPressed(idx) || sticky;

    return (
      <g key={idx} className="cursor-pointer group" onClick={() => onSelectButton?.(btnName)}>
        <rect 
          x={x} y={y} width={20} height={20} rx={5}
          className={`
            transition-colors duration-100 hover:fill-slate-600
            ${firing ? 'fill-yellow-400' : sticky ? 'fill-amber-400' : active ? 'fill-blue-600' : 'fill-slate-700'} 
            ${isSelected ? 'stroke-blue-400 stroke-[3px]' : ''}
            ${sticky ? 'stroke-amber-300 stroke-[3px]' : 'stroke-slate-500 stroke-1'}
          `}
        />
      </g>
    );
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto p-12 glass rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden group">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/5 blur-[120px] pointer-events-none" />
      
      <div className="absolute top-8 left-8 flex flex-col gap-3 z-10">
        <div className="flex items-center gap-3 px-5 py-3 bg-slate-950/80 border border-white/10 rounded-2xl backdrop-blur-3xl shadow-xl">
           <Activity className={`w-4 h-4 ${state.connected ? 'text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-slate-600'}`} />
           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{state.connected ? 'LINKED: 1000Hz' : 'HID_WAIT'}</span>
        </div>
      </div>

      <svg viewBox="0 0 400 300" className="w-full h-auto drop-shadow-[0_45px_90px_rgba(0,0,0,0.9)]">
        {/* Chassis Body */}
        <path 
          d="M100,50 Q200,30 300,50 L340,120 Q365,210 320,270 L280,270 Q200,290 120,270 L80,270 Q35,210 60,120 Z" 
          className="fill-slate-900/90 stroke-slate-800 stroke-2"
        />
        
        {/* Touchpad Area */}
        <rect 
          x="125" y="60" width="150" height="75" rx="15"
          onClick={() => onSelectButton?.('TOUCHPAD')}
          className={`cursor-pointer transition-all duration-300 ${isPressed(17) || isStickyActive(17) ? 'fill-blue-900/60 stroke-blue-500 stroke-2 shadow-2xl' : 'fill-slate-800/60 stroke-slate-700'} hover:fill-slate-700`}
        />

        {/* Action Clusters */}
        {renderButton(3, 310, 100, 16, 'Δ')}
        {renderButton(1, 345, 135, 16, 'O')}
        {renderButton(0, 310, 170, 16, 'X')}
        {renderButton(2, 275, 135, 16, '□')}

        {/* Directional Clusters */}
        <g transform="translate(60, 105)">
          {renderDpad(12, 22, 0)}
          {renderDpad(13, 22, 44)}
          {renderDpad(14, 0, 22)}
          {renderDpad(15, 44, 22)}
        </g>

        {/* Stick Precision Anchors */}
        <circle cx="150" cy="225" r="35" className="fill-slate-950/80 stroke-white/5" />
        <circle cx="250" cy="225" r="35" className="fill-slate-950/80 stroke-white/5" />

        {/* Left Neural Stick (L3) */}
        <g transform={`translate(${150 + (state.axes[0] || 0) * 18}, ${225 + (state.axes[1] || 0) * 18})`} className="cursor-pointer" onClick={() => onSelectButton?.('L3')}>
          <circle cx="0" cy="0" r="26" className={`transition-all duration-100 ${isPressed(10) || isStickyActive(10) ? 'fill-blue-600 shadow-xl' : 'fill-slate-700'} ${selectedButton === 'L3' ? 'stroke-blue-400 stroke-[3px]' : 'stroke-slate-600'} ${isStickyActive(10) ? 'stroke-amber-400 stroke-[3px]' : ''}`} />
          {(Math.abs(state.axes[0]) > 0.05 || Math.abs(state.axes[1]) > 0.05) && (
            <path d="M0,0 L-6,-6 L6,-6 Z" className="fill-blue-400 animate-pulse" style={{ transform: `rotate(${Math.atan2(state.axes[1], state.axes[0]) * 180 / Math.PI + 90}deg) translateY(-14px)` }} />
          )}
        </g>

        {/* Right Neural Stick (R3) - With Latency Echo */}
        <g transform={`translate(${250 + (state.axes[2] || 0) * 18}, ${225 + (state.axes[3] || 0) * 18})`} className="cursor-pointer" onClick={() => onSelectButton?.('R3')}>
          {/* Hardware Raw Shadow (The "Echo") */}
          <circle 
            cx={(state.rawAxes[2] - state.axes[2]) * 15} 
            cy={(state.rawAxes[3] - state.axes[3]) * 15} 
            r="24" 
            className="fill-slate-500/20 stroke-slate-500/30" 
          />
          <circle cx="0" cy="0" r="26" className={`transition-all duration-100 ${isPressed(11) || isStickyActive(11) ? 'fill-purple-600 shadow-xl' : 'fill-slate-700'} ${selectedButton === 'R3' ? 'stroke-blue-400 stroke-[3px]' : 'stroke-slate-600'} ${isStickyActive(11) ? 'stroke-amber-400 stroke-[3px]' : ''}`} />
          {(Math.abs(state.axes[2]) > 0.05 || Math.abs(state.axes[3]) > 0.05) && (
            <path d="M0,0 L-6,-6 L6,-6 Z" className="fill-purple-400 animate-pulse" style={{ transform: `rotate(${Math.atan2(state.axes[3], state.axes[2]) * 180 / Math.PI + 90}deg) translateY(-14px)` }} />
          )}
        </g>

        {/* Hardware Shoulders */}
        <path d="M65,40 L115,40 L115,25 L65,25 Z" rx="5" onClick={() => onSelectButton?.('L1')} className={`cursor-pointer transition-all ${isPressed(4) || isStickyActive(4) ? 'fill-blue-600 shadow-lg' : 'fill-slate-800'} stroke-slate-700 ${isStickyActive(4) ? 'stroke-amber-400 stroke-2' : ''}`} />
        <path d="M285,40 L335,40 L335,25 L285,25 Z" rx="5" onClick={() => onSelectButton?.('R1')} className={`cursor-pointer transition-all ${isPressed(5) || isStickyActive(5) ? 'fill-blue-600 shadow-lg' : 'fill-slate-800'} stroke-slate-700 ${isStickyActive(5) ? 'stroke-amber-400 stroke-2' : ''}`} />
        
        {renderButton(8, 110, 80, 8, '')}
        {renderButton(9, 290, 80, 8, '')}
        {renderButton(16, 200, 165, 14, 'PS')}
      </svg>
      
      {!state.connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/98 backdrop-blur-3xl z-40 animate-in fade-in duration-700">
          <div className="text-center p-14 space-y-8">
            <div className="w-28 h-28 bg-red-600/10 rounded-full flex items-center justify-center mx-auto border border-red-500/30 shadow-[0_0_40px_rgba(220,38,38,0.2)]">
              <Activity className="w-14 h-14 text-red-500 animate-pulse" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Hardware Trust Lost</h3>
              <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[11px] max-w-xs mx-auto">Establish DualSense HID Link to Engage Neural Modules</p>
            </div>
            <div className="pt-6">
               <div className="inline-block px-6 py-2 bg-slate-900 border border-white/5 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">Awaiting Descriptor: 0x054C_0CE6</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DualSenseSVG;
