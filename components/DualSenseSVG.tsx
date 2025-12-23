
import React from 'react';
import { useGamepad } from './GamepadProvider';
import { DUALSENSE_INDICES } from '../constants';
import { ControllerButton } from '../types';
import { Activity, Target, Lock, RefreshCcw, Zap, RefreshCw } from 'lucide-react';

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
  const isToggleActive = (idx: number) => state.toggleStates[DUALSENSE_INDICES[idx]] || false;
  
  const isTurboFiring = (idx: number) => {
    const ticks = state.turboTicks[idx] || 0;
    const isActive = isPressed(idx) || isStickyActive(idx) || isToggleActive(idx);
    // Visual pulse logic: toggle visibility based on turbo ticks for rapid-fire effect
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
    const toggled = isToggleActive(idx);

    const active = isPressed(idx) || sticky || toggled;

    return (
      <g 
        className="cursor-pointer group" 
        onClick={() => onSelectButton?.(btnName)}
      >
        {/* Glow Layer for Sticky */}
        {sticky && (
          <circle 
            cx={cx} cy={cy} r={r + 8} 
            className="fill-yellow-500/10 animate-pulse pointer-events-none" 
          />
        )}
        
        {/* Pulsing Outer Ring for Active */}
        {active && (
          <circle cx={cx} cy={cy} r={r + 4} className={`fill-${firing ? 'yellow' : sticky ? 'amber' : 'blue'}-500/10 animate-ping pointer-events-none`} />
        )}

        <circle 
          cx={cx} cy={cy} r={r} 
          className={`
            transition-all duration-75 group-hover:fill-slate-600
            ${heatmapColor || (firing ? 'fill-yellow-400' : sticky ? 'fill-amber-600' : active ? 'fill-blue-500' : 'fill-slate-700')} 
            ${isSelected ? 'stroke-blue-400 stroke-[3px]' : ''}
            ${sticky ? 'stroke-yellow-400 stroke-[4px] drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]' : ''}
            ${toggled && !sticky ? 'stroke-cyan-400 stroke-[3px] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''}
            ${!isSelected && !sticky && !toggled ? 'stroke-slate-500 stroke-1' : ''}
            ${firing ? 'animate-pulse' : ''}
          `}
        />
        <text 
          x={cx} y={cy + 4} 
          textAnchor="middle" 
          className="fill-white text-[8px] font-bold pointer-events-none uppercase"
        >
          {label}
        </text>

        {/* Status Icons */}
        {sticky && (
          <foreignObject x={cx - 7} y={cy - 24} width="14" height="14" className="overflow-visible">
            <div className="flex items-center justify-center bg-yellow-500 rounded-full p-0.5 shadow-lg border border-slate-900 animate-in zoom-in duration-200">
              <Lock className="w-2.5 h-2.5 text-slate-900" strokeWidth={3} />
            </div>
          </foreignObject>
        )}
        {firing && (
          <foreignObject x={cx + 10} y={cy - 10} width="14" height="14" className="overflow-visible">
            <Zap className="w-4 h-4 text-yellow-400 animate-bounce fill-yellow-400" />
          </foreignObject>
        )}
      </g>
    );
  };

  const renderDpad = (idx: number, x: number, y: number) => {
    const btnName = DUALSENSE_INDICES[idx] as ControllerButton;
    const isSelected = selectedButton === btnName;
    const heatmapColor = getHeatmapColor(btnName);
    const sticky = isStickyActive(idx);
    const toggled = isToggleActive(idx);
    const firing = isTurboFiring(idx);
    const active = isPressed(idx) || sticky || toggled;

    return (
      <g className="cursor-pointer group" onClick={() => onSelectButton?.(btnName)}>
        {sticky && (
          <rect x={x-2} y={y-2} width={22} height={22} rx={6} className="fill-yellow-500/10 animate-pulse pointer-events-none" />
        )}
        <rect 
          x={x} y={y} width={18} height={18} rx={4}
          className={`
            transition-colors hover:fill-slate-600
            ${heatmapColor || (firing ? 'fill-yellow-400' : sticky ? 'fill-amber-600' : active ? 'fill-blue-500' : 'fill-slate-700')} 
            ${isSelected ? 'stroke-blue-400 stroke-[2px]' : ''}
            ${sticky ? 'stroke-yellow-400 stroke-[3px] drop-shadow-[0_0_10px_rgba(234,179,8,0.7)]' : ''}
            ${toggled && !sticky ? 'stroke-cyan-400 stroke-[2px]' : ''}
            ${!isSelected && !sticky && !toggled ? 'stroke-slate-500 stroke-1' : ''}
            ${firing ? 'animate-pulse' : ''}
          `}
        />
        {sticky && (
          <foreignObject x={x + 3} y={y - 10} width="12" height="12">
            <div className="bg-yellow-500 rounded-full p-0.5">
               <Lock className="w-2.5 h-2.5 text-slate-900" strokeWidth={3} />
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  const gyroTilt = state.motion?.gyro ? {
    rotate: `${state.motion.gyro.x * 20}deg`,
    translateX: `${state.motion.gyro.y * 10}px`
  } : {};

  return (
    <div className="relative w-full max-w-2xl mx-auto p-8 glass rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden group/svg">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none" />
      
      <div className="absolute top-6 left-6 flex flex-col gap-3">
        {state.gyroActive && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-2xl shadow-lg animate-pulse backdrop-blur-md">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Gyro Active</span>
          </div>
        )}
        {state.oneHandedShiftActive && (
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-2xl shadow-lg animate-pulse backdrop-blur-md">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Shift Active</span>
          </div>
        )}
      </div>

      <div style={{ transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)', transform: `perspective(1000px) rotateX(${gyroTilt.rotate || '0deg'}) translateX(${gyroTilt.translateX || '0px'})` }}>
        <svg viewBox="0 0 400 300" className="w-full h-auto drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
          <path 
            d="M100,50 Q200,30 300,50 L340,120 Q360,200 320,260 L280,260 Q200,280 120,260 L80,260 Q40,200 60,120 Z" 
            className="fill-slate-800 stroke-slate-700 stroke-2"
          />
          
          <rect 
            x="130" y="60" width="140" height="70" rx="12"
            onClick={() => onSelectButton?.('TOUCHPAD')}
            className={`cursor-pointer transition-all duration-300 ${isPressed(17) || isStickyActive(17) || isToggleActive(17) ? 'fill-blue-900 stroke-blue-400 stroke-2' : 'fill-slate-700 stroke-slate-600'} hover:fill-slate-600`}
          />
          <text x="200" y="100" textAnchor="middle" className="fill-slate-500 text-[10px] font-black tracking-[0.3em] pointer-events-none uppercase">Touchpad</text>

          {/* Face Buttons */}
          {renderButton(3, 300, 100, 15, 'Δ')}
          {renderButton(1, 335, 135, 15, 'O')}
          {renderButton(0, 300, 170, 15, 'X')}
          {renderButton(2, 265, 135, 15, '□')}

          {/* D-Pad */}
          <g transform="translate(65, 105)">
            {renderDpad(12, 20, 0)}
            {renderDpad(13, 20, 40)}
            {renderDpad(14, 0, 20)}
            {renderDpad(15, 40, 20)}
          </g>

          {/* Analog Sticks */}
          <g transform={`translate(${150 + (state.axes[0] || 0) * 12}, ${220 + (state.axes[1] || 0) * 12})`} className="cursor-pointer" onClick={() => onSelectButton?.('L3')}>
            <circle cx="0" cy="0" r="28" className="fill-slate-900 stroke-slate-700 stroke-2" />
            <circle cx="0" cy="0" r="20" className={`transition-colors ${isPressed(10) || isStickyActive(10) ? 'fill-blue-500' : 'fill-slate-700'} ${selectedButton === 'L3' ? 'stroke-blue-400 stroke-2' : ''} ${isStickyActive(10) ? 'stroke-yellow-400 stroke-2' : ''}`} />
          </g>
          <g transform={`translate(${250 + (state.axes[2] || 0) * 12}, ${220 + (state.axes[3] || 0) * 12})`} className="cursor-pointer" onClick={() => onSelectButton?.('R3')}>
            <circle cx="0" cy="0" r="28" className="fill-slate-900 stroke-slate-700 stroke-2" />
            <circle cx="0" cy="0" r="20" className={`transition-colors ${isPressed(11) || isStickyActive(11) ? 'fill-blue-500' : 'fill-slate-700'} ${selectedButton === 'R3' ? 'stroke-blue-400 stroke-2' : ''} ${isStickyActive(11) ? 'stroke-yellow-400 stroke-2' : ''}`} />
          </g>

          {/* Shoulder Buttons */}
          <path d="M70,40 L120,40 L120,30 L70,30 Z" rx="4" onClick={() => onSelectButton?.('L1')} className={`cursor-pointer transition-all ${isPressed(4) || isStickyActive(4) || isToggleActive(4) ? 'fill-blue-500 shadow-lg' : 'fill-slate-700'} stroke-slate-600 ${isStickyActive(4) ? 'stroke-yellow-400 stroke-2' : ''}`} />
          <path d="M280,40 L330,40 L330,30 L280,30 Z" rx="4" onClick={() => onSelectButton?.('R1')} className={`cursor-pointer transition-all ${isPressed(5) || isStickyActive(5) || isToggleActive(5) ? 'fill-blue-500 shadow-lg' : 'fill-slate-700'} stroke-slate-600 ${isStickyActive(5) ? 'stroke-yellow-400 stroke-2' : ''}`} />
          
          {/* Functional Buttons */}
          {renderButton(8, 115, 85, 8, '')}
          {renderButton(9, 285, 85, 8, '')}
          {renderButton(16, 200, 160, 12, 'PS')}
        </svg>
      </div>
      
      {!state.connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-md rounded-[3rem] z-20">
          <div className="text-center p-12 bg-slate-900/50 rounded-[2.5rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-blue-600/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20">
              <Activity className="w-10 h-10 text-blue-500 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Stack Isolated</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Connect DualSense to engage mapper</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DualSenseSVG;
