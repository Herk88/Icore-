
import React, { useState, useEffect, useRef } from 'react';
/* Added Loader2 to imports from lucide-react */
import { ShieldAlert, ShieldCheck, Radar, Cpu, Globe, Server, AlertTriangle, Terminal, Loader2 } from 'lucide-react';
import { SecurityEvent } from '../types';

const SecurityInterceptor: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [threatLevel, setThreatLevel] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const isSuspicious = Math.random() > 0.92;
      const protocols = ['TCP', 'UDP', 'HID/M1M', 'SSL', 'HTTPS', 'ICMP'];
      const devices = ['DualSense_v3', 'M1M_Kernel', 'Virtual_HID', 'Neural_Node'];
      
      const newEvent: SecurityEvent = {
        timestamp: new Date().toLocaleTimeString(),
        device: devices[Math.floor(Math.random() * devices.length)],
        sourceIp: `192.168.1.${Math.floor(Math.random() * 254)}`,
        destination: isSuspicious ? 'UNAUTHORIZED_AC_SERVER' : 'SONY_HID_AUTH',
        destIp: isSuspicious ? '45.12.98.221' : '23.45.12.90',
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        size: `${Math.floor(Math.random() * 2048)} B`,
        info: isSuspicious ? 'Suspicious packet - anti-cheat hook detected' : 'Standard HID synchronization',
        suspicious: isSuspicious
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 50));
      if (isSuspicious) {
        setThreatLevel(prev => Math.min(100, prev + 15));
      } else {
        setThreatLevel(prev => Math.max(0, prev - 1));
      }
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* HUD Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass p-8 rounded-[2.5rem] border-white/5 flex items-center justify-between relative overflow-hidden">
           <div className="space-y-1 z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Threat Index</span>
              <p className={`text-4xl font-black ${threatLevel > 70 ? 'text-red-500' : threatLevel > 30 ? 'text-amber-500' : 'text-blue-500'} tracking-tighter`}>{threatLevel}%</p>
           </div>
           <Radar className={`w-12 h-12 ${threatLevel > 50 ? 'text-red-500 animate-spin' : 'text-blue-500/40 animate-spin-slow'} z-10`} />
           <div className={`absolute bottom-0 left-0 h-1 bg-current transition-all duration-500 ${threatLevel > 70 ? 'text-red-500 shadow-[0_0_20px_#ef4444]' : 'text-blue-500 shadow-[0_0_20px_#3b82f6]'}`} style={{width: `${threatLevel}%`}} />
        </div>

        <div className="glass p-8 rounded-[2.5rem] border-white/5 flex items-center justify-between">
           <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Interceptors</span>
              <p className="text-4xl font-black text-white tracking-tighter">12 <span className="text-sm text-slate-500">Nodes</span></p>
           </div>
           <Cpu className="w-12 h-12 text-slate-700" />
        </div>

        <div className="glass p-8 rounded-[2.5rem] border-white/5 flex items-center justify-between relative overflow-hidden">
           <div className="space-y-1 z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Status</span>
              <p className={`text-2xl font-black uppercase tracking-widest ${threatLevel > 50 ? 'text-red-500' : 'text-green-500'}`}>
                {threatLevel > 50 ? 'BREACH_WARNING' : 'SECURE_LINK'}
              </p>
           </div>
           {threatLevel > 50 ? <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse" /> : <ShieldCheck className="w-12 h-12 text-green-500" />}
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
                {['Timestamp', 'Device', 'Source IP', 'Destination', 'Dest IP', 'Protocol', 'Size', 'Status'].map(h => (
                  <th key={h} className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={i} className={`border-b border-white/5 transition-all hover:bg-white/5 ${e.suspicious ? 'bg-red-500/5' : ''}`}>
                  <td className="p-6 font-mono text-[11px] text-slate-400">{e.timestamp}</td>
                  <td className="p-6 font-black text-[11px] text-white uppercase tracking-tighter">{e.device}</td>
                  <td className="p-6 font-mono text-[11px] text-slate-500">{e.sourceIp}</td>
                  <td className={`p-6 font-black text-[11px] uppercase tracking-tighter ${e.suspicious ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                    {e.destination}
                  </td>
                  <td className="p-6 font-mono text-[11px] text-slate-500">{e.destIp}</td>
                  <td className="p-6">
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-black text-slate-400 uppercase">{e.protocol}</span>
                  </td>
                  <td className="p-6 font-mono text-[11px] text-slate-500">{e.size}</td>
                  <td className="p-6">
                    {e.suspicious ? (
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">SUSPICIOUS</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-500/50">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">VERIFIED</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {events.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
             <Loader2 className="w-10 h-10 text-slate-800 animate-spin" />
             <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Synchronizing Encryption Matrix...</p>
          </div>
        )}
      </div>

      {/* Kernel Log simulation footer */}
      <div className="bg-black/80 rounded-[2.5rem] border border-white/5 p-6 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Terminal className="w-4 h-4 text-slate-600" />
            <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
              [DEBUG] Interceptor Kernel Build: <span className="text-blue-500">v3.2.0-SEC-ALPHA</span> | Link Integrity: <span className="text-green-500">OPTIMAL</span>
            </p>
         </div>
         <button className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-white transition-colors">
            Clear Logs
         </button>
      </div>
    </div>
  );
};

export default SecurityInterceptor;