
import React from 'react';
import { useGamepad } from './GamepadProvider';
import { DUALSENSE_INDICES } from '../constants';
import { ControllerButton } from '../types';
import { Activity, Target, Lock, Zap, RefreshCw } from 'lucide-react';

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
        {/* Latch Halo Layer */}
        {sticky && (
          <circle 
            cx={cx} cy={cy} r={r + 8} 
            className="fill-yellow-500/20 animate-pulse pointer-events-none" 
          />
        )}
        
        {/* Signal Ping for Hardware Activity */}
        {active && (
          <circle 
            cx={cx} cy={cy} r={r + 4} 
            className={`fill-${firing ? 'yellow' : sticky ? 'amber' : 'blue'}-500/20 animate-ping pointer-events-none`} 
          />
        )}

        <circle 
          cx={cx} cy={cy} r={r} 
          className={`
            transition-all duration-100 group-hover:fill-slate-600
            ${heatmapColor || (firing ? 'fill-yellow-400' : sticky ? 'fill-amber-500' : active ? 'fill-blue-500' : 'fill-slate-700')} 
            ${isSelected ? 'stroke-blue-400 stroke-[3px]' : ''}
            ${sticky ? 'stroke-yellow-500 stroke-[3px] drop-shadow-[0_0_15px_rgba(234,179,8,0.9)]' : ''}
            ${!isSelected && !sticky && !toggled ? 'stroke-slate-500 stroke-1' : ''}
            ${firing ? 'animate-pulse' : ''}
          `}
        />
        <text 
          x={cx} y={cy + 4} 
          textAnchor="middle" 
          className="fill-white text-[8px] font-bold pointer-events-none uppercase select-none"
        >
          {label}
        </text>

        {/* Latch Status Indicator */}
        {sticky && (
          <foreignObject x={cx - 7} y={cy - 26} width="14" height="14" className="overflow-visible">
            <div className="flex items-center justify-center bg-yellow-500 rounded-full p-0.5 shadow-xl border border-slate-950 animate-in zoom-in slide-in-from-top-2 duration-300">
              <Lock className="w-2.5 h-2.5 text-slate-950" strokeWidth={4} />
            </div>
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
          <rect x={x-2} y={y-2} width={22} height={22} rx={6} className="fill-yellow-500/20 animate-pulse pointer-events-none" />
        )}
        <rect 
          x={x} y={y} width={18} height={18} rx={4}
          className={`
            transition-colors duration-100 hover:fill-slate-600
            ${heatmapColor || (firing ? 'fill-yellow-400' : sticky ? 'fill-amber-500' : active ? 'fill-blue-500' : 'fill-slate-700')} 
            ${isSelected ? 'stroke-blue-400 stroke-[3px]' : ''}
            ${sticky ? 'stroke-yellow-500 stroke-[3px] drop-shadow-[0_0_12px_rgba(234,179,8,0.7)]' : ''}
            ${!isSelected && !sticky && !toggled ? 'stroke-slate-500 stroke-1' : ''}
          `}
        />
        {sticky && (
          <foreignObject x={x + 3} y={y - 12} width="12" height="12">
            <div className="bg-yellow-500 rounded-full p-0.5 shadow-md animate-bounce">
               <Lock className="w-2.5 h-2.5 text-slate-950" strokeWidth={4} />
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  const gyroTilt = state.motion?.gyro ? {
    rotate: `${state.motion.gyro.x * 25}deg`,
    translateX: `${state.motion.gyro.y * 12}px`
  } : {};

  return (
    <div className="relative w-full max-w-2xl mx-auto p-10 glass rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden group/svg">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/10 blur-[120px] pointer-events-none" />
      
      <div className="absolute top-8 left-8 flex flex-col gap-3 z-10">
        {state.gyroActive && (
          <div className="flex items-center gap-2.5 px-5 py-2.5 bg-blue-600/20 border border-blue-400/40 rounded-2xl shadow-xl animate-pulse backdrop-blur-xl">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Gyro Core Live</span>
          </div>
        )}
        {state.oneHandedShiftActive && (
          <div className="flex items-center gap-2.5 px-5 py-2.5 bg-purple-600/20 border border-purple-400/40 rounded-2xl shadow-xl animate-pulse backdrop-blur-xl">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Shift Protocol</span>
          </div>
        )}
      </div>

      <div style={{ transition: 'transform 0.1s cubic-bezier(0.1, 0, 0.2, 1)', transform: `perspective(1200px) rotateX(${gyroTilt.rotate || '0deg'}) translateX(${gyroTilt.translateX || '0px'})` }}>
        <svg viewBox="0 0 400 300" className="w-full h-auto drop-shadow-[0_40px_80px_rgba(0,0,0,0.7)]">
          <path 
            d="M100,50 Q200,30 300,50 L340,120 Q360,200 320,260 L280,260 Q200,280 120,260 L80,260 Q40,200 60,120 Z" 
            className="fill-slate-800/90 stroke-slate-700 stroke-2"
          />
          
          <rect 
            x="130" y="60" width="140" height="70" rx="14"
            onClick={() => onSelectButton?.('TOUCHPAD')}
            className={`cursor-pointer transition-all duration-300 ${isPressed(17) || isStickyActive(17) ? 'fill-blue-900/50 stroke-blue-400 stroke-2' : 'fill-slate-700/50 stroke-slate-600'} hover:fill-slate-600`}
          />
          <text x="200" y="100" textAnchor="middle" className="fill-slate-600 text-[9px] font-black tracking-[0.4em] pointer-events-none uppercase">HID Touchpad</text>

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

          {/* Analog Sticks with precise deflection tracking */}
          <g transform={`translate(${150 + (state.axes[0] || 0) * 14}, ${220 + (state.axes[1] || 0) * 14})`} className="cursor-pointer" onClick={() => onSelectButton?.('L3')}>
            <circle cx="0" cy="0" r="30" className="fill-slate-900/80 stroke-slate-700 stroke-2" />
            <circle cx="0" cy="0" r="22" className={`transition-colors duration-100 ${isPressed(10) || isStickyActive(10) ? 'fill-blue-500' : 'fill-slate-700'} ${selectedButton === 'L3' ? 'stroke-blue-400 stroke-[3px]' : ''} ${isStickyActive(10) ? 'stroke-yellow-500 stroke-[3px]' : ''}`} />
          </g>
          <g transform={`translate(${250 + (state.axes[2] || 0) * 14}, ${220 + (state.axes[3] || 0) * 14})`} className="cursor-pointer" onClick={() => onSelectButton?.('R3')}>
            <circle cx="0" cy="0" r="30" className="fill-slate-900/80 stroke-slate-700 stroke-2" />
            <circle cx="0" cy="0" r="22" className={`transition-colors duration-100 ${isPressed(11) || isStickyActive(11) ? 'fill-blue-500' : 'fill-slate-700'} ${selectedButton === 'R3' ? 'stroke-blue-400 stroke-[3px]' : ''} ${isStickyActive(11) ? 'stroke-yellow-500 stroke-[3px]' : ''}`} />
          </g>

          {/* Shoulder Trigger Visualization */}
          <path d="M70,40 L120,40 L120,30 L70,30 Z" rx="4" onClick={() => onSelectButton?.('L1')} className={`cursor-pointer transition-all duration-100 ${isPressed(4) || isStickyActive(4) ? 'fill-blue-500' : 'fill-slate-700'} stroke-slate-600 ${isStickyActive(4) ? 'stroke-yellow-500 stroke-2' : ''}`} />
          <path d="M280,40 L330,40 L330,30 L280,30 Z" rx="4" onClick={() => onSelectButton?.('R1')} className={`cursor-pointer transition-all duration-100 ${isPressed(5) || isStickyActive(5) ? 'fill-blue-500' : 'fill-slate-700'} stroke-slate-600 ${isStickyActive(5) ? 'stroke-yellow-500 stroke-2' : ''}`} />
          
          <renderButton(8, 115, 85, 8, '') />
          <renderButton(9, 285, 85, 8, '') />
          <renderButton(16, 200, 160, 12, 'PS') />
        </svg>
      </div>
      
      {!state.connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl rounded-[3.5rem] z-30">
          <div className="text-center p-16 bg-slate-900/50 rounded-[3rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-blue-600/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/20">
              <Activity className="w-12 h-12 text-blue-500 animate-pulse" />
            </div>
            <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Engine Standby</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Initialize HID Link to Engage</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DualSenseSVG;
