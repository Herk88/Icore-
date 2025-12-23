
import React, { useState, useEffect, useMemo } from 'react';
import { GamepadProvider, useGamepad } from './components/GamepadProvider';
import DualSenseSVG from './components/DualSenseSVG';
import MappingList from './components/MappingList';
import VirtualOutput from './components/VirtualOutput';
import AnalyticsView from './components/AnalyticsView';
import HelpView from './components/HelpView';
import { DEFAULT_PROFILES, DUALSENSE_INDICES } from './constants';
import { Profile, ControllerButton, Mapping, AccessibilitySettings } from './types';
import { 
  Settings, Layers, Gamepad2, Activity, Cpu, ShieldCheck, Zap, 
  ChevronDown, Flame, Monitor, Layout, Target, Move, Info,
  Lock, MousePointer2, X, Minus, Square, Bell, Terminal as TerminalIcon, 
  ShieldAlert, Wifi, Database, HardDrive, Unplug, Upload, RefreshCw, Eye
} from 'lucide-react';

const TitleBar: React.FC = () => {
  return (
    <div className="h-10 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 select-none drag-region">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Cpu className="text-white w-3 h-3" />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">iCore <span className="text-blue-500">Desktop</span> <span className="text-slate-600">v2.4.0</span></span>
      </div>
      <div className="flex items-center gap-6 no-drag">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Kernel Stable</span>
        </div>
        <div className="flex items-center">
          <button className="p-2 text-slate-500 hover:text-white hover:bg-white/5 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
          <button className="p-2 text-slate-500 hover:text-white hover:bg-white/5 transition-colors"><Square className="w-3 h-3" /></button>
          <button className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
};

const SystemNotification: React.FC<{ message: string; type: 'info' | 'warn' | 'success'; onClose: () => void }> = ({ message, type, onClose }) => {
  return (
    <div className="fixed bottom-14 right-6 z-[200] w-80 bg-[#0a0a0b] border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right-10 flex gap-4 overflow-hidden backdrop-blur-2xl">
      <div className={`w-1 h-full absolute left-0 top-0 ${type === 'success' ? 'bg-green-500' : type === 'warn' ? 'bg-amber-500' : 'bg-blue-500'}`} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${type === 'success' ? 'bg-green-500/10 text-green-500' : type === 'warn' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
        {type === 'success' ? <ShieldCheck className="w-5 h-5" /> : type === 'warn' ? <ShieldAlert className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
      </div>
      <div className="flex-1 space-y-1">
        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">System Hook</h4>
        <p className="text-[11px] text-slate-400 font-bold leading-tight">{message}</p>
      </div>
      <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
    </div>
  );
};

const KernelMonitor: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Kernel Status</h2>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Low-level HID Driver status and system integration metrics.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { icon: HardDrive, label: 'Driver State', val: 'V3.21.0 - Active', sub: 'Pressure: 12MB', color: 'text-blue-500' },
          { icon: Wifi, label: 'Hook Latency', val: 'Sub-Millisecond', sub: 'Jitter: 0.02ms', color: 'text-purple-500' },
          { icon: Database, label: 'Stack Sync', val: 'Cloud Synced', sub: 'Integrity: 100%', color: 'text-green-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-tighter">{stat.label}</h4>
                <p className={`text-[10px] ${stat.color} font-black uppercase`}>{stat.val}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                <span>Metric</span>
                <span>{stat.sub}</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                 <div className={`h-full bg-current ${stat.color} ${i === 2 ? 'w-full' : 'w-1/4'}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-950/80 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl font-mono text-[11px] backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
          <span className="text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
            <TerminalIcon className="w-3.5 h-3.5" /> Kernel Boot Log
          </span>
          <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-[9px] font-black">STABLE</span>
        </div>
        <div className="space-y-2 opacity-80 max-h-40 overflow-y-auto custom-scrollbar">
          <p className="text-blue-400">[SYSTEM] Initializing HID Service Layer...</p>
          <p className="text-slate-300">[KERNEL] DualSense Driver V3.21.0 Hooked to USB Thread 0x01</p>
          <p className="text-slate-300">[KERNEL] Haptic Actuators Handshaked successfully.</p>
          <p className="text-slate-300">[SYNC] Loading User Profile: FPS Pro (Local Cache)</p>
          <p className="text-green-400">[CORE] Engine Warm - Listening for controller interrupts...</p>
          <p className="text-slate-500">[DEBUG] Polling cycle start: 1.000ms target</p>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { state, setLayer, toggleGyro, resetStickyStates } = useGamepad();
  
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('icore_profiles_v2');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem('icore_active_profile_id_v2') || profiles[0].id;
  });

  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warn' | 'success' } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'controller' | 'profiles' | 'analytics' | 'kernel' | 'settings' | 'help'>('controller');
  const [selectedButton, setSelectedButton] = useState<ControllerButton | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const activeProfile = useMemo(() => 
    profiles.find(p => p.id === activeProfileId) || profiles[0], 
  [profiles, activeProfileId]);

  useEffect(() => {
    localStorage.setItem('icore_profiles_v2', JSON.stringify(profiles));
    localStorage.setItem('icore_active_profile_id_v2', activeProfileId);
  }, [profiles, activeProfileId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotification({ message: "iCore HID Service engaged. Polling: 1000Hz.", type: 'success' });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const updateActiveProfile = (updates: Partial<Profile>) => {
    setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, ...updates } : p));
    setNotification({ message: `Kernel Sync: Updated stack ${activeProfile.name}`, type: 'info' });
  };

  const updateAccessibility = (updates: Partial<AccessibilitySettings>) => {
    updateActiveProfile({ accessibility: { ...activeProfile.accessibility, ...updates } });
  };

  const updateMapping = (btn: ControllerButton, updates: Partial<Mapping>) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfileId) return p;
      const existing = p.mappings.find(m => m.button === btn);
      const newMappings = existing 
        ? p.mappings.map(m => m.button === btn ? { ...m, ...updates } : m)
        : [...p.mappings, { button: btn, mappedTo: 'Unbound', type: 'KEYBOARD', ...updates } as Mapping];
      return { ...p, mappings: newMappings };
    }));
  };

  const currentMapping = activeProfile.mappings.find(m => m.button === selectedButton);

  return (
    <div className={`h-screen flex flex-col bg-[#050505] text-slate-200 selection:bg-blue-500/30 overflow-hidden font-sans`}>
      
      <TitleBar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Native Sidebar */}
        <aside className="w-20 lg:w-64 bg-slate-950 border-r border-white/5 flex flex-col items-center py-8 px-4 gap-8 z-30 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3 lg:self-start lg:pl-4 group cursor-pointer" onClick={() => setSelectedTab('controller')}>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform group-hover:rotate-12">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <h1 className="hidden lg:block font-black text-lg tracking-tighter text-white uppercase">iCore <span className="text-blue-500">DualMap</span></h1>
          </div>

          <nav className="flex flex-col gap-2 w-full">
            {[
              { id: 'controller', icon: Gamepad2, label: 'Workspace' },
              { id: 'profiles', icon: Layers, label: 'Stacks' },
              { id: 'analytics', icon: Activity, label: 'Telemetry' },
              { id: 'kernel', icon: TerminalIcon, label: 'Kernel' },
              { id: 'settings', icon: Settings, label: 'Service' },
              { id: 'help', icon: Info, label: 'Guide' },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setSelectedTab(item.id as any)}
                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all relative group ${selectedTab === item.id ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${selectedTab === item.id ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
                <span className="hidden lg:block font-bold text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
                {selectedTab === item.id && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-full" />}
              </button>
            ))}
          </nav>

          <div className="mt-auto w-full space-y-4">
             <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[9px] font-black text-slate-600 uppercase">SYS LOAD</span>
                   <span className="text-[9px] font-black text-blue-500">4.1%</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full">
                   <div className="h-full bg-blue-500 w-[41%]" />
                </div>
             </div>
             <button 
              onClick={() => updateAccessibility({ highContrastEnabled: !activeProfile.accessibility.highContrastEnabled })}
              className="w-full p-4 rounded-2xl border border-white/5 text-slate-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center shadow-xl"
             >
                <Eye className="w-5 h-5" />
             </button>
          </div>
        </aside>

        {/* Main Desktop Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar">
            {selectedTab === 'controller' && (
              <>
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
                      HID Workspace
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse" />
                    </h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Active Injection Pipeline: <span className="text-blue-500">{activeProfile.name}</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="px-6 py-3.5 bg-slate-900/50 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3">
                       <Upload className="w-4 h-4" /> Import Stack
                    </button>
                    <button className="px-8 py-3.5 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all text-white font-bold">
                       Save Profile
                    </button>
                  </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                  <div className="xl:col-span-7 space-y-12">
                    <DualSenseSVG selectedButton={selectedButton} onSelectButton={setSelectedButton} showHeatmap={showHeatmap} />
                    <VirtualOutput profile={activeProfile} />
                  </div>
                  <div className="xl:col-span-5 space-y-8">
                    <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 shadow-[0_25px_100px_rgba(0,0,0,0.4)] backdrop-blur-3xl relative overflow-hidden">
                      {selectedButton ? (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                          <div className="flex justify-between items-start">
                             <div className="space-y-1">
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Hook</span>
                               <h3 className="text-4xl font-black text-white uppercase tracking-tighter">{selectedButton}</h3>
                             </div>
                             <div className="flex gap-3">
                               <button 
                                onClick={() => updateMapping(selectedButton, { isTurbo: !currentMapping?.isTurbo })}
                                className={`p-4 rounded-2xl border transition-all ${currentMapping?.isTurbo ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'bg-slate-800/50 border-white/5 text-slate-500'}`}
                               >
                                 <Zap className="w-6 h-6" />
                               </button>
                               <button 
                                onClick={() => updateMapping(selectedButton, { isSticky: !currentMapping?.isSticky })}
                                className={`p-4 rounded-2xl border transition-all ${currentMapping?.isSticky ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-slate-800/50 border-white/5 text-slate-500'}`}
                               >
                                 <Lock className="w-6 h-6" />
                               </button>
                             </div>
                          </div>
                          
                          <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                             <div className="flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                <span>Output Mapping</span>
                                <span className="text-blue-500">{currentMapping?.type || 'UNBOUND'}</span>
                             </div>
                             <div className="flex items-center justify-between">
                               <span className="text-3xl font-black text-white tracking-tighter uppercase">{currentMapping?.mappedTo || 'Not Assigned'}</span>
                               <button onClick={() => {
                                 const key = prompt('Hardware intercept target:');
                                 if (key) updateMapping(selectedButton, { mappedTo: key });
                               }} className="px-6 py-3 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:scale-105 transition-transform shadow-lg shadow-blue-500/20">Edit Bind</button>
                             </div>
                          </div>

                          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4">
                             <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
                                <Info className="w-5 h-5" />
                             </div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                               This mapping is processed at the kernel level for zero added latency.
                             </p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-24 text-center space-y-6 opacity-30 group cursor-default">
                           <MousePointer2 className="w-16 h-16 mx-auto group-hover:scale-110 transition-transform" />
                           <p className="text-sm font-black uppercase tracking-[0.3em]">Select Hardware Hook</p>
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-xl">
                      <MappingList profile={activeProfile} onUpdateMapping={() => {}} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedTab === 'kernel' && <KernelMonitor />}
            {selectedTab === 'analytics' && <AnalyticsView />}
            {selectedTab === 'help' && <HelpView />}
            
            {selectedTab === 'settings' && (
              <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                 <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Desktop Service</h2>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl">
                       <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Lifecycle & Shell</h4>
                       <div className="space-y-6">
                          <label className="flex items-center justify-between cursor-pointer group">
                             <div className="space-y-0.5">
                                <span className="text-xs font-bold text-white uppercase group-hover:text-blue-400 transition-colors">Native Notifications</span>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Show system toasts on mapping changes</p>
                             </div>
                             <button className="w-12 h-6 bg-blue-600 rounded-full relative shadow-inner"><div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1" /></button>
                          </label>
                          <label className="flex items-center justify-between cursor-pointer group">
                             <div className="space-y-0.5">
                                <span className="text-xs font-bold text-white uppercase group-hover:text-blue-400 transition-colors">Start with OS</span>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Launch iCore automatically at login</p>
                             </div>
                             <button className="w-12 h-6 bg-slate-800 rounded-full relative shadow-inner"><div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1" /></button>
                          </label>
                          <label className="flex items-center justify-between cursor-pointer group">
                             <div className="space-y-0.5">
                                <span className="text-xs font-bold text-white uppercase group-hover:text-blue-400 transition-colors">Close to Tray</span>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Keep service active when window is closed</p>
                             </div>
                             <button className="w-12 h-6 bg-blue-600 rounded-full relative shadow-inner"><div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1" /></button>
                          </label>
                       </div>
                    </div>

                    <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl">
                       <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em]">Update Channel</h4>
                       <div className="space-y-6">
                          <div className="p-6 bg-slate-950 rounded-[1.5rem] border border-white/5 space-y-4">
                             <div className="flex items-center gap-4">
                                <div className="px-3 py-1 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-md text-[9px] font-black uppercase tracking-widest">Stable (LTS)</div>
                                <span className="text-[10px] font-bold text-slate-500">Checking...</span>
                             </div>
                             <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-white uppercase tracking-tighter">Current: v2.4.0</p>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Target: v2.4.1</p>
                             </div>
                          </div>
                          <button className="w-full py-5 bg-white/5 border border-white/10 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-slate-200">
                             Force Update Check
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* Standalone Status Bar */}
          <footer className="h-10 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-between px-8 select-none">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                 <div className={`w-2 h-2 rounded-full ${state.connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{state.connected ? 'Controller Engaged' : 'Awaiting Hardware'}</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-3">
                 <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${state.connected ? 'animate-spin-slow' : ''}`} />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Engine: 1000Hz Stable</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <TerminalIcon className="w-3.5 h-3.5 text-slate-600" />
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Session IRQs: {state.totalInputs}</span>
              </div>
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Build 2.4.0-REL</span>
            </div>
          </footer>
        </main>
      </div>

      {notification && (
        <SystemNotification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <style>{`
        .drag-region { -webkit-app-region: drag; }
        .no-drag { -webkit-app-region: no-drag; }
        
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.3); }

        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.05) transparent; }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GamepadProvider>
      <AppContent />
    </GamepadProvider>
  );
};

export default App;
