
import React from 'react';
import { useGamepad } from './GamepadProvider';
import { BarChart3, Clock, Zap, Target } from 'lucide-react';

const AnalyticsView: React.FC = () => {
  const { state, resetStats } = useGamepad();
  
  const sessionDuration = Math.floor((Date.now() - state.sessionStartTime) / 1000);
  const minutes = Math.floor(sessionDuration / 60);
  const seconds = sessionDuration % 60;
  
  // Fixed: Cast totalInputs and minutes to any/number to resolve arithmetic type error
  const ipm = minutes > 0 ? Math.floor((state.totalInputs as any) / (minutes as any)) : state.totalInputs;

  const topButtons = Object.entries(state.heatmap)
    .sort(([, a], [, b]) => (b as any) - (a as any))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Session', val: `${minutes}m ${seconds}s`, icon: Clock, color: 'text-blue-400' },
          { label: 'Total Inputs', val: state.totalInputs, icon: Zap, color: 'text-yellow-400' },
          { label: 'IPM', val: ipm, icon: Target, color: 'text-red-400' },
          { label: 'Latency', val: '1.2ms', icon: BarChart3, color: 'text-green-400' },
        ].map((stat, i) => (
          <div key={i} className="glass p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-white tracking-tight">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Input Frequency (Session)</h3>
          <button 
            onClick={resetStats}
            className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors"
          >
            RESET STATS
          </button>
        </div>

        <div className="space-y-4">
          {topButtons.length > 0 ? topButtons.map(([name, count], i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">{name}</span>
                <span className="text-slate-500">{count} clicks</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000" 
                  // Fixed: Cast count and totalInputs to any/number to resolve arithmetic type error
                  style={{ width: `${Math.min(100, ((count as any) / (state.totalInputs as any)) * 300)}%` }} 
                />
              </div>
            </div>
          )) : (
            <p className="text-center text-slate-600 py-8 italic text-sm">Start pressing buttons to see analytics...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
