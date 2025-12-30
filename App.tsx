
import React, { useState, useEffect, useMemo } from 'react';
import { GamepadProvider, useGamepad } from './components/GamepadProvider';
import DualSenseSVG from './components/DualSenseSVG';
import MappingList from './components/MappingList';
import VirtualOutput from './components/VirtualOutput';
import AnalyticsView from './components/AnalyticsView';
import TestingView from './components/TestingView';
import HelpView from './components/HelpView';
import NeuralConsultant from './components/NeuralConsultant';
import SecurityInterceptor from './components/SecurityInterceptor';
import { CombatOverlay } from './components/CombatOverlay'; 
import { DEFAULT_PROFILES } from './constants';
import { Profile, Mapping, ControllerButton, AccessibilitySettings, AxisMapping, ControllerAxis } from './types';
import { 
  Binary, Gamepad2, Layers, Activity, Zap, Lock, 
  BrainCircuit, Terminal, HelpCircle,
  X, Minus, Cpu, Monitor, ShieldCheck, Gauge, Sliders, Target, Crosshair, ChevronDown, ChevronRight, MousePointer2, Settings2, Layout, Share2, Volume2, Vibrate, SlidersHorizontal, Power
} from 'lucide-react';

const COMMON_KEYS = [
  { label: 'W', code: 'KeyW' }, { label: 'A', code: 'KeyA' }, { label: 'S', code: 'KeyS' }, { label: 'D', code: 'KeyD' },
  { label: 'Space', code: 'Space' }, { label: 'Shift', code: 'ShiftLeft' }, { label: 'Ctrl', code: 'ControlLeft' }, { label: 'Alt', code: 'AltLeft' },
  { label: 'E', code: 'KeyE' }, { label: 'F', code: 'KeyF' }, { label: 'R', code: 'KeyR' }, { label: 'Q', code: 'KeyQ' },
  { label: 'Enter', code: 'Enter' }, { label: 'Esc', code: 'Escape' }, { label: 'Tab', code: 'Tab' }, { label: '1', code: 'Digit1' },
];

const ExpandableSection: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  status?: string;
  statusColor?: string;
}> = ({ title, icon: Icon, children, isOpen, onToggle, status, statusColor }) => (
  <div className={`glass rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${isOpen ? 'border-blue-500/30 bg-slate-900/60 ring-1 ring-blue-500/10' : 'border-white/5 bg-slate-900/40 hover:border-white/10'}`}>
    <button onClick={onToggle} className="w-full p-8 flex items-center justify-between text-left group">
      <div className="flex items-center gap-5">
        <div className={`p-3.5 rounded-2xl transition-all duration-300 ${isOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-500'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{title}</h4>
          {status && <span className={`text-[8px] font-black uppercase tracking-widest ${statusColor || 'text-slate-500'}`}>{status}</span>}
        </div>
      </div>
      <div className={`p-2 rounded-full transition-transform duration-500 ${isOpen ? 'rotate-180 bg-blue-600/10 text-blue-400' : 'text-slate-600'}`}>
        <ChevronDown className="w-4 h-4" />
      </div>
    </button>
    <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100 border-t border-white/5' : 'max-h-0 opacity-0'}`}>
      <div className="p-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">{children}</div>
    </div>
  </div>
);

