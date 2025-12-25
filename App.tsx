
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
  Binary, Gamepad2, Layers, Activity, Settings, Zap, Lock, 
  BrainCircuit, ShieldAlert, FlaskConical, Terminal, HelpCircle,
  X, Minus, Square, ChevronDown, Bell, Eye, EyeOff, Camera
} from 'lucide-react';

const KernelMonitor: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        "HID_INTERCEPT: L2 -> 0.42v (ADS_TRIGGER)",
        "NEURAL_HOOK: HEAD_DETECTED (Conf: 94%)",
        "KERNEL: Applying 12% Stick Deflection (Target Locked)",
        "SYSCALL: Virtual KB Send [SHIFT] -> Success",
        "HW_POLL: 1000Hz Stable",
        "ANTI_RECOIL: Pulse Adjust (-0.02y)"
      ];
      setLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ${messages[Math.floor(Math.random() * messages.length)]}`,
        ...prev
      ].slice(0, 50));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6">
      <div className="bg-slate-950/80 rounded-[2.5rem] border border-white/5 p-8 h-[600px] overflow-y-auto custom-scrollbar font-mono text-[11px]">
        {logs.map((log, i) => (
          <div key={i} className="mb-2 py-1 border-l-2 border-blue-500/30 pl-4 text-slate-400">
            {log}
          </div>
        ))}
        {logs.length === 0 && <div className="h-full flex items-center justify-center text-slate-700 animate-pulse">Initializing Kernel Hook...</div>}
      </div>
    </div>
  );
};

const AppShell: React.FC<{ 
  profiles: Profile[], 
  activeProfile: Profile,
  setActiveProfileId: (id: string) => void,
  updateActiveProfile: (updates: Partial<Profile>) => void,
  updateMapping: (btn: ControllerButton, updates: Partial<Mapping>) => void
}> = ({ profiles, activeProfile, setActiveProfileId, updateActiveProfile, updateMapping }) => {
  const { state, resetStickyStates } = useGamepad();
  const [activeTab, setActiveTab] = useState<'eng' | 'stk' | 'tel' | 'tst' | 'ker' | 'srv' | 'hlp'>('eng');
  const [selectedButton, setSelectedButton] = useState<ControllerButton | null>(null);
  const [deploying, setDeploying] = useState(false);

  const currentMapping = activeProfile.mappings.find(m => m.button === selectedButton);

  const updateAccessibility = (updates: Partial<AccessibilitySettings>) => {
    updateActiveProfile({ accessibility: { ...activeProfile.accessibility, ...updates } });
  };

  const handleDeploy = () => {
    setDeploying(true);
    setTimeout(() => setDeploying(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-slate-200 overflow-hidden font-sans">
      {/* OS-Style Titlebar */}
      <div className="h-12 bg-slate-950 border-b border-white/5 flex items-center justify-between px-6 drag-region">
        <div className="flex items-center gap-3">
          <Binary className="text-blue-500 w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">1Man1Machine // Neural_Kernel_v2.4</span>
        </div>
        <div className="flex items-center gap-8 no-drag">
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${state.connected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'} animate-pulse`} />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{state.connected ? 'HID Link Active' : 'Waiting for USB...'}</span>
          </div>
          <div className="flex items-center">
             <button className="p-2 text-slate-600 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
             <button className="p-2 text-slate-600 hover:text-white transition-colors"><Square className="w-3.5 h-3.5" /></button>
             <button className="p-2 text-slate-600 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-20 lg:w-72 bg-slate-950 border-r border-white/5 flex flex-col py-10 px-6 gap-8 z-20 shadow-2xl">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <Binary className="text-white w-6 h-6" />
              </div>
              <div className="hidden lg:block">
                <h1 className="font-black text-xl uppercase tracking-tighter">1M1M</h1>
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Neural Performance</p>
              </div>
           </div>
           
           <nav className="space-y-2 flex-1">
              {[
                { id: 'eng', icon: Gamepad2, label: 'Engine' },
                { id: 'stk', icon: Layers, label: 'Stacks' },
                { id: 'tel', icon: Activity, label: 'Telemetry' },
                { id: 'tst', icon: FlaskConical, label: 'Testing' },
                { id: 'ker', icon: Terminal, label: 'Kernel' },
                { id: 'srv', icon: Settings, label: 'Service' },
                { id: 'hlp', icon: HelpCircle, label: 'Help' },
              ].map(item => (
                <button 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${activeTab === item.id ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:bg-white/5'}`}
                >
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-500' : 'group-hover:text-slate-200'}`} />
                  <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  {activeTab === item.id && <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-full" />}
                </button>
              ))}
           </nav>

           <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[8px] font-black text-slate-500 uppercase">Sys_Nominal</span>
                 <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 w-full animate-pulse" />
              </div>
           </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-10 lg:p-14 overflow-y-auto custom-scrollbar relative">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] pointer-events-none" />
           
           {/* Header with Deployment Action */}
           <header className="flex justify-between items-start mb-14">
              <div className="space-y-1">
                 <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
                   {activeTab === 'eng' && 'Kernel Engine'}
                   {activeTab === 'stk' && 'Stack Repository'}
                   {activeTab === 'tel' && 'Telemetry Visualizer'}
                   {activeTab === 'tst' && 'Hardware Calibration'}
                   {activeTab === 'ker' && 'Low-Level Monitor'}
                   {activeTab === 'srv' && 'Service Control'}
                   {activeTab === 'hlp' && 'Onboarding'}
                 </h2>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stack: <span className="text-blue-500">{activeProfile.name}</span></p>
              </div>
              <div className="flex gap-4">
                 <button 
                  onClick={handleDeploy}
                  disabled={deploying}
                  className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl ${deploying ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white shadow-blue-600/20 hover:scale-105 active:scale-95'}`}
                 >
                    {deploying ? <Zap className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                    {deploying ? 'Deploying...' : 'Engage Protocol'}
                 </button>
              </div>
           </header>

           {activeTab === 'eng' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
                 <div className="xl:col-span-7 space-y-12 animate-in fade-in slide-in-from-left-6">
                    <CombatOverlay profile={activeProfile} />
                    <DualSenseSVG selectedButton={selectedButton} onSelectButton={setSelectedButton} />
                    <VirtualOutput profile={activeProfile} />
                 </div>
                 
                 <div className="xl:col-span-5 space-y-8 animate-in fade-in slide-in-from-right-6">
                    <div className="glass p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                       {selectedButton ? (
                         <div className="space-y-8 animate-in zoom-in-95">
                           <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hardware Port</span>
                                <h3 className="text-5xl font-black text-white uppercase tracking-tighter">{selectedButton}</h3>
                              </div>
                              <div className="flex gap-3">
                                 <button onClick={() => updateMapping(selectedButton, { isTurbo: !currentMapping?.isTurbo })} className={`p-4 rounded-2xl border transition-all ${currentMapping?.isTurbo ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500 shadow-[0_0_20px_#eab30820]' : 'bg-slate-800 border-white/5'}`}><Zap className="w-5 h-5" /></button>
                                 <button onClick={() => updateMapping(selectedButton, { isSticky: !currentMapping?.isSticky })} className={`p-4 rounded-2xl border transition-all ${currentMapping?.isSticky ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-[0_0_20px_#f59e0b20]' : 'bg-slate-800 border-white/5'}`}><Lock className="w-5 h-5" /></button>
                              </div>
                           </div>

                           <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 space-y-6">
                              <div className="space-y-3">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Virtual Output Binding</span>
                                <div className="flex gap-3">
                                   <div className="flex-1 bg-slate-900 border border-white/5 p-4 rounded-xl text-lg font-black uppercase text-white tracking-widest">{currentMapping?.mappedTo || 'Unbound'}</div>
                                   <button onClick={() => { const val = prompt('Enter Key:'); if(val) updateMapping(selectedButton, { mappedTo: val.toUpperCase() }) }} className="px-6 py-4 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Bind</button>
                                </div>
                              </div>

                              {currentMapping?.isTurbo && (
                                <div className="space-y-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-4">
                                   <div className="flex justify-between text-[10px] font-black uppercase">
                                      <span className="text-yellow-500">Turbo Freq</span>
                                      <span>{currentMapping.turboSpeed || activeProfile.accessibility.globalTurboRate}Hz</span>
                                   </div>
                                   <input type="range" min="5" max="50" value={currentMapping.turboSpeed || activeProfile.accessibility.globalTurboRate} onChange={(e) => updateMapping(selectedButton, { turboSpeed: parseInt(e.target.value) })} className="w-full accent-yellow-500" />
                                   
                                   <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-white/5">
                                      <span className="text-[10px] font-black uppercase">Burst Cycle (3-Shot)</span>
                                      <button onClick={() => updateMapping(selectedButton, { burstMode: !currentMapping.burstMode })} className={`w-10 h-5 rounded-full relative transition-all ${currentMapping.burstMode ? 'bg-yellow-500' : 'bg-slate-800'}`}>
                                        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${currentMapping.burstMode ? 'right-0.5' : 'left-0.5'}`} />
                                      </button>
                                   </div>
                                </div>
                              )}
                           </div>
                         </div>
                       ) : (
                         <div className="space-y-8">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Calibration</h4>
                            <div className="grid grid-cols-1 gap-4">
                               <div className="p-6 bg-purple-600/5 border border-purple-500/20 rounded-[2rem] space-y-5">
                                  <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-3">
                                        <BrainCircuit className="w-5 h-5 text-purple-400" />
                                        <span className="text-[10px] font-black uppercase text-white">AI Vision Magnet</span>
                                     </div>
                                     <button onClick={() => updateAccessibility({ yoloEnabled: !activeProfile.accessibility.yoloEnabled })} className={`w-12 h-6 rounded-full relative transition-all ${activeProfile.accessibility.yoloEnabled ? 'bg-purple-500' : 'bg-slate-800'}`}>
                                       <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${activeProfile.accessibility.yoloEnabled ? 'right-1' : 'left-1'}`} />
                                     </button>
                                  </div>
                                  {activeProfile.accessibility.yoloEnabled && (
                                     <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex justify-between text-[9px] font-black uppercase">
                                           <span className="text-slate-400">Stick Pull Strength</span>
                                           <span className="text-purple-400">{activeProfile.accessibility.yoloTrackingPower}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={activeProfile.accessibility.yoloTrackingPower} onChange={(e) => updateAccessibility({ yoloTrackingPower: parseInt(e.target.value) })} className="w-full accent-purple-500" />
                                     </div>
                                  )}
                               </div>

                               <div className="p-6 bg-red-600/5 border border-red-500/20 rounded-[2rem] space-y-5">
                                  <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-3">
                                        <ShieldAlert className="w-5 h-5 text-red-400" />
                                        <span className="text-[10px] font-black uppercase text-white">Anti-Recoil Compensator</span>
                                     </div>
                                     <button onClick={() => updateAccessibility({ antiRecoilEnabled: !activeProfile.accessibility.antiRecoilEnabled })} className={`w-12 h-6 rounded-full relative transition-all ${activeProfile.accessibility.antiRecoilEnabled ? 'bg-red-500' : 'bg-slate-800'}`}>
                                       <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${activeProfile.accessibility.antiRecoilEnabled ? 'right-1' : 'left-1'}`} />
                                     </button>
                                  </div>
                                  {activeProfile.accessibility.antiRecoilEnabled && (
                                     <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex justify-between text-[9px] font-black uppercase">
                                           <span className="text-slate-400">Vertical Compensation</span>
                                           <span className="text-red-400">{activeProfile.accessibility.antiRecoilStrength}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={activeProfile.accessibility.antiRecoilStrength} onChange={(e) => updateAccessibility({ antiRecoilStrength: parseInt(e.target.value) })} className="w-full accent-red-500" />
                                     </div>
                                  )}
                               </div>
                               
                               <button onClick={() => updateAccessibility({ combatHudEnabled: !activeProfile.accessibility.combatHudEnabled })} className="w-full flex items-center justify-between p-5 bg-slate-900 border border-white/5 rounded-2xl hover:bg-slate-800 transition-colors">
                                  <div className="flex items-center gap-4">
                                     {activeProfile.accessibility.combatHudEnabled ? <Eye className="w-5 h-5 text-blue-400" /> : <EyeOff className="w-5 h-5 text-slate-500" />}
                                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Targeting HUD Overlay</span>
                                  </div>
                                  <div className={`w-2 h-2 rounded-full ${activeProfile.accessibility.combatHudEnabled ? 'bg-blue-500' : 'bg-slate-700'}`} />
                               </button>
                            </div>
                         </div>
                       )}
                    </div>
                    <div className="glass p-8 rounded-[3rem] shadow-xl">
                       <MappingList profile={activeProfile} onSelectButton={setSelectedButton} onUpdateMapping={() => {}} />
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'stk' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-6">
                 {profiles.map(p => (
                   <button 
                    key={p.id} 
                    onClick={() => setActiveProfileId(p.id)}
                    className={`text-left p-10 rounded-[3rem] border transition-all relative group overflow-hidden ${activeProfile.id === p.id ? 'bg-blue-600/10 border-blue-500/50 shadow-2xl' : 'bg-slate-900/60 border-white/5 hover:border-white/10'}`}
                   >
                     <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl ${activeProfile.id === p.id ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                           <Layers className="w-6 h-6" />
                        </div>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{p.category}</span>
                     </div>
                     <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{p.name}</h3>
                     <p className="text-[11px] text-slate-500 font-bold uppercase leading-relaxed">{p.description}</p>
                     {activeProfile.id === p.id && <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/20 blur-[40px]" />}
                   </button>
                 ))}
              </div>
           )}

           {activeTab === 'tel' && <AnalyticsView />}
           {activeTab === 'tst' && <TestingView profile={activeProfile} />}
           {activeTab === 'ker' && <KernelMonitor />}
           {activeTab === 'srv' && (
              <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-10">
                 <div className="glass p-10 rounded-[3rem] border border-white/5 space-y-8">
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Engine Integration</h4>
                    <div className="space-y-6">
                       <div className="flex items-center justify-between p-6 bg-slate-950/50 rounded-2xl border border-white/5">
                          <div>
                             <p className="text-sm font-black text-white uppercase mb-1">Polling Frequency</p>
                             <p className="text-[10px] text-slate-500 font-bold uppercase">HID kernel interrupt rate</p>
                          </div>
                          <select className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs font-black uppercase text-blue-400 outline-none">
                             <option>125Hz</option>
                             <option>500Hz</option>
                             <option selected>1000Hz (Native)</option>
                          </select>
                       </div>
                       
                       <div className="flex items-center justify-between p-6 bg-slate-950/50 rounded-2xl border border-white/5">
                          <div>
                             <p className="text-sm font-black text-white uppercase mb-1">Training Auto-Capture</p>
                             <p className="text-[10px] text-slate-500 font-bold uppercase">Screenshot on L2/R2 engagement</p>
                          </div>
                          <button onClick={() => updateAccessibility({ trainingAutoCapture: !activeProfile.accessibility.trainingAutoCapture })} className={`w-14 h-7 rounded-full relative transition-all ${activeProfile.accessibility.trainingAutoCapture ? 'bg-blue-600' : 'bg-slate-800'}`}>
                             <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${activeProfile.accessibility.trainingAutoCapture ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           )}
           {activeTab === 'hlp' && <HelpView />}
        </main>
      </div>

      {/* Persistence Indicator */}
      <div className="h-10 bg-slate-950 border-t border-white/5 flex items-center justify-between px-10">
         <div className="flex items-center gap-6">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Polling_Rate: 1000Hz</span>
            <div className="w-px h-3 bg-white/10" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Build: v2.4.0-Stable</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest">Profile Saved Automatically</span>
         </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('1m1m_profiles_v24');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
  });
  const [activeId, setActiveId] = useState(() => {
    return localStorage.getItem('1m1m_active_id_v24') || profiles[0].id;
  });

  const activeProfile = useMemo(() => profiles.find(p => p.id === activeId) || profiles[0], [profiles, activeId]);

  useEffect(() => {
    localStorage.setItem('1m1m_profiles_v24', JSON.stringify(profiles));
    localStorage.setItem('1m1m_active_id_v24', activeId);
  }, [profiles, activeId]);

  const updateActiveProfile = (updates: Partial<Profile>) => {
    setProfiles(prev => prev.map(p => p.id === activeId ? { ...p, ...updates } : p));
  };

  const updateMapping = (btn: ControllerButton, updates: Partial<Mapping>) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeId) return p;
      const existing = p.mappings.find(m => m.button === btn);
      const nextMappings = existing 
        ? p.mappings.map(m => m.button === btn ? { ...m, ...updates } : m)
        : [...p.mappings, { button: btn, mappedTo: 'Unlinked', type: 'KEYBOARD', ...updates } as Mapping];
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
      />
    </GamepadProvider>
  );
};

export default App;
