
import React, { useState, useEffect, useMemo } from 'react';
import { GamepadProvider, useGamepad } from './components/GamepadProvider';
import DualSenseSVG from './components/DualSenseSVG';
import MappingList from './components/MappingList';
import VirtualOutput from './components/VirtualOutput';
import AnalyticsView from './components/AnalyticsView';
import TestingView from './components/TestingView';
import HelpView from './components/HelpView';
import { CombatOverlay } from './components/CombatOverlay'; 
import { DEFAULT_PROFILES } from './constants';
import { Profile, Mapping, ControllerButton, AccessibilitySettings } from './types';
import { 
  Binary, Gamepad2, Layers, Activity, Zap, Lock, 
  BrainCircuit, FlaskConical, Terminal, HelpCircle,
  X, Minus, Cpu, Monitor, ShieldCheck, Info, Gauge, Sliders, Target, Crosshair, ChevronDown, MousePointer2
} from 'lucide-react';

const KernelMonitor: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        "HID_INTERCEPT: 1Man1Machine IRQ Vector Hooked [0x7FF]",
        "NEURAL_HOOK: killBill2 acquisition confidence 98.4%",
        "SYSCALL: M1M_EVENT_VIRTUAL relative jump applied",
        "HW_POLL: 1000Hz stable link @ 0.4ms jitter",
        "SYNC: Deployment 'Pro Stack' by killBill2 active on pid: 4812",
        "MEMORY: 1Man1Machine neural cache optimized",
        "IO: USB HID descriptor validated [M1M_v3.2]"
      ];
      setLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ${messages[Math.floor(Math.random() * messages.length)]}`,
        ...prev
      ].slice(0, 50));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-950/90 rounded-[3rem] border border-white/5 p-10 h-[550px] overflow-y-auto custom-scrollbar font-mono text-[11px] text-slate-400 shadow-2xl">
      {logs.map((log, i) => (
        <div key={i} className="mb-2 py-1.5 border-l-2 border-blue-500/20 pl-5 hover:bg-white/5 transition-all animate-in slide-in-from-left-2">
          {log}
        </div>
      ))}
      {logs.length === 0 && <div className="h-full flex items-center justify-center animate-pulse text-slate-600 uppercase tracking-widest font-black">Initializing Kernel Stream...</div>}
    </div>
  );
};

const AppShell: React.FC<{ 
  profiles: Profile[], 
  activeProfile: Profile,
  setActiveProfileId: (id: string) => void,
  updateActiveProfile: (updates: Partial<Profile>) => void,
  updateMapping: (btn: ControllerButton, updates: Partial<Mapping>) => void,
  detectedProcess: string | null
}> = ({ profiles, activeProfile, setActiveProfileId, updateActiveProfile, updateMapping, detectedProcess }) => {
  const { state } = useGamepad();
  const [activeTab, setActiveTab] = useState<'eng' | 'stk' | 'tel' | 'tst' | 'ker' | 'hlp'>('eng');
  const [selectedButton, setSelectedButton] = useState<ControllerButton | null>(null);
  const [isEngaged, setIsEngaged] = useState(false);

  const updateAccessibility = (updates: Partial<AccessibilitySettings>) => {
    updateActiveProfile({ accessibility: { ...activeProfile.accessibility, ...updates } });
  };

  const currentMapping = activeProfile.mappings.find(m => m.button === selectedButton);

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-slate-200 overflow-hidden font-sans select-none selection:bg-blue-500/30">
      {/* OS Titlebar Simulation */}
      <div className="h-11 bg-black border-b border-white/5 flex items-center justify-between px-8 drag-region">
        <div className="flex items-center gap-4">
          <Binary className="text-blue-500 w-5 h-5 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">1Man1Machine by killBill2 // Neural Suite v3.2.0</span>
        </div>
        <div className="flex items-center gap-6 no-drag">
          <div className="flex items-center gap-2.5 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-inner">
            <div className={`w-2 h-2 rounded-full ${state.connected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'} animate-pulse`} />
            <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">{state.connected ? 'HW_LINK_ACTIVE' : 'HW_SEARCHING'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors"><Minus className="w-4 h-4 text-slate-600" /></button>
            <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors"><X className="w-4 h-4 text-slate-600" /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-80 bg-slate-950 border-r border-white/5 flex flex-col p-10 gap-10">
           <div className="flex items-center gap-5 mb-4 group cursor-pointer">
              <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-[0_15px_30px_rgba(37,99,235,0.4)] group-hover:scale-105 transition-transform duration-300">
                <Cpu className="text-white w-7 h-7" />
              </div>
              <div>
                <h1 className="font-black text-2xl tracking-tighter uppercase leading-tight text-white group-hover:text-blue-400 transition-colors">1Man1Machine</h1>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">by killBill2</p>
              </div>
           </div>

           <nav className="space-y-1.5 flex-1">
             {[
               { id: 'eng', label: 'Combat Overlay', icon: Gamepad2 },
               { id: 'stk', label: 'Stack Repository', icon: Layers },
               { id: 'tel', label: 'Neural Analytics', icon: Activity },
               { id: 'tst', label: 'Signal Calibration', icon: FlaskConical },
               { id: 'ker', label: 'Kernel Console', icon: Terminal },
               { id: 'hlp', label: 'Deployment Guide', icon: HelpCircle },
             ].map(item => (
               <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-5 p-5 rounded-2xl transition-all border ${activeTab === item.id ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-[0_10px_20px_rgba(0,0,0,0.4)]' : 'border-transparent text-slate-500 hover:bg-white/5'}`}
               >
                 <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'animate-pulse' : ''}`} />
                 <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
               </button>
             ))}
           </nav>

           <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 space-y-5">
              <div className="flex justify-between items-center">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">IRQ_LATENCY</span>
                 <span className="text-[10px] font-black text-green-500 uppercase tracking-widest font-mono">0.42ms</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                 <div className="h-full bg-blue-500 w-[85%] shadow-[0_0_10px_#3b82f6]" />
              </div>
           </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-14 overflow-y-auto custom-scrollbar relative">
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[150px] pointer-events-none" />
           
           <header className="flex justify-between items-start mb-20">
              <div className="space-y-2">
                 <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-tight text-shadow-xl">
                   {activeTab === 'eng' && 'Combat Interface'}
                   {activeTab === 'stk' && 'Stack Repository'}
                   {activeTab === 'tel' && 'Neural Analytics'}
                   {activeTab === 'tst' && 'Signal Calibration'}
                   {activeTab === 'ker' && 'Kernel Console'}
                   {activeTab === 'hlp' && 'Deployment'}
                 </h2>
                 <div className="flex items-center gap-4">
                    <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Active Core: <span className="text-blue-500">{activeProfile.name}</span></p>
                    {detectedProcess && (
                      <div className="px-3 py-1 bg-green-500/10 rounded-lg text-[9px] font-black text-green-500 border border-green-500/20 uppercase tracking-widest shadow-xl">HOOKED: {detectedProcess}</div>
                    )}
                 </div>
              </div>
              <button 
                onClick={() => setIsEngaged(!isEngaged)}
                className={`px-12 py-5 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] transition-all border-2 flex items-center gap-4 shadow-2xl ${isEngaged ? 'bg-red-600 border-red-400 shadow-red-600/50 text-white' : 'bg-blue-600 border-blue-400 shadow-blue-600/40 text-white hover:scale-105 active:scale-95'}`}
              >
                <Zap className={`w-5 h-5 ${isEngaged ? 'animate-flicker' : ''}`} />
                {isEngaged ? 'Link Engaged' : 'Initialize Link'}
              </button>
           </header>

           {activeTab === 'eng' && (
             <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="xl:col-span-7 space-y-16">
                 <CombatOverlay profile={activeProfile} />
                 <DualSenseSVG selectedButton={selectedButton} onSelectButton={setSelectedButton} />
                 <VirtualOutput profile={activeProfile} />
               </div>
               
               <div className="xl:col-span-5 space-y-10">
                 {/* Configuration Panel */}
                 <div className="glass p-12 rounded-[4rem] shadow-2xl space-y-10 border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/5 blur-[80px] -z-10" />
                    
                    {selectedButton ? (
                       <div className="space-y-10 animate-in zoom-in-98 duration-300">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Hardware Port</span>
                               <h3 className="text-5xl font-black text-white uppercase tracking-tighter drop-shadow-lg">{selectedButton}</h3>
                            </div>
                            <button onClick={() => setSelectedButton(null)} className="p-4 bg-slate-800/80 rounded-2xl hover:bg-slate-700 transition-all border border-white/5">
                              <X className="w-5 h-5 text-slate-400" />
                            </button>
                          </div>
                          <div className="p-8 bg-slate-950/60 rounded-3xl border border-white/5 space-y-8 shadow-inner">
                             <div className="space-y-5">
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                                  <Sliders className="w-4 h-4 text-blue-500" /> Signal Routing
                                </p>
                                <div className="grid grid-cols-2 gap-5">
                                  <div className="space-y-2">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Virtual Target</span>
                                    <select 
                                      value={currentMapping?.mappedTo || 'None'}
                                      onChange={(e) => updateMapping(selectedButton, { mappedTo: e.target.value })}
                                      className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl font-black text-[11px] text-white uppercase focus:border-blue-500 outline-none transition-colors"
                                    >
                                      <option value="None">Unlinked</option>
                                      <option value="Jump">Jump (SPACE)</option>
                                      <option value="Fire">Fire (M1)</option>
                                      <option value="ADS">ADS (M2)</option>
                                      <option value="Reload">Reload (R)</option>
                                      <option value="Slide">Slide (C)</option>
                                      <option value="Tactical">Tactical (G)</option>
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Signal Type</span>
                                    <select 
                                      value={currentMapping?.type || 'KEYBOARD'}
                                      onChange={(e) => updateMapping(selectedButton, { type: e.target.value as any })}
                                      className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl font-black text-[11px] text-white uppercase focus:border-blue-500 outline-none transition-colors"
                                    >
                                      <option value="KEYBOARD">Keyboard</option>
                                      <option value="MOUSE">Mouse</option>
                                      <option value="MACRO">Macro Hook</option>
                                    </select>
                                  </div>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-5 pt-6 border-t border-white/5">
                                <button 
                                  onClick={() => updateMapping(selectedButton, { isSticky: !currentMapping?.isSticky })}
                                  className={`flex items-center justify-center gap-4 p-5 rounded-2xl border transition-all ${currentMapping?.isSticky ? 'bg-amber-600/20 border-amber-500/50 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)]' : 'bg-slate-900 border-white/5 text-slate-600 hover:text-slate-400'}`}
                                >
                                  <Lock className="w-5 h-5" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Sticky</span>
                                </button>
                                <button 
                                  onClick={() => updateMapping(selectedButton, { isTurbo: !currentMapping?.isTurbo })}
                                  className={`flex items-center justify-center gap-4 p-5 rounded-2xl border transition-all ${currentMapping?.isTurbo ? 'bg-yellow-600/20 border-yellow-500/50 text-yellow-500 shadow-[0_0_20_rgba(234,179,8,0.25)]' : 'bg-slate-900 border-white/5 text-slate-600 hover:text-slate-400'}`}
                                >
                                  <Zap className="w-5 h-5" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Turbo</span>
                                </button>
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="space-y-12 animate-in fade-in duration-500">
                          <div className="space-y-8">
                            <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] px-1">Neural Core Config</h4>
                            <div className="p-10 bg-purple-600/10 border border-purple-500/30 rounded-[3rem] space-y-10 shadow-2xl">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                   <div className="p-4 bg-purple-500/20 rounded-2xl border border-purple-500/40">
                                      <BrainCircuit className="w-8 h-8 text-purple-400" />
                                   </div>
                                   <div>
                                      <p className="text-[15px] font-black text-white uppercase tracking-tight">Neural Magnet Lock</p>
                                      <p className="text-[10px] text-purple-400/60 uppercase tracking-widest font-black">AI Target Centering Matrix</p>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => updateAccessibility({ yoloEnabled: !activeProfile.accessibility.yoloEnabled })}
                                  className={`w-16 h-8 rounded-full relative transition-all shadow-inner border border-white/10 ${activeProfile.accessibility.yoloEnabled ? 'bg-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'bg-slate-900'}`}
                                >
                                   <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-xl ${activeProfile.accessibility.yoloEnabled ? 'right-1' : 'left-1'}`} />
                                </button>
                              </div>
                              {activeProfile.accessibility.yoloEnabled && (
                                <div className="space-y-8 animate-in slide-in-from-top-4">
                                  <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Magnet Tracking Power</span>
                                      <span className="text-[14px] font-mono font-black text-white">{activeProfile.accessibility.yoloTrackingPower}%</span>
                                    </div>
                                    <input 
                                      type="range" min="0" max="100"
                                      value={activeProfile.accessibility.yoloTrackingPower}
                                      onChange={(e) => updateAccessibility({ yoloTrackingPower: parseInt(e.target.value) })}
                                      className="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500 border border-white/5"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-8 pt-8 border-t border-white/5">
                            <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] px-1">Signal Precision Modules</h4>
                            <div className="p-10 bg-blue-600/5 border border-blue-500/20 rounded-[3rem] space-y-10 shadow-xl">
                               <div className="space-y-8">
                                  <div className="flex items-center gap-5">
                                     <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/40">
                                        <Activity className="w-8 h-8 text-blue-400" />
                                     </div>
                                     <div>
                                        <p className="text-[15px] font-black text-white uppercase tracking-tight">Signal Stabilization</p>
                                        <p className="text-[10px] text-blue-400/60 uppercase tracking-widest font-black">Adaptive Smoothing Logic</p>
                                     </div>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2.5 bg-slate-950/80 p-2.5 rounded-2xl border border-white/5 shadow-inner">
                                    {['Off', 'Light', 'Medium', 'Heavy'].map(mode => (
                                      <button 
                                        key={mode} 
                                        onClick={() => updateAccessibility({ stabilizationMode: mode as any })}
                                        className={`py-3.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeProfile.accessibility.stabilizationMode === mode ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}
                                      >
                                        {mode}
                                      </button>
                                    ))}
                                    <button 
                                        onClick={() => updateAccessibility({ stabilizationMode: 'Custom' })}
                                        className={`py-3.5 rounded-xl text-[10px] font-black uppercase transition-all col-span-4 mt-2 border ${activeProfile.accessibility.stabilizationMode === 'Custom' ? 'bg-blue-600 border-blue-400 text-white shadow-2xl shadow-blue-600/30' : 'bg-slate-900 border-white/5 text-slate-600 hover:text-slate-300'}`}
                                      >
                                        Manual Calibrated Matrix
                                      </button>
                                  </div>
                               </div>

                               <div className="grid grid-cols-1 gap-5">
                                  <button 
                                    onClick={() => updateAccessibility({ snapToTargetEnabled: !activeProfile.accessibility.snapToTargetEnabled })}
                                    className={`flex items-center justify-between p-7 rounded-[2.5rem] border transition-all group ${activeProfile.accessibility.snapToTargetEnabled ? 'bg-blue-600/20 border-blue-400 text-blue-400 shadow-2xl shadow-blue-600/20' : 'bg-slate-950 border-white/5 text-slate-600'}`}
                                  >
                                    <div className="flex items-center gap-5">
                                      <Target className={`w-6 h-6 transition-transform group-hover:scale-110 ${activeProfile.accessibility.snapToTargetEnabled ? 'animate-pulse' : ''}`} />
                                      <div className="text-left">
                                        <span className="text-[12px] font-black uppercase tracking-[0.1em] block leading-none">Magnet Snap-To-Target</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest mt-1.5 opacity-60">High-Friction Acquisition</span>
                                      </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 border-white/10 ${activeProfile.accessibility.snapToTargetEnabled ? 'bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,1)] animate-flicker' : 'bg-slate-800'}`} />
                                  </button>

                                  <button 
                                    onClick={() => updateAccessibility({ aimSlowdownEnabled: !activeProfile.accessibility.aimSlowdownEnabled })}
                                    className={`flex items-center justify-between p-7 rounded-[2.5rem] border transition-all group ${activeProfile.accessibility.aimSlowdownEnabled ? 'bg-blue-600/20 border-blue-400 text-blue-400 shadow-2xl shadow-blue-600/20' : 'bg-slate-950 border-white/5 text-slate-600'}`}
                                  >
                                    <div className="flex items-center gap-5">
                                      <Crosshair className={`w-6 h-6 transition-transform group-hover:scale-110 ${activeProfile.accessibility.aimSlowdownEnabled ? 'animate-spin-slow' : ''}`} />
                                      <div className="text-left">
                                        <span className="text-[12px] font-black uppercase tracking-[0.1em] block leading-none">Precision Slowdown Matrix</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest mt-1.5 opacity-60">Relative Scaling Zone</span>
                                      </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 border-white/10 ${activeProfile.accessibility.aimSlowdownEnabled ? 'bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,1)] animate-flicker' : 'bg-slate-800'}`} />
                                  </button>
                               </div>

                               <div className="pt-8 border-t border-white/10 space-y-8">
                                  <div className="space-y-4">
                                     <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Anti-Recoil Comp Strength</span>
                                        <span className="text-[14px] font-mono font-black text-white">{activeProfile.accessibility.antiRecoilStrength}</span>
                                     </div>
                                     <input 
                                        type="range" min="0" max="100"
                                        value={activeProfile.accessibility.antiRecoilStrength}
                                        onChange={(e) => updateAccessibility({ antiRecoilStrength: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-600 border border-white/5"
                                     />
                                  </div>
                               </div>
                            </div>
                          </div>
                       </div>
                    )}
                 </div>
                 <div className="glass p-10 rounded-[3.5rem] shadow-2xl border-white/5">
                    <MappingList profile={activeProfile} onSelectButton={setSelectedButton} onUpdateMapping={updateMapping} />
                 </div>
               </div>
             </div>
           )}

           {activeTab === 'stk' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-10 duration-700">
                {profiles.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setActiveProfileId(p.id)}
                    className={`text-left p-12 rounded-[3.5rem] border transition-all relative overflow-hidden group shadow-xl ${activeProfile.id === p.id ? 'bg-blue-600/10 border-blue-500/40 shadow-blue-500/10' : 'bg-slate-900/60 border-white/5 hover:border-white/15'}`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-start mb-10">
                       <div className={`p-5 rounded-3xl transition-transform group-hover:scale-110 ${activeProfile.id === p.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/40' : 'bg-slate-800 text-slate-600'}`}>
                          <Layers className="w-8 h-8" />
                       </div>
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">{p.category}</span>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-3 leading-none">{p.name}</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase mb-12 line-clamp-2 leading-relaxed tracking-wide">{p.description}</p>
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Monitor className="w-4 h-4 text-slate-600" />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest truncate max-w-[120px]">{p.targetProcess || 'SYSTEM_GLOBAL'}</span>
                       </div>
                       {activeProfile.id === p.id ? <ShieldCheck className="w-6 h-6 text-blue-500 animate-pulse" /> : <ChevronDown className="w-5 h-5 text-slate-800" />}
                    </div>
                  </button>
                ))}
             </div>
           )}

           {activeTab === 'tel' && <AnalyticsView />}
           {activeTab === 'tst' && <TestingView profile={activeProfile} />}
           {activeTab === 'ker' && <KernelMonitor />}
           {activeTab === 'hlp' && <HelpView />}
        </main>
      </div>

      {/* Persistence Footer */}
      <footer className="h-11 bg-slate-950 border-t border-white/5 flex items-center justify-between px-12 z-50">
         <div className="flex items-center gap-10">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Polling: <span className="text-blue-500">1000Hz (1ms)</span></span>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Project: <span className="text-slate-400">1Man1Machine by killBill2</span></span>
            <div className="w-px h-4 bg-white/10" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">HID_ID: <span className="text-slate-400">M1M_001X_FE</span></span>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <Info className="w-4 h-4 text-slate-600" />
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Hardware Trust: <span className="text-green-500 font-bold">VERIFIED</span></span>
            </div>
         </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('1man1machine_profiles_v3');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
  });
  const [activeId, setActiveId] = useState(() => {
    return localStorage.getItem('1man1machine_active_id') || profiles[0].id;
  });
  const [detectedProcess, setDetectedProcess] = useState<string | null>(null);

  const activeProfile = useMemo(() => profiles.find(p => p.id === activeId) || profiles[0], [profiles, activeId]);

  useEffect(() => {
    localStorage.setItem('1man1machine_profiles_v3', JSON.stringify(profiles));
    localStorage.setItem('1man1machine_active_id', activeId);
  }, [profiles, activeId]);

  // Simulation of game process detection for Production UI
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.9) {
        const games = ['ModernWarfare.exe', 'EldenRing.exe', 'FortniteClient.exe', 'RainbowSix.exe', null];
        setDetectedProcess(games[Math.floor(Math.random() * games.length)]);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const updateActiveProfile = (updates: Partial<Profile>) => {
    setProfiles(prev => prev.map(p => p.id === activeId ? { ...p, ...updates } : p));
  };

  const updateMapping = (btn: ControllerButton, updates: Partial<Mapping>) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeId) return p;
      const existing = p.mappings.find(m => m.button === btn);
      let nextMappings;
      if (existing) {
        nextMappings = p.mappings.map(m => m.button === btn ? { ...m, ...updates } : m);
      } else {
        nextMappings = [...p.mappings, { button: btn, mappedTo: 'Unlinked', type: 'KEYBOARD', ...updates } as Mapping];
      }
      return { ...p, mappings: nextMappings };
    }));
  };

  return (
    <GamepadProvider activeProfile={activeProfile}>
      <AppShell 
        profiles={profiles} 
        activeProfile={activeProfile} 
        setActiveProfileId={setActiveId} 
        updateActiveProfile={updateActiveProfile} 
        updateMapping={updateMapping} 
        detectedProcess={detectedProcess}
      />
    </GamepadProvider>
  );
};

export default App;