const AppShell: React.FC<{ 
  profiles: Profile[], 
  activeProfile: Profile,
  setActiveProfileId: (id: string) => void,
  updateActiveProfile: (updates: Partial<Profile>) => void,
  updateMapping: (btn: ControllerButton, updates: Partial<Mapping>) => void,
  updateAxisMapping: (axis: string, updates: Partial<AxisMapping>) => void,
  detectedProcess: string | null
}> = ({ profiles, activeProfile, setActiveProfileId, updateActiveProfile, updateMapping, updateAxisMapping, detectedProcess }) => {
  const { state, isKernelActive, setKernelActive } = useGamepad();
  const [activeTab, setActiveTab] = useState<'eng' | 'stk' | 'tel' | 'tst' | 'ker' | 'hlp' | 'ai' | 'sec'>('eng');
  const [selectedButton, setSelectedButton] = useState<ControllerButton | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('aim');
  const [systemLogs, setSystemLogs] = useState<string[]>(["[KERNEL] 1M1M_OS OMEGA V3.5.0 LOADED", "[HID] AUTHORED BY HERNAN H"]);

  const updateAccessibility = (updates: Partial<AccessibilitySettings>) => {
    updateActiveProfile({ accessibility: { ...activeProfile.accessibility, ...updates } });
    setSystemLogs(prev => [`[NEURAL] Settings Updated: ${Object.keys(updates).join(', ')}`, ...prev].slice(0, 5));
  };

  const currentMapping = activeProfile.mappings.find(m => m.button === selectedButton);

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-slate-200 overflow-hidden font-sans select-none selection:bg-blue-500/30">
      <div className="h-11 bg-black border-b border-white/5 flex items-center justify-between px-8 drag-region">
        <div className="flex items-center gap-4">
          <Binary className="text-blue-500 w-5 h-5 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">1Man1Machine // Hernan H Edition</span>
        </div>
        <div className="flex items-center gap-6 no-drag">
          <div className="flex items-center gap-2.5 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-inner">
            <div className={`w-2 h-2 rounded-full ${state.connected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'} animate-pulse`} />
            <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">{state.connected ? 'HID_SYNC_OK' : (activeProfile.accessibility.yoloEnabled ? 'NEURAL_SIM_OK' : 'WAIT_LINK')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors"><Minus className="w-4 h-4 text-slate-600" /></button>
            <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors"><X className="w-4 h-4 text-slate-600" /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-slate-950 border-r border-white/5 flex flex-col p-10 gap-10">
           <div className="flex items-center gap-5 mb-4 group cursor-pointer" onClick={() => setActiveTab('eng')}>
              <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-[0_15px_30px_rgba(37,99,235,0.4)] group-hover:scale-105 transition-transform duration-300">
                <Cpu className="text-white w-7 h-7" />
              </div>
              <div>
                <h1 className="font-black text-2xl tracking-tighter uppercase leading-tight text-white group-hover:text-blue-400 transition-colors">1M1M_HH</h1>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Hernan H Build</p>
              </div>
           </div>

           <nav className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
             {[
               { id: 'eng', label: 'Console', icon: Gamepad2 },
               { id: 'stk', label: 'Stacks', icon: Layers },
               { id: 'tel', label: 'Analytics', icon: Activity },
               { id: 'tst', label: 'Testing Hub', icon: Target },
               { id: 'ai', label: 'Neural AI', icon: BrainCircuit },
               { id: 'sec', label: 'Security', icon: ShieldCheck },
               { id: 'hlp', label: 'Guide', icon: HelpCircle },
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

           <div className="pt-10 border-t border-white/5">
              <button 
                onClick={() => setKernelActive(!isKernelActive)}
                className={`w-full p-6 rounded-[2rem] border flex items-center justify-between transition-all ${isKernelActive ? 'bg-red-600/10 border-red-500/30 text-red-500' : 'bg-green-600 text-white shadow-xl shadow-green-600/30'}`}
              >
                 <div className="flex items-center gap-4">
                    <Power className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{isKernelActive ? 'Kernel Lockdown' : 'Engage Kernel'}</span>
                 </div>
                 <div className={`w-2 h-2 rounded-full ${isKernelActive ? 'bg-red-500 animate-pulse' : 'bg-white'}`} />
              </button>
           </div>
        </aside>

        <main className="flex-1 p-14 overflow-y-auto custom-scrollbar relative">
           {activeTab === 'eng' && (
             <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="xl:col-span-7 space-y-16">
                 <div className="glass p-12 rounded-[4rem] border-white/5 shadow-2xl relative overflow-hidden">
                    <CombatOverlay profile={activeProfile} />
                 </div>
                 <div className="bg-slate-950 p-6 rounded-3xl border border-white/5 font-mono text-[9px] text-blue-500/60 uppercase tracking-widest space-y-1 h-32 overflow-hidden flex flex-col justify-end shadow-inner">
                    {systemLogs.map((log, i) => <p key={i} className={i === 0 ? 'text-blue-400' : ''}>{log}</p>)}
                 </div>
                 <DualSenseSVG selectedButton={selectedButton} onSelectButton={setSelectedButton} />
                 <VirtualOutput profile={activeProfile} />
               </div>
               
               <div className="xl:col-span-5 space-y-6">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 px-8 mb-2">
                       <Settings2 className="w-4 h-4 text-blue-500" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Optimization_Suite</span>
                    </div>

                    <ExpandableSection 
                      title="Aim Assistance" 
                      icon={Crosshair}
                      isOpen={expandedSection === 'aim'}
                      onToggle={() => setExpandedSection(expandedSection === 'aim' ? null : 'aim')}
                      status={activeProfile.accessibility.yoloEnabled ? 'Neural_Active' : 'HID_Only'}
                      statusColor={activeProfile.accessibility.yoloEnabled ? 'text-purple-400' : 'text-slate-500'}
                    >
                      <div className="space-y-6">
                        <div className="flex items-center justify-between bg-slate-950/40 p-5 rounded-3xl border border-white/5">
                           <div className="flex items-center gap-4">
                             <div className={`p-2 rounded-xl ${activeProfile.accessibility.yoloEnabled ? 'bg-purple-600/20 text-purple-400' : 'bg-slate-800 text-slate-600'}`}>
                               <BrainCircuit className="w-5 h-5" />
                             </div>
                             <span className="text-[10px] font-black text-white uppercase tracking-widest">AI Neural Tracking</span>
                           </div>
                           <button onClick={() => updateAccessibility({ yoloEnabled: !activeProfile.accessibility.yoloEnabled })} className={`w-12 h-6 rounded-full transition-all relative ${activeProfile.accessibility.yoloEnabled ? 'bg-purple-600' : 'bg-slate-800'}`}>
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${activeProfile.accessibility.yoloEnabled ? 'left-7' : 'left-1'}`} />
                           </button>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Stabilization Strength</span>
                            <span className="text-[10px] font-mono text-blue-400 font-black">{activeProfile.accessibility.aimStabilizationStrength}%</span>
                          </div>
                          <input type="range" min="0" max="100" value={activeProfile.accessibility.aimStabilizationStrength} onChange={(e) => updateAccessibility({ aimStabilizationStrength: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Pull Weight</span>
                            <span className="text-[10px] font-mono text-purple-400 font-black">{activeProfile.accessibility.yoloTrackingPower}%</span>
                          </div>
                          <input type="range" min="0" max="100" value={activeProfile.accessibility.yoloTrackingPower} onChange={(e) => updateAccessibility({ yoloTrackingPower: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => updateAccessibility({ snapToTargetEnabled: !activeProfile.accessibility.snapToTargetEnabled })} className={`p-5 rounded-3xl border flex flex-col items-center gap-3 transition-all ${activeProfile.accessibility.snapToTargetEnabled ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-950 border-white/5 text-slate-600'}`}>
                            <Target className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-widest">Snap-to-Target</span>
                          </button>
                          <button onClick={() => updateAccessibility({ aimSlowdownEnabled: !activeProfile.accessibility.aimSlowdownEnabled })} className={`p-5 rounded-3xl border flex flex-col items-center gap-3 transition-all ${activeProfile.accessibility.aimSlowdownEnabled ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-950 border-white/5 text-slate-600'}`}>
                            <Gauge className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-widest">Slowdown Zone</span>
                          </button>
                        </div>
                      </div>
                    </ExpandableSection>
                 </div>

                 <div className="glass p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-10">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3"><Sliders className="w-4 h-4" /> Stick Mapping Matrix</h3>
                    <div className="grid grid-cols-2 gap-8">
                       {['LEFT_STICK_X', 'RIGHT_STICK_X'].map(axisKey => {
                          const mapping = activeProfile.axisMappings.find(a => a.axis === axisKey as ControllerAxis);
                          const isLeft = axisKey === 'LEFT_STICK_X';
                          return (
                             <div key={axisKey} className="space-y-6">
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLeft ? 'bg-blue-600/20 text-blue-400' : 'bg-purple-600/20 text-purple-400'}`}>
                                      {isLeft ? <Layout className="w-5 h-5" /> : <MousePointer2 className="w-5 h-5" />}
                                   </div>
                                   <span className="text-[11px] font-black text-white uppercase tracking-widest">{isLeft ? 'Left Stick' : 'Right Stick'}</span>
                                </div>
                                <select value={mapping?.mappedTo || 'NONE'} onChange={(e) => updateAxisMapping(axisKey, { mappedTo: e.target.value as any })} className="w-full bg-slate-950 border border-white/10 p-4 rounded-2xl font-black text-[10px] text-white uppercase focus:border-blue-500 transition-all">
                                   <option value="NONE">Disabled</option>
                                   <option value="WASD">WASD Keyboard</option>
                                   <option value="MOUSE_MOVEMENT">Mouse Emulation</option>
                                   <option value="SCROLL">Scroll Wheel</option>
                                </select>
                             </div>
                          )
                       })}
                    </div>
                 </div>

                 <div className="glass p-12 rounded-[4rem] shadow-2xl space-y-10 border-white/10 relative overflow-hidden">
                    {selectedButton ? (
                       <div className="space-y-10 animate-in zoom-in-98 duration-300">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Hardware Link</span>
                               <h3 className="text-5xl font-black text-white uppercase tracking-tighter">{selectedButton}</h3>
                            </div>
                            <button onClick={() => setSelectedButton(null)} className="p-4 bg-slate-800/80 rounded-2xl hover:bg-slate-700 transition-all border border-white/5">
                              <X className="w-5 h-5 text-slate-400" />
                            </button>
                          </div>
                          <div className="space-y-6">
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Assign Keyboard Stroke</span>
                             <div className="grid grid-cols-4 gap-3">
                                {COMMON_KEYS.map(key => (
                                   <button key={key.code} onClick={() => updateMapping(selectedButton, { type: 'KEYBOARD', mappedTo: key.label, keyCode: key.code })} className={`p-3 rounded-xl border text-[10px] font-black transition-all ${currentMapping?.keyCode === key.code ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/30' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white'}`}>{key.label}</button>
                                ))}
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center text-center p-20 space-y-6">
                          <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center border border-white/5 text-slate-700"><Gamepad2 className="w-10 h-10" /></div>
                          <h4 className="text-xl font-black text-white uppercase tracking-tighter">Awaiting HW Pulse</h4>
                       </div>
                    )}
                 </div>
                 <div className="glass p-10 rounded-[3.5rem] shadow-2xl border-white/5">
                    <MappingList profile={activeProfile} onSelectButton={setSelectedButton} onUpdateMapping={updateMapping} />
                 </div>
               </div>
             </div>
           )}

           {activeTab === 'ai' && <NeuralConsultant />}
           {activeTab === 'tel' && <AnalyticsView />}
           {activeTab === 'tst' && <TestingView profile={activeProfile} />}
           {activeTab === 'sec' && <SecurityInterceptor />}
           {activeTab === 'hlp' && <HelpView />}
           {activeTab === 'stk' && (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {profiles.map(p => (
                   <button key={p.id} onClick={() => setActiveProfileId(p.id)} className={`p-10 rounded-[3rem] border text-left transition-all ${activeProfile.id === p.id ? 'bg-blue-600/10 border-blue-400 shadow-xl' : 'bg-slate-900/40 border-white/5 hover:border-white/20'}`}>
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{p.name}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{p.category}</p>
                   </button>
                ))}
             </div>
           )}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('1man1machine_profiles_v3');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
  });
  const [activeId, setActiveId] = useState(() => localStorage.getItem('1man1machine_active_id') || profiles[0].id);
  const activeProfile = useMemo(() => profiles.find(p => p.id === activeId) || profiles[0], [profiles, activeId]);

  const updateActiveProfile = (updates: Partial<Profile>) => setProfiles(prev => prev.map(p => p.id === activeId ? { ...p, ...updates } : p));
  const updateMapping = (btn: ControllerButton, updates: Partial<Mapping>) => setProfiles(prev => prev.map(p => {
    if (p.id !== activeId) return p;
    const existing = p.mappings.find(m => m.button === btn);
    const nextMappings = existing ? p.mappings.map(m => m.button === btn ? { ...m, ...updates } : m) : [...p.mappings, { button: btn, mappedTo: 'Unlinked', type: 'KEYBOARD', keyCode: '', ...updates } as Mapping];
    return { ...p, mappings: nextMappings };
  }));
  const updateAxisMapping = (axis: string, updates: Partial<AxisMapping>) => setProfiles(prev => prev.map(p => {
    if (p.id !== activeId) return p;
    const nextAxisMappings = p.axisMappings.map(a => a.axis === axis ? { ...a, ...updates } : a);
    if (!p.axisMappings.some(a => a.axis === axis)) nextAxisMappings.push({ axis, mappedTo: 'NONE', sensitivity: 50, deadzone: 0.1, deadzoneType: 'CIRCULAR', curve: 'LINEAR', ...updates } as AxisMapping);
    return { ...p, axisMappings: nextAxisMappings };
  }));

  useEffect(() => {
    localStorage.setItem('1man1machine_profiles_v3', JSON.stringify(profiles));
    localStorage.setItem('1man1machine_active_id', activeId);
  }, [profiles, activeId]);

  return (
    <GamepadProvider activeProfile={activeProfile}>
      <AppShell profiles={profiles} activeProfile={activeProfile} setActiveProfileId={setActiveId} updateActiveProfile={updateActiveProfile} updateMapping={updateMapping} updateAxisMapping={updateAxisMapping} detectedProcess={null} />
    </GamepadProvider>
  );
};

export default App;
