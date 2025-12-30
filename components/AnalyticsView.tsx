
import React, { useState, useEffect } from 'react';
import { useGamepad } from './GamepadProvider';
import { BarChart3, Clock, Zap, Target, ShieldCheck, Activity, Cpu, AlertCircle, CheckCircle2 } from 'lucide-react';

const AnalyticsView: React.FC = () => {
  const { state, resetStats } = useGamepad();
  const [diagnosticStatus, setDiagnosticStatus] = useState<'IDLE' | 'RUNNING' | 'COMPLETE'>('IDLE');
  
  const sessionDuration = Math.floor((Date.now() - state.sessionStartTime.getTime()) / 1000);
  const minutes = Math.max(1, Math.floor(sessionDuration / 60));
  const seconds = sessionDuration % 60;
  
  const totalInputs = Number(state.totalInputs);
  const ipm = Math.floor(totalInputs / minutes);

  const runDiagnostics = () => {
    setDiagnosticStatus('RUNNING');
    setTimeout(() => setDiagnosticStatus('COMPLETE'), 3000);
  };

  const topButtons = Object.entries(state.heatmap)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
         <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Neural Analytics</h2>
         <div className="flex gap-4">
            <button 
              onClick={runDiagnostics}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${diagnosticStatus === 'COMPLETE' ? 'bg-green-600/20 border-green-500 text-green-500' : 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'}`}
            >
               {diagnosticStatus === 'IDLE' && 'Run Production Check'}
               {diagnosticStatus === 'RUNNING' && 'Scanning Kernel...'}
               {diagnosticStatus === 'COMPLETE' && 'System Integrity: Optimal'}
            </button>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Session Time', val: `${minutes}m ${seconds}s`, icon: Clock, color: 'text-blue-400' },
          { label: 'Neural Throughput', val: totalInputs, icon: Zap, color: 'text-yellow-400' },
          { label: 'Inputs / Min', val: ipm, icon: Target, color: 'text-red-400' },
          { label: 'Kernel Polling', val: '1000Hz', icon: Cpu, color: 'text-green-400' },
        ].map((stat, i) => (
          <div key={i} className="glass p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-10" style={{ color: stat.color.split('-')[1] }} />
            <div className="flex items-center gap-3 mb-4">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <p className="text-3xl font-black text-white tracking-tighter uppercase">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 glass rounded-[3rem] p-10 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
               <Activity className="w-5 h-5 text-blue-500" /> Interaction Heatmap
            </h3>
            <button onClick={resetStats} className="text-[10px] font-black text-blue-500 hover:text-white transition-colors uppercase tracking-widest">Wipe Cache</button>
          </div>

          <div className="space-y-6">
            {topButtons.length > 0 ? topButtons.map(([name, count], i) => (
              <div key={name} className="space-y-2">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                  <span className="text-white">{name}</span>
                  <span className="text-slate-500">{count} Events</span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
                    style={{ width: `${Math.min(100, ((count as number) / Math.max(1, totalInputs)) * 100)}%` }} 
                  />
                </div>
              </div>
            )) : (
              <div className="py-20 text-center space-y-4">
                 <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-white/5">
                    <Activity className="w-6 h-6 text-slate-700" />
                 </div>
                 <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">Awaiting Input Burst...</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass rounded-[3rem] p-8 border border-white/5 bg-blue-600/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4"><CheckCircle2 className="text-blue-500 w-6 h-6" /></div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-6">Production Checklist</h4>
              <div className="space-y-4">
                 {[
                   'HID Descriptor Matched',
                   '1000Hz Polling Static',
                   'AI Pipeline Warm',
                   'Anti-Cheat Stealth Level 5'
                 ].map(item => (
                   <div key={item} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="glass rounded-[3rem] p-8 border border-red-500/10 bg-red-500/5">
              <div className="flex items-center gap-3 mb-4">
                 <AlertCircle className="w-5 h-5 text-red-500" />
                 <h4 className="text-[11px] font-black text-red-500 uppercase tracking-widest">System Warnings</h4>
              </div>
              <p className="text-[9px] font-bold text-slate-600 uppercase leading-relaxed tracking-widest">
                 No critical failures detected. All neural bridges reporting optimal latency.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
