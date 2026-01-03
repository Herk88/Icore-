
import React, { useState, useEffect, useRef } from 'react';
/* Added Loader2 to imports from lucide-react */
import { ShieldAlert, ShieldCheck, Radar, Cpu, Globe, Server, AlertTriangle, Terminal, Loader2, Activity } from 'lucide-react';
import { SecurityEvent } from '../types';
import { useGamepad } from './GamepadProvider';

const SecurityInterceptor: React.FC = () => {
  const { state } = useGamepad();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const prevTotalInputsRef = useRef(0);

  useEffect(() => {
    if (state.totalInputs > prevTotalInputsRef.current) {
        // New input detected, generate a real log event
        const diff = state.totalInputs - prevTotalInputsRef.current;
        prevTotalInputsRef.current = state.totalInputs;

        const activeKeys = Array.from(state.virtualKeys).join(', ') || 'MOUSE_MOVE';
        
        const newEvent: SecurityEvent = {
            timestamp: new Date().toLocaleTimeString(),
            device: state.id || 'HID_GENERIC',
            sourceIp: 'LOCALHOST',
            destination: 'KERNEL_BUS',
            destIp: '127.0.0.1',
            protocol: 'HID/IPC',
            size: `${128 * diff} B`,
            info: `INJECT: ${activeKeys}`,
            suspicious: false
        };

        setEvents(prev => [newEvent, ...prev].slice(0, 50));
    }
  }, [state.totalInputs, state.virtualKeys, state.id]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* HUD Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass p-8 rounded-[2.5rem] border-white/5 flex items-center justify-between relative overflow-hidden">
           <div className="space-y-1 z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Input Stream Velocity</span>
              <p className="text-4xl font-black text-blue-500 tracking-tighter">{state.totalInputs}</p>
           </div>
           <Activity className="w-12 h-12 text-blue-500/40 animate-pulse z-10" />
        </div>

        <div className="glass p-8 rounded-[2.5rem] border-white/5 flex items-center justify-between">
           <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Injectors</span>
              <p className="text-4xl font-black text-white tracking-tighter">{state.virtualKeys.size} <span className="text-sm text-slate-500">Keys</span></p>
           </div>
           <Cpu className="w-12 h-12 text-slate-700" />
        </div>

        <div className="glass p-8 rounded-[2.5rem] border-white/5 flex items-center justify-between relative overflow-hidden">
           <div className="space-y-1 z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kernel Link</span>
              <p className="text-2xl font-black uppercase tracking-widest text-green-500">
                {state.connected ? 'SECURE_LINK' : 'DISCONNECTED'}
              </p>
           </div>
           <ShieldCheck className={`w-12 h-12 ${state.connected ? 'text-green-500' : 'text-slate-700'}`} />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[100px] pointer-events-none" />
        
        <header className="p-10 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
           <div className="flex items-center gap-4">
              <Globe className="w-6 h-6 text-blue-500" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Live Traffic Matrix</h3>
           </div>
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Heuristics:</span>
              <span className="px-3 py-1 bg-blue-500/10 rounded-lg text-[9px] font-black text-blue-400 border border-blue-500/20 uppercase">M1M_VERIFIED</span>
           </div>
        </header>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-white/5">
                {['Timestamp', 'Device', 'Source IP', 'Destination', 'Dest IP', 'Protocol', 'Size', 'Payload'].map(h => (
                  <th key={h} className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={i} className="border-b border-white/5 transition-all hover:bg-white/5">
                  <td className="p-6 font-mono text-[11px] text-slate-400">{e.timestamp}</td>
                  <td className="p-6 font-black text-[11px] text-white uppercase tracking-tighter">{e.device}</td>
                  <td className="p-6 font-mono text-[11px] text-slate-500">{e.sourceIp}</td>
                  <td className="p-6 font-black text-[11px] uppercase tracking-tighter text-slate-300">
                    {e.destination}
                  </td>
                  <td className="p-6 font-mono text-[11px] text-slate-500">{e.destIp}</td>
                  <td className="p-6">
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-black text-slate-400 uppercase">{e.protocol}</span>
                  </td>
                  <td className="p-6 font-mono text-[11px] text-slate-500">{e.size}</td>
                  <td className="p-6 font-mono text-[11px] text-blue-400 font-bold">
                    {e.info}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {events.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
             <Loader2 className="w-10 h-10 text-slate-800 animate-spin" />
             <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Awaiting Input Signal...</p>
          </div>
        )}
      </div>

      {/* Kernel Log simulation footer */}
      <div className="bg-black/80 rounded-[2.5rem] border border-white/5 p-6 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Terminal className="w-4 h-4 text-slate-600" />
            <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
              [DEBUG] Interceptor Kernel Build: <span className="text-blue-500">v3.2.0-SEC-STABLE</span> | Link Integrity: <span className="text-green-500">OPTIMAL</span>
            </p>
         </div>
         <button onClick={() => setEvents([])} className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-white transition-colors">
            Clear Logs
         </button>
      </div>
    </div>
  );
};

export default SecurityInterceptor;
