
import React from 'react';

interface CurveEditorProps {
  type: 'LINEAR' | 'EXPONENTIAL' | 'INSTANT' | 'CUSTOM';
  onChange: (type: any) => void;
}

const CurveEditor: React.FC<CurveEditorProps> = ({ type, onChange }) => {
  const getPath = () => {
    switch (type) {
      case 'LINEAR': return "M 0 100 L 100 0";
      case 'EXPONENTIAL': return "M 0 100 Q 80 100 100 0";
      case 'INSTANT': return "M 0 100 L 0 0 L 100 0";
      default: return "M 0 100 L 100 0";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Response Curve</span>
        <div className="flex gap-1">
          {(['LINEAR', 'EXPONENTIAL', 'INSTANT'] as const).map(t => (
            <button
              key={t}
              onClick={() => onChange(t)}
              className={`px-2 py-1 rounded text-[8px] font-bold border transition-all ${type === t ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-white/5 text-slate-500'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative aspect-square w-full bg-slate-950 rounded-xl border border-white/5 overflow-hidden p-4">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          
          {/* Main Curve */}
          <path 
            d={getPath()} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="3" 
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-500"
          />
          
          {/* Area under curve */}
          <path 
            d={getPath() + " L 100 100 L 0 100 Z"} 
            fill="url(#curveGradient)" 
            className="opacity-20 transition-all duration-500"
          />
          
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
        
        <div className="absolute bottom-2 left-2 text-[8px] text-slate-600 font-bold uppercase tracking-tighter">Physical Input</div>
        <div className="absolute top-2 right-2 text-[8px] text-slate-600 font-bold uppercase tracking-tighter text-right">Virtual Output</div>
      </div>
    </div>
  );
};

export default CurveEditor;
