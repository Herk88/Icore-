import React, { useState } from 'react';
import { GamepadProvider, useGamepad } from './components/GamepadProvider';
import DualSenseSVG from './components/DualSenseSVG';
import MappingList from './components/MappingList';
import AnalyticsView from './components/AnalyticsView';
import TestingView from './components/TestingView';
import HelpView from './components/HelpView';
import SecurityInterceptor from './components/SecurityInterceptor';
import { CombatOverlay } from './components/CombatOverlay';
import StickConfigurator from './components/StickConfigurator'; 
import { DEFAULT_PROFILES } from './constants';
import { Profile, Mapping, ControllerButton, AccessibilitySettings, AxisMapping, ControllerAxis } from './types';
import { 
  Binary, Gamepad2, Layers, Activity, Zap, Minus, Square, X,
  BrainCircuit, ShieldCheck, HelpCircle, Power, Cpu, Crosshair, 
  Settings2, Layout, MousePointer2, Magnet, Wind, ChevronDown
} from 'lucide-react';

const Dashboard: React.FC<{ 
  profiles: Profile[], 
  activeProfile: Profile,
  setActiveProfileId: (id: string) => void,
  updateActiveProfile: (updates: Partial<Profile>) => void,
  updateMapping: (btn: ControllerButton, updates: Partial<Mapping>) => void,
  updateAxisMapping: (axis: string, updates: Partial<AxisMapping>) => void,
}> = ({ profiles, activeProfile, setActiveProfileId, updateActiveProfile, updateMapping, updateAxisMapping }) => {
  const { state, isKernelActive, setKernelActive, connectHID } = useGamepad();
  const [activeTab, setActiveTab] = useState<'eng' | 'stk' | 'tel' | 'tst' | 'ker' | 'hlp' | 'sec'>('eng');
  const [selectedButton, setSelectedButton] = useState<ControllerButton | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('aim');

  const updateAccessibility = (updates: Partial<AccessibilitySettings>) => {
    updateActiveProfile({ accessibility: { ...activeProfile.accessibility, ...updates } });
  };

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-slate-200 overflow-hidden font-sans select-none selection:bg-blue-500/30">
      <div className="h-11 bg-black border-b border-white/5 flex items-center justify-between px-8 drag-region">
        <div className="flex items-center gap-4">
          <Binary className="text-blue-500 w-5 h-5 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">1Man1Machine // Hernan H Edition</span>
        </div>
        <div className="flex items-center gap-6 no-drag">
          <button 
             onClick={connectHID}
             className="flex items-center gap-2.5 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-inner hover:bg-blue-500/20 transition-all cursor-pointer group"
          >
            <div className={`w-2 h-2 rounded-full ${state.connected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'} animate-pulse`} />
            <span className={`text-[9px] font-black uppercase tracking-widest group-hover:text-blue-300 transition-colors ${state.connected ? 'text-blue-400' : 'text-slate-500'}`}>
               {state.id ? (state.connected ? 'HID_SYNC_OK' : 'NEURAL_READY') : 'CONNECT_HID'}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => window.icoreBridge?.minimize()} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors"><Minus className="w-4 h-4 text-slate-600" /></button>
            <button onClick={() => window.icoreBridge?.maximize()} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors"><Square className="w-3 h-3 text-slate-600" /></button>
            <button onClick={() => window.icoreBridge?.close()} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors"><X className="w-4 h-4 text-slate-600" /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-slate-950 border-r border-white/5 flex flex-col p-10 gap-10 z-20">
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
               { id: 'tst', label: 'Testing Hub', icon: Zap },
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
                className={`w-full p-4 rounded-[2rem] border flex items-center justify-between transition-all duration-300 group ${
                  isKernelActive 
                    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.15)]' 
                    : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                }`}
              >
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isKernelActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' 
                        : 'bg-slate-800 text-slate-600'
                    }`}>
                      <Power className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className={`block text-[10px] font-black uppercase tracking-widest transition-colors ${
                        isKernelActive ? 'text-white' : 'text-slate-500'
                      }`}>
                        {isKernelActive ? 'System Active' : 'System Offline'}
                      </span>
                      <span className={`block text-[8px] font-bold uppercase tracking-widest transition-colors ${
                         isKernelActive ? 'text-blue-400' : 'text-slate-600'
                      }`}>
                        {isKernelActive ? 'Kernel Running' : 'Tap to Activate'}
                      </span>
                    </div>
                 </div>
                 
                 <div className={`w-10 h-5 rounded-full border transition-all duration-300 relative ${
                   isKernelActive ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-950 border-white/10'
                 }`}>
                    <div className={`absolute top-0.5 bottom-0.5 w-4 rounded-full transition-all duration-300 ${
                      isKernelActive ? 'right-0.5 bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'left-0.5 bg-slate-700'
                    }`} />
                 </div>
              </button>
           </div>
        </aside>

        <main className="flex-1 p-14 overflow-y-auto custom-scrollbar relative">
           {activeTab === 'eng' && (
             <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="xl:col-span-7 space-y-16">
                 <div className="glass p-12 rounded-[4rem] border-white/5 shadow-2xl relative overflow-hidden">
                    <CombatOverlay profile={activeProfile} onUpdateProfile={updateActiveProfile} />
                 </div>
                 <DualSenseSVG selectedButton={selectedButton} onSelectButton={setSelectedButton} />
               </div>
               
               <div className="xl:col-span-5 space-y-6">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 px-8 mb-2">
                       <Settings2 className="w-4 h-4 text-blue-500" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Optimization_Suite</span>
                    </div>

                    <div className={`glass rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${expandedSection === 'aim' ? 'border-blue-500/30 bg-slate-900/60 ring-1 ring-blue-500/10' : 'border-white/5 bg-slate-900/40 hover:border-white/10'}`}>
                      <button onClick={() => setExpandedSection(expandedSection === 'aim' ? null : 'aim')} className="w-full p-8 flex items-center justify-between text-left group">
                        <div className="flex items-center gap-5">
                          <div className={`p-3.5 rounded-2xl transition-all duration-300 ${expandedSection === 'aim' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-500'}`}>
                            <Crosshair className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Aim Assistance</h4>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${activeProfile.accessibility.yoloEnabled ? 'text-purple-400' : 'text-slate-500'}`}>
                              {activeProfile.accessibility.yoloEnabled ? 'Neural_Active' : 'HID_Only'}
                            </span>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${expandedSection === 'aim' ? 'rotate-180 text-blue-400' : 'text-slate-600'}`} />
                      </button>
                      
                      <div className={`transition-all duration-500 ease-in-out ${expandedSection === 'aim' ? 'max-h-[1200px] opacity-100 border-t border-white/5' : 'max-h-0 opacity-0'}`}>
                        <div className="p-8 space-y-8">
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
                             <span className="text-[10px] font-black text-white uppercase tracking-widest">Stabilization Mode</span>
                             <div className="grid grid-cols-5 gap-1 bg-slate-950/50 p-1 rounded-2xl border border-white/5">
                                {['Off', 'Light', 'Medium', 'Heavy', 'Custom'].map(mode => (
                                   <button 
                                     key={mode}
                                     onClick={() => {
                                        const updates: any = { stabilizationMode: mode };
                                        if (mode === 'Light') updates.aimStabilizationStrength = 25;
                                        if (mode === 'Medium') updates.aimStabilizationStrength = 50;
                                        if (mode === 'Heavy') updates.aimStabilizationStrength = 85;
                                        if (mode === 'Off') updates.aimStabilizationStrength = 0;
                                        updateAccessibility(updates);
                                     }}
                                     className={`py-2 rounded-xl text-[8px] font-black uppercase transition-all ${activeProfile.accessibility.stabilizationMode === mode ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                   >
                                      {mode}
                                   </button>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-6">
                             <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strength</span>
                                  <span className="text-[10px] font-mono text-blue-400 font-black">{activeProfile.accessibility.aimStabilizationStrength}%</span>
                                </div>
                                <input 
                                  type="range" min="0" max="100" 
                                  value={activeProfile.accessibility.aimStabilizationStrength} 
                                  onChange={(e) => updateAccessibility({ aimStabilizationStrength: parseInt(e.target.value), stabilizationMode: 'Custom' })} 
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                                />
                             </div>
                             <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Pull</span>
                                  <span className="text-[10px] font-mono text-purple-400 font-black">{activeProfile.accessibility.yoloTrackingPower}%</span>
                                </div>
                                <input 
                                  type="range" min="0" max="100" 
                                  value={activeProfile.accessibility.yoloTrackingPower} 
                                  onChange={(e) => updateAccessibility({ yoloTrackingPower: parseInt(e.target.value) })} 
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600" 
                                />
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => updateAccessibility({ snapToTargetEnabled: !activeProfile.accessibility.snapToTargetEnabled })} className={`p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all ${activeProfile.accessibility.snapToTargetEnabled ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-950 border-white/5 text-slate-600'}`}>
                              <Magnet className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-widest">Snap-to-Target</span>
                            </button>
                            <button onClick={() => updateAccessibility({ aimSlowdownEnabled: !activeProfile.accessibility.aimSlowdownEnabled })} className={`p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all ${activeProfile.accessibility.aimSlowdownEnabled ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-950 border-white/5 text-slate-600'}`}>
                              <Wind className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-widest">Slowdown Zone</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                 </div>

                 <StickConfigurator profile={activeProfile} updateAxisMapping={updateAxisMapping} />

                 <div className="glass p-10 rounded-[3.5rem] shadow-2xl border-white/5">
                    <MappingList profile={activeProfile} onSelectButton={setSelectedButton} onUpdateMapping={updateMapping} />
                 </div>
               </div>
             </div>
           )}

           {activeTab === 'tel' && <AnalyticsView />}
           {activeTab === 'tst' && <TestingView profile={activeProfile} />}
           {activeTab === 'sec' && <SecurityInterceptor />}
           {activeTab === 'hlp' && <HelpView />}
           {activeTab === 'stk' && (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-8">
                {profiles.map(p => (
                   <button key={p.id} onClick={() => setActiveProfileId(p.id)} className={`p-10 rounded-[3rem] border text-left transition-all ${activeProfile.id === p.id ? 'bg-blue-600/10 border-blue-400 shadow-xl' : 'bg-slate-900/40 border-white/5 hover:border-white/20'}`}>
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{p.name}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{p.category}</p>
                      <div className="mt-8 flex gap-2">
                         {p.accessibility.yoloEnabled && <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-[9px] font-black uppercase">Neural</span>}
                         {p.accessibility.rapidFireEnabled && <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-[9px] font-black uppercase">Rapid</span>}
                         {p.accessibility.antiRecoilEnabled && <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[9px] font-black uppercase">Recoil</span>}
                      </div>
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
  const [profiles, setProfiles] = useState<Profile[]>(DEFAULT_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState<string>(DEFAULT_PROFILES[0].id);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  const updateActiveProfile = (updates: Partial<Profile>) => {
    setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, ...updates } : p));
  };

  const updateMapping = (btn: ControllerButton, updates: Partial<Mapping>) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfileId) return p;
      const newMappings = [...p.mappings];
      const idx = newMappings.findIndex(m => m.button === btn);
      if (idx >= 0) {
        newMappings[idx] = { ...newMappings[idx], ...updates };
      } else {
        newMappings.push({ button: btn, mappedTo: 'None', keyCode: '', type: 'KEYBOARD', ...updates });
      }
      return { ...p, mappings: newMappings };
    }));
  };

  const updateAxisMapping = (axis: string, updates: Partial<AxisMapping>) => {
     setProfiles(prev => prev.map(p => {
        if (p.id !== activeProfileId) return p;
        const newAxes = [...p.axisMappings];
        const idx = newAxes.findIndex(a => a.axis === axis);
        if (idx >= 0) {
           newAxes[idx] = { ...newAxes[idx], ...updates };
        }
        return { ...p, axisMappings: newAxes };
     }));
  };

  return (
    <GamepadProvider activeProfile={activeProfile}>
      <Dashboard 
        profiles={profiles} 
        activeProfile={activeProfile} 
        setActiveProfileId={setActiveProfileId} 
        updateActiveProfile={updateActiveProfile}
        updateMapping={updateMapping}
        updateAxisMapping={updateAxisMapping}
      />
    </GamepadProvider>
  );
};

export default App;