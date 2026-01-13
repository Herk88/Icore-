
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '1Man1Machine_Project');

if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir);

const files = {
  "package.json": `{
  "name": "1man1machine-desktop",
  "productName": "1Man1Machine",
  "version": "3.5.0",
  "description": "High-performance standalone DualSense mapping engine by Hernan H with Neural Interceptor logic.",
  "main": "dist-electron/main.js",
  "author": "Hernan H",
  "license": "MIT",
  "scripts": {
    "dev": "concurrently \\"npm run dev:vite\\" \\"npm run dev:electron\\"",
    "dev:vite": "vite",
    "dev:electron": "wait-on http://localhost:5173 && electron .",
    "build": "npm run build:frontend && npm run build:electron",
    "build:frontend": "vite build",
    "build:electron": "tsc -p electron/tsconfig.json",
    "build:win": "npm run build && electron-builder --win",
    "postinstall": "electron-builder install-app-deps",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "lucide-react": "0.562.0",
    "@nut-tree/nut-js": "^3.1.2"
  },
  "devDependencies": {
    "electron": "28.0.0",
    "electron-builder": "24.9.1",
    "vite": "5.0.0",
    "@vitejs/plugin-react": "4.2.0",
    "typescript": "5.3.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/node": "^18.11.18",
    "concurrently": "8.2.0",
    "wait-on": "7.0.1",
    "vitest": "1.0.0",
    "@testing-library/react": "14.1.0",
    "@testing-library/jest-dom": "6.1.0",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.17"
  },
  "build": {
    "appId": "com.hernan.m1m",
    "productName": "1Man1Machine",
    "copyright": "Copyright © 2024 Hernan H",
    "files": [
      "dist/**/*",
      "dist-electron/**/*",
      "resources/**/*"
    ],
    "directories": {
      "output": "release"
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "zip",
          "arch": ["x64"]
        }
      ],
      "icon": "resources/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "perMachine": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "1Man1Machine"
    }
  }
}`,
  "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist", "dist-electron"]
}`,
  "vite.config.ts": `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  }
});`,
  "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>1Man1Machine // Neural Controller Suite</title>
  <link rel="manifest" href="./manifest.json">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          animation: {
            'spin-slow': 'spin 10s linear infinite',
            'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            'flicker': 'flicker 0.15s infinite',
            'glitch': 'glitch 0.4s cubic-bezier(.25,.46,.45,.94) infinite both',
          },
          keyframes: {
            flicker: {
              '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': { opacity: 1 },
              '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': { opacity: 0.4 },
            }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-[#050505] text-slate-200">
  <div id="root"></div>
  <script type="module" src="./index.tsx"></script>
</body>
</html>`,
  "index.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const unregisterLegacyServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        registration.unregister();
      }
    } catch (error) {
      console.warn('Service Worker unregistration failed:', error);
    }
  }
};

if (document.readyState === 'complete') {
  unregisterLegacyServiceWorkers();
} else {
  window.addEventListener('load', unregisterLegacyServiceWorkers);
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element to mount to");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  "App.tsx": `import React, { useState } from 'react';
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
            <div className={\`w-2 h-2 rounded-full \${state.connected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'} animate-pulse\`} />
            <span className={\`text-[9px] font-black uppercase tracking-widest group-hover:text-blue-300 transition-colors \${state.connected ? 'text-blue-400' : 'text-slate-500'}\`}>
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
                className={\`w-full flex items-center gap-5 p-5 rounded-2xl transition-all border \${activeTab === item.id ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-[0_10px_20px_rgba(0,0,0,0.4)]' : 'border-transparent text-slate-500 hover:bg-white/5'}\`}
               >
                 <item.icon className={\`w-5 h-5 \${activeTab === item.id ? 'animate-pulse' : ''}\`} />
                 <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
               </button>
             ))}
           </nav>

           <div className="pt-10 border-t border-white/5">
              <button 
                onClick={() => setKernelActive(!isKernelActive)}
                className={\`w-full p-4 rounded-[2rem] border flex items-center justify-between transition-all duration-300 group \${
                  isKernelActive 
                    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.15)]' 
                    : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                }\`}
              >
                 <div className="flex items-center gap-4">
                    <div className={\`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 \${
                      isKernelActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' 
                        : 'bg-slate-800 text-slate-600'
                    }\`}>
                      <Power className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className={\`block text-[10px] font-black uppercase tracking-widest transition-colors \${
                        isKernelActive ? 'text-white' : 'text-slate-500'
                      }\`}>
                        {isKernelActive ? 'System Active' : 'System Offline'}
                      </span>
                      <span className={\`block text-[8px] font-bold uppercase tracking-widest transition-colors \${
                         isKernelActive ? 'text-blue-400' : 'text-slate-600'
                      }\`}>
                        {isKernelActive ? 'Kernel Running' : 'Tap to Activate'}
                      </span>
                    </div>
                 </div>
                 
                 <div className={\`w-10 h-5 rounded-full border transition-all duration-300 relative \${
                   isKernelActive ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-950 border-white/10'
                 }\`}>
                    <div className={\`absolute top-0.5 bottom-0.5 w-4 rounded-full transition-all duration-300 \${
                      isKernelActive ? 'right-0.5 bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'left-0.5 bg-slate-700'
                    }\`} />
                 </div>
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
                 <DualSenseSVG selectedButton={selectedButton} onSelectButton={setSelectedButton} />
               </div>
               
               <div className="xl:col-span-5 space-y-6">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 px-8 mb-2">
                       <Settings2 className="w-4 h-4 text-blue-500" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Optimization_Suite</span>
                    </div>

                    <div className={\`glass rounded-[2.5rem] border transition-all duration-500 overflow-hidden \${expandedSection === 'aim' ? 'border-blue-500/30 bg-slate-900/60 ring-1 ring-blue-500/10' : 'border-white/5 bg-slate-900/40 hover:border-white/10'}\`}>
                      <button onClick={() => setExpandedSection(expandedSection === 'aim' ? null : 'aim')} className="w-full p-8 flex items-center justify-between text-left group">
                        <div className="flex items-center gap-5">
                          <div className={\`p-3.5 rounded-2xl transition-all duration-300 \${expandedSection === 'aim' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-500'}\`}>
                            <Crosshair className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Aim Assistance</h4>
                            <span className={\`text-[8px] font-black uppercase tracking-widest \${activeProfile.accessibility.yoloEnabled ? 'text-purple-400' : 'text-slate-500'}\`}>
                              {activeProfile.accessibility.yoloEnabled ? 'Neural_Active' : 'HID_Only'}
                            </span>
                          </div>
                        </div>
                        <ChevronDown className={\`w-4 h-4 transition-transform duration-500 \${expandedSection === 'aim' ? 'rotate-180 text-blue-400' : 'text-slate-600'}\`} />
                      </button>
                      
                      <div className={\`transition-all duration-500 ease-in-out \${expandedSection === 'aim' ? 'max-h-[1200px] opacity-100 border-t border-white/5' : 'max-h-0 opacity-0'}\`}>
                        <div className="p-8 space-y-8">
                          <div className="flex items-center justify-between bg-slate-950/40 p-5 rounded-3xl border border-white/5">
                             <div className="flex items-center gap-4">
                               <div className={\`p-2 rounded-xl \${activeProfile.accessibility.yoloEnabled ? 'bg-purple-600/20 text-purple-400' : 'bg-slate-800 text-slate-600'}\`}>
                                 <BrainCircuit className="w-5 h-5" />
                               </div>
                               <span className="text-[10px] font-black text-white uppercase tracking-widest">AI Neural Tracking</span>
                             </div>
                             <button onClick={() => updateAccessibility({ yoloEnabled: !activeProfile.accessibility.yoloEnabled })} className={\`w-12 h-6 rounded-full transition-all relative \${activeProfile.accessibility.yoloEnabled ? 'bg-purple-600' : 'bg-slate-800'}\`}>
                               <div className={\`absolute top-1 w-4 h-4 bg-white rounded-full transition-all \${activeProfile.accessibility.yoloEnabled ? 'left-7' : 'left-1'}\`} />
                             </button>
                          </div>

                          <div className="space-y-4">
                             <span className="text-[10px] font-black text-white uppercase tracking-widest">Stabilization Mode</span>
                             <div className="grid grid-cols-5 gap-1 bg-slate-950/50 p-1 rounded-2xl border border-white/5">
                                {['Off', 'Light', 'Medium', 'Heavy', 'Custom'].map(mode => (
                                   <button 
                                     key={mode}
                                     onClick={() => {
                                        const updates = { stabilizationMode: mode };
                                        if (mode === 'Light') updates.aimStabilizationStrength = 25;
                                        if (mode === 'Medium') updates.aimStabilizationStrength = 50;
                                        if (mode === 'Heavy') updates.aimStabilizationStrength = 85;
                                        if (mode === 'Off') updates.aimStabilizationStrength = 0;
                                        updateAccessibility(updates);
                                     }}
                                     className={\`py-2 rounded-xl text-[8px] font-black uppercase transition-all \${activeProfile.accessibility.stabilizationMode === mode ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}\`}
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
                            <button onClick={() => updateAccessibility({ snapToTargetEnabled: !activeProfile.accessibility.snapToTargetEnabled })} className={\`p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all \${activeProfile.accessibility.snapToTargetEnabled ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-950 border-white/5 text-slate-600'}\`}>
                              <Magnet className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-widest">Snap-to-Target</span>
                            </button>
                            <button onClick={() => updateAccessibility({ aimSlowdownEnabled: !activeProfile.accessibility.aimSlowdownEnabled })} className={\`p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all \${activeProfile.accessibility.aimSlowdownEnabled ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-950 border-white/5 text-slate-600'}\`}>
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
                   <button key={p.id} onClick={() => setActiveProfileId(p.id)} className={\`p-10 rounded-[3rem] border text-left transition-all \${activeProfile.id === p.id ? 'bg-blue-600/10 border-blue-400 shadow-xl' : 'bg-slate-900/40 border-white/5 hover:border-white/20'}\`}>
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

export default App;`,
  "types.ts": `export type ControllerButton = 
  | 'CROSS' | 'CIRCLE' | 'SQUARE' | 'TRIANGLE' 
  | 'L1' | 'R1' | 'L2' | 'R2' 
  | 'SHARE' | 'OPTIONS' | 'PS' | 'TOUCHPAD'
  | 'L3' | 'R3' | 'DPAD_UP' | 'DPAD_DOWN' | 'DPAD_LEFT' | 'DPAD_RIGHT';

export type ControllerAxis = 'LEFT_STICK_X' | 'LEFT_STICK_Y' | 'RIGHT_STICK_X' | 'RIGHT_STICK_Y';

export type SystemAction = 
  | 'NONE' | 'VOLUME_UP' | 'VOLUME_DOWN' | 'MUTE' 
  | 'SCREENSHOT' | 'RECORD' | 'SLEEP' | 'WAKE' 
  | 'APP_LAUNCHER' | 'NEXT_MONITOR';

export interface MacroStep {
  id: string;
  key: string;
  delay: number;
}

export interface RadialItem {
  id: string;
  label: string;
  icon: 'Sword' | 'Shield' | 'Zap' | 'Mouse';
}

export interface Mapping {
  button: ControllerButton;
  mappedTo: string;
  keyCode: string;
  type: 'KEYBOARD' | 'MOUSE' | 'MACRO' | 'RADIAL_MENU' | 'SYSTEM_ACTION';
  mouseButton?: 0 | 1 | 2;
  systemAction?: SystemAction;
  macroSteps?: MacroStep[];
  isToggle?: boolean;
  isTurbo?: boolean;
  turboSpeed?: number;
  burstMode?: boolean;
  burstCount?: number;
  threshold?: number;
  isSticky?: boolean;
}

export interface AxisMapping {
  axis: ControllerAxis;
  mappedTo: 'WASD' | 'MOUSE_MOVEMENT' | 'SCROLL' | 'FLICK_STICK' | 'GYRO_MOUSE' | 'NONE';
  sensitivity: number;
  deadzone: number;
  deadzoneOuter: number;
  deadzoneType: 'CIRCULAR' | 'SQUARE' | 'CROSS' | 'AXIAL';
  curve: 'LINEAR' | 'EXPONENTIAL' | 'S_CURVE' | 'INSTANT' | 'CUSTOM';
}

export interface TrainingConfig {
  enabled: boolean;
  maxImages: number;
  minInterval: number;
  confidenceThreshold: number;
  probLowConfidence: number;
  probHighConfidence: number;
  minBrightness: number;
  minSharpness: number;
  datasetPath: string;
}

export interface AccessibilitySettings {
  aimStabilizationStrength: number;
  snapToTargetEnabled: boolean;
  aimSlowdownEnabled: boolean;
  stabilizationMode: 'Off' | 'Light' | 'Medium' | 'Heavy' | 'Custom';
  quickReleaseCombo: boolean;
  stickyDurationLimit: number;
  globalTurboRate: number;
  burstMode: boolean;
  burstCount: number;
  highContrastEnabled: boolean;
  indicatorSize: 'small' | 'medium' | 'large';
  audioFeedbackEnabled: boolean;
  audioFeedbackVolume: number;
  soundPack: string;
  hapticFeedbackEnabled: boolean;
  hapticIntensity: number;
  hapticPattern: string;
  antiRecoilEnabled: boolean;
  antiRecoilStrength: number; 
  autoAimEnabled: boolean;
  autoAimStrength: number;
  autoAimTargetSpeed: number;
  rapidFireEnabled: boolean;
  combatHudEnabled: boolean;
  visualIndicatorsEnabled: boolean; 
  yoloEnabled: boolean;
  trainingAutoCapture: boolean;
  yoloConfidence: number;
  yoloTrackingPower: number; 
  neuralModelQuality: 'fast' | 'accurate';
  gyroSmoothing: number;
  gyroInvertX: boolean;
  gyroInvertY: boolean;
  gyroActivationButton: ControllerButton | 'ALWAYS';
  oneHandedShiftButton: ControllerButton;
  hudScale: number;
  hudOpacity: number;
  hudPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  hudVisible: boolean;
  trainingConfig: TrainingConfig;
}

export interface Profile {
  id: string;
  name: string;
  description?: string;
  category?: 'User' | 'Default' | 'Accessibility' | 'Game-Specific';
  targetProcess?: string;
  mappings: Mapping[];
  axisMappings: AxisMapping[];
  radialItems: RadialItem[];
  created: number;
  gyroEnabled: boolean;
  gyroSensitivity: number;
  flickStickEnabled: boolean;
  oneHandedMode: 'NONE' | 'LEFT' | 'RIGHT';
  virtualOutput: 'KB_MOUSE' | 'XBOX' | 'DS4';
  pollingRate: 125 | 250 | 500 | 1000;
  accessibility: AccessibilitySettings;
}

export interface GamepadState {
  connected: boolean;
  id: string | null;
  buttons: Record<number, boolean>;
  axes: number[];
  rawAxes: number[];
  heatmap: Record<string, number>;
  sessionStartTime: Date;
  totalInputs: number;
  turboTicks: Record<string, number>;
  stickyStates: Record<string, boolean>;
  toggleStates: Record<string, boolean>;
  captureTriggered: boolean;
  aiDetectedTarget: { x: number, y: number } | null;
  virtualKeys: Set<string>;
  mousePosition: { x: number, y: number };
  motion?: {
    gyro: { x: number, y: number, z: number };
  };
}

export interface SecurityEvent {
  timestamp: string;
  device: string;
  sourceIp: string;
  destination: string;
  destIp: string;
  protocol: string;
  size: string;
  info: string;
  suspicious: boolean;
}

export interface TrainingDataPayload {
  image: string;
  labels: string;
  filename: string;
}

export interface ICoreApi {
  version: string;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  getRunningProcesses: () => Promise<string[]>;
  openLogsFolder: () => Promise<void>;
  sendKeyEvent: (args: { keyCode: string; type: 'keydown' | 'keyup' }) => void;
  sendMouseMove: (args: { x: number; y: number }) => void;
  sendMouseButtonEvent: (args: { button: 'left' | 'middle' | 'right'; type: 'mousedown' | 'mouseup' }) => void;
  emergencyReset: () => void;
  onKernelLog: (callback: (log: string) => void) => void;
  onGameDetected: (callback: (processName: string | null) => void) => void;
  saveTrainingData: (data: TrainingDataPayload) => Promise<{ success: boolean; reason?: string }>;
}

declare global {
  interface Window {
    icoreBridge: ICoreApi;
  }
}`,
  "constants.ts": `import { Profile, AccessibilitySettings } from './types';

const defaultAccessibility: AccessibilitySettings = {
  aimStabilizationStrength: 0,
  snapToTargetEnabled: false,
  aimSlowdownEnabled: false,
  stabilizationMode: 'Off',
  quickReleaseCombo: true,
  stickyDurationLimit: 0,
  globalTurboRate: 10,
  burstMode: false,
  burstCount: 3,
  highContrastEnabled: false,
  indicatorSize: 'medium',
  audioFeedbackEnabled: false,
  audioFeedbackVolume: 50,
  soundPack: 'Click',
  hapticFeedbackEnabled: true,
  hapticIntensity: 80,
  hapticPattern: 'Single Pulse',
  oneHandedShiftButton: 'L3',
  antiRecoilEnabled: false,
  antiRecoilStrength: 20,
  autoAimEnabled: false,
  autoAimStrength: 15,
  autoAimTargetSpeed: 5,
  rapidFireEnabled: false,
  combatHudEnabled: true,
  visualIndicatorsEnabled: true,
  yoloEnabled: false,
  trainingAutoCapture: false,
  yoloConfidence: 0.75,
  yoloTrackingPower: 35,
  neuralModelQuality: 'fast',
  gyroSmoothing: 20,
  gyroInvertX: false,
  gyroInvertY: false,
  gyroActivationButton: 'L2',
  hudScale: 100,
  hudOpacity: 90,
  hudPosition: 'bottom-right',
  hudVisible: true,
  trainingConfig: {
    enabled: true,
    maxImages: 1000,
    minInterval: 2000,
    confidenceThreshold: 0.60,
    probLowConfidence: 0.50,
    probHighConfidence: 0.15,
    minBrightness: 30,
    minSharpness: 100,
    datasetPath: 'yolo_training_data'
  }
};

export const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'universal-native',
    name: 'Universal Native: Desktop & FPS',
    category: 'Default',
    description: 'Instant preset. RS=Mouse, LS=WASD, R2=Click. Always Active.',
    targetProcess: 'explorer.exe',
    created: Date.now(),
    gyroEnabled: false,
    gyroSensitivity: 1.0,
    flickStickEnabled: false,
    oneHandedMode: 'NONE',
    virtualOutput: 'KB_MOUSE',
    pollingRate: 1000,
    accessibility: { 
      ...defaultAccessibility,
      audioFeedbackEnabled: true 
    },
    mappings: [
      { button: 'R2', mappedTo: 'Left Click', keyCode: '', type: 'MOUSE', mouseButton: 0 },
      { button: 'L2', mappedTo: 'Right Click', keyCode: '', type: 'MOUSE', mouseButton: 2 },
      { button: 'CROSS', mappedTo: 'Space', keyCode: 'Space', type: 'KEYBOARD' },
      { button: 'CIRCLE', mappedTo: 'Crouch/Back', keyCode: 'KeyC', type: 'KEYBOARD' },
      { button: 'SQUARE', mappedTo: 'Reload/Interact', keyCode: 'KeyR', type: 'KEYBOARD' },
      { button: 'TRIANGLE', mappedTo: 'Inventory', keyCode: 'Tab', type: 'KEYBOARD' },
      { button: 'L3', mappedTo: 'Sprint', keyCode: 'ShiftLeft', type: 'KEYBOARD' },
      { button: 'R3', mappedTo: 'Melee', keyCode: 'KeyV', type: 'KEYBOARD' },
      { button: 'OPTIONS', mappedTo: 'Escape', keyCode: 'Escape', type: 'KEYBOARD' },
      { button: 'L1', mappedTo: 'Prev Weapon', keyCode: 'Digit1', type: 'KEYBOARD' },
      { button: 'R1', mappedTo: 'Next Weapon', keyCode: 'Digit2', type: 'KEYBOARD' },
    ],
    axisMappings: [
      { axis: 'RIGHT_STICK_X', mappedTo: 'MOUSE_MOVEMENT', sensitivity: 65, deadzone: 0.08, deadzoneOuter: 1.0, deadzoneType: 'CIRCULAR', curve: 'EXPONENTIAL' },
      { axis: 'RIGHT_STICK_Y', mappedTo: 'MOUSE_MOVEMENT', sensitivity: 65, deadzone: 0.08, deadzoneOuter: 1.0, deadzoneType: 'CIRCULAR', curve: 'EXPONENTIAL' },
      { axis: 'LEFT_STICK_X', mappedTo: 'WASD', sensitivity: 100, deadzone: 0.1, deadzoneOuter: 1.0, deadzoneType: 'SQUARE', curve: 'LINEAR' },
      { axis: 'LEFT_STICK_Y', mappedTo: 'WASD', sensitivity: 100, deadzone: 0.1, deadzoneOuter: 1.0, deadzoneType: 'SQUARE', curve: 'LINEAR' },
    ],
    radialItems: [],
  },
  {
    id: 'warzone-ultra',
    name: 'Warzone: Slide Cancel Pro',
    category: 'Game-Specific',
    description: 'Auto-Slide cancel on O-tap + Optimized Anti-Recoil for ARs.',
    targetProcess: 'cod.exe',
    created: Date.now(),
    gyroEnabled: false,
    gyroSensitivity: 1.0,
    flickStickEnabled: false,
    oneHandedMode: 'NONE',
    virtualOutput: 'DS4',
    pollingRate: 1000,
    accessibility: { 
      ...defaultAccessibility,
      antiRecoilEnabled: true,
      antiRecoilStrength: 32,
      rapidFireEnabled: true,
      yoloEnabled: true,
      trainingAutoCapture: true,
      yoloTrackingPower: 50
    },
    mappings: [
      { button: 'CIRCLE', mappedTo: 'Slide/Crouch', keyCode: 'KeyC', type: 'KEYBOARD', isTurbo: true, turboSpeed: 15 },
      { button: 'SQUARE', mappedTo: 'Reload', keyCode: 'KeyR', type: 'KEYBOARD' },
      { button: 'CROSS', mappedTo: 'Jump', keyCode: 'Space', type: 'KEYBOARD' },
      { button: 'L2', mappedTo: 'ADS', keyCode: '', type: 'MOUSE', threshold: 0.1, mouseButton: 2 },
      { button: 'R2', mappedTo: 'FIRE', keyCode: '', type: 'MOUSE', threshold: 0.1, mouseButton: 0 },
    ],
    axisMappings: [
      { axis: 'RIGHT_STICK_X', mappedTo: 'MOUSE_MOVEMENT', sensitivity: 45, deadzone: 0.05, deadzoneOuter: 1.0, deadzoneType: 'CIRCULAR', curve: 'EXPONENTIAL' },
      { axis: 'RIGHT_STICK_Y', mappedTo: 'MOUSE_MOVEMENT', sensitivity: 45, deadzone: 0.05, deadzoneOuter: 1.0, deadzoneType: 'CIRCULAR', curve: 'EXPONENTIAL' },
      { axis: 'LEFT_STICK_X', mappedTo: 'WASD', sensitivity: 100, deadzone: 0.1, deadzoneOuter: 1.0, deadzoneType: 'SQUARE', curve: 'LINEAR' },
      { axis: 'LEFT_STICK_Y', mappedTo: 'WASD', sensitivity: 100, deadzone: 0.1, deadzoneOuter: 1.0, deadzoneType: 'SQUARE', curve: 'LINEAR' },
    ],
    radialItems: [],
  }
];

export const DUALSENSE_INDICES: Record<number, string> = {
  0: 'CROSS', 1: 'CIRCLE', 2: 'SQUARE', 3: 'TRIANGLE',
  4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2',
  8: 'SHARE', 9: 'OPTIONS', 10: 'L3', 11: 'R3',
  12: 'DPAD_UP', 13: 'DPAD_DOWN', 14: 'DPAD_LEFT', 15: 'DPAD_RIGHT',
  16: 'PS', 17: 'TOUCHPAD'
};

export const NAME_TO_INDEX: Record<string, number> = Object.entries(DUALSENSE_INDICES).reduce((acc, [idx, name]) => {
  acc[name] = parseInt(idx);
  return acc;
}, {});`,
  "components/GamepadProvider.tsx": `import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { GamepadState, Profile, Mapping, ControllerButton, AxisMapping } from '../types';
import { DUALSENSE_INDICES } from '../constants';

interface GamepadContextType {
  state: GamepadState;
  resetStats: () => void;
  resetStickyStates: () => void;
  setAiTarget: (target: { x: number, y: number } | null) => void;
  isKernelActive: boolean;
  setKernelActive: (active: boolean) => void;
  connectHID: () => Promise<void>;
}

const GamepadContext = createContext<GamepadContextType | undefined>(undefined);

const applyResponseCurve = (val: number, type: string) => {
    const sign = Math.sign(val);
    const abs = Math.abs(val);
    let res = abs;
    switch (type) {
        case 'EXPONENTIAL': res = Math.pow(abs, 2.5); break;
        case 'S_CURVE': res = (abs * abs) / (abs * abs + (1 - abs) * (1 - abs)); break;
        case 'INSTANT': res = abs > 0 ? 1 : 0; break;
        default: res = abs;
    }
    return res * sign;
};

const processAxisPair = (rawX: number, rawY: number, configX?: AxisMapping, configY?: AxisMapping) => {
    const deadzone = configX?.deadzone || 0.1;
    const type = configX?.deadzoneType || 'CIRCULAR';
    const curve = configX?.curve || 'LINEAR';
    let x = rawX;
    let y = rawY;
    let mag = Math.sqrt(x*x + y*y);

    if (type === 'CIRCULAR') {
        if (mag < deadzone) { x = 0; y = 0; }
        else {
           const scale = (mag - deadzone) / (1 - deadzone);
           x = (x / mag) * scale;
           y = (y / mag) * scale;
        }
    } else {
        if (Math.abs(x) < deadzone) x = 0;
        if (Math.abs(y) < deadzone) y = 0;
    }
    x = applyResponseCurve(x, curve);
    y = applyResponseCurve(y, curve);
    return [x, y];
};

export const GamepadProvider: React.FC<{ children: React.ReactNode, activeProfile: Profile }> = ({ children, activeProfile }) => {
  const [isKernelActive, setKernelActive] = useState(true);
  
  const logicState = useRef<GamepadState>({
    connected: false, id: null, buttons: {}, axes: [0,0,0,0], rawAxes: [0,0,0,0],
    heatmap: {}, sessionStartTime: new Date(), totalInputs: 0, turboTicks: {},
    stickyStates: {}, toggleStates: {}, captureTriggered: false, aiDetectedTarget: null,
    virtualKeys: new Set(), mousePosition: { x: 500, y: 500 },
  });

  const [uiState, setUiState] = useState<GamepadState>(logicState.current);
  const prevVirtualKeysRef = useRef<Set<string>>(new Set());
  const prevMouseButtonsRef = useRef<Set<'left' | 'middle' | 'right'>>(new Set());
  const lastPollTimeRef = useRef(0);
  const profileRef = useRef(activeProfile);
  const aiTargetRef = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => { profileRef.current = activeProfile; }, [activeProfile]);

  const connectHID = async () => {
    try {
      if ('hid' in navigator) {
        const devices = await (navigator as any).hid.requestDevice({ filters: [{ vendorId: 0x054C }] });
        if (devices.length > 0) {
           await devices[0].open();
           logicState.current.connected = true;
        }
      }
    } catch (e) { console.error("HID Connection failed:", e); }
  };

  useEffect(() => {
    if (!isKernelActive) return;
    const intervalId = setInterval(() => {
        const now = performance.now();
        const profile = profileRef.current;
        if (now - lastPollTimeRef.current < 1000 / profile.pollingRate) return;
        lastPollTimeRef.current = now;

        const gp = navigator.getGamepads()[0];
        if (!gp) { if(logicState.current.connected) logicState.current.connected=false; return; }

        const rawButtons: Record<number, boolean> = {};
        gp.buttons.forEach((btn, idx) => { rawButtons[idx] = btn.pressed; });
        const rawAxes = [...gp.axes];
        
        const [lsX, lsY] = processAxisPair(rawAxes[0], rawAxes[1], profile.axisMappings.find(a=>a.axis==='LEFT_STICK_X'), profile.axisMappings.find(a=>a.axis==='LEFT_STICK_Y'));
        const [rsX, rsY] = processAxisPair(rawAxes[2], rawAxes[3], profile.axisMappings.find(a=>a.axis==='RIGHT_STICK_X'), profile.axisMappings.find(a=>a.axis==='RIGHT_STICK_Y'));

        const nextVirtualKeys = new Set<string>();
        Object.keys(rawButtons).forEach((key) => {
            const idx = parseInt(key);
            const btnName = DUALSENSE_INDICES[idx] as ControllerButton;
            const mapping = profile.mappings.find(m => m.button === btnName);
            if (rawButtons[idx] && mapping?.type === 'KEYBOARD') nextVirtualKeys.add(mapping.keyCode);
        });
        
        // Simulating IPC for demo
        const prevKeys = prevVirtualKeysRef.current;
        for (const key of nextVirtualKeys) if (!prevKeys.has(key)) window.icoreBridge?.sendKeyEvent({ keyCode: key, type: 'keydown' });
        for (const key of prevKeys) if (!nextVirtualKeys.has(key)) window.icoreBridge?.sendKeyEvent({ keyCode: key, type: 'keyup' });
        prevVirtualKeysRef.current = nextVirtualKeys;

        logicState.current = {
            ...logicState.current, connected: true, id: gp.id, buttons: rawButtons,
            axes: [lsX, lsY, rsX, rsY], rawAxes: rawAxes, totalInputs: logicState.current.totalInputs + 1,
            virtualKeys: nextVirtualKeys, aiDetectedTarget: aiTargetRef.current
        };
    }, 2);
    return () => clearInterval(intervalId);
  }, [isKernelActive]);

  useEffect(() => {
    let rafId: number;
    const loop = () => { setUiState({ ...logicState.current }); rafId = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <GamepadContext.Provider value={{ state: uiState, resetStats: () => {}, resetStickyStates: () => {}, setAiTarget: (t) => { aiTargetRef.current = t; }, isKernelActive, setKernelActive, connectHID }}>
      {children}
    </GamepadContext.Provider>
  );
};
export const useGamepad = () => { const c = useContext(GamepadContext); if (!c) throw new Error('useGamepad failure'); return c; };`,
  "components/CombatOverlay.tsx": `import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGamepad } from './GamepadProvider';
import { Profile } from '../types';
import { BrainCircuit, Loader2, Monitor, Camera, HardDrive, Wifi, CloudDownload, Check, FileCode, ServerCrash, ChevronDown, Database, Scan, Terminal } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';

const MODEL_MIRRORS = ['https://cdn.jsdelivr.net/gh/Hyuto/yolov8-tfjs@master/model/yolov8n_web_model/model.json'];

export const CombatOverlay: React.FC<{ profile: Profile }> = ({ profile }) => {
  const { setAiTarget } = useGamepad();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inferenceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMounted = useRef(true);

  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Neural Core...');
  const [needsDownload, setNeedsDownload] = useState(false);
  const [inferenceTime, setInferenceTime] = useState(0);
  const [fps, setFps] = useState(0);
  const [sourceMode, setSourceMode] = useState<'SCREEN' | 'CAMERA'>('SCREEN');
  const [error, setError] = useState<string | null>(null);
  
  const currentDetectionsRef = useRef<{ boxes: number[][], scores: number[], classes: number[] } | null>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const lastInferenceRef = useRef<number>(0);
  const isInferringRef = useRef(false);

  useEffect(() => {
    const canvas = document.createElement('canvas'); canvas.width = 50; canvas.height = 50; analysisCanvasRef.current = canvas;
    const infCanvas = document.createElement('canvas'); infCanvas.width = 640; infCanvas.height = 640; inferenceCanvasRef.current = infCanvas;
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const convertCenterToCorners = useCallback((boxes: tf.Tensor) => {
    return tf.tidy(() => {
      const [cx, cy, w, h] = tf.split(boxes, 4, 1);
      const x1 = tf.sub(cx, tf.div(w, 2));
      const y1 = tf.sub(cy, tf.div(h, 2));
      const x2 = tf.add(cx, tf.div(w, 2));
      const y2 = tf.add(cy, tf.div(h, 2));
      return tf.concat([y1, x1, y2, x2], 1);
    });
  }, []);

  const handleLocalFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
        setLoading(true);
        try {
            const files = Array.from(event.target.files);
            const hasJson = files.some(f => f.name.toLowerCase().endsWith('.json'));
            const hasBin = files.some(f => f.name.toLowerCase().endsWith('.bin'));
            if (!hasJson || !hasBin) throw new Error("Selection must include 'model.json' AND weight files.");
            const model = await tf.loadGraphModel(tf.io.browserFiles(files));
            setModel(model);
            setLoading(false);
            setNeedsDownload(false);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    }
  };

  const downloadAndInstallModel = async () => {
      setLoading(true);
      try {
          const loadedModel = await tf.loadGraphModel(MODEL_MIRRORS[0]);
          setModel(loadedModel);
          setLoading(false);
          setNeedsDownload(false);
      } catch (err) {
          setError("Download Failed");
          setLoading(false);
      }
  };

  useEffect(() => {
    const checkCacheAndInit = async () => {
      try {
        await tf.ready();
        await tf.setBackend('webgl');
        // Auto-download logic omitted for brevity in installer, assumes manual selection if cache fails
        setNeedsDownload(true);
        setLoading(false);
      } catch (e) { console.error(e); }
    };
    checkCacheAndInit();
  }, []);

  useEffect(() => {
    if (!profile.accessibility.yoloEnabled || !model) { setAiTarget(null); return; }
    const detect = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === 4) {
         const ctx = canvas.getContext('2d', { alpha: false });
         if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            if (currentDetectionsRef.current) {
               const detections = currentDetectionsRef.current;
               ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
               let bestTarget = null; let bestDist = Infinity;
               detections.boxes.forEach((box, i) => {
                  if (detections.scores[i] < 0.5) return;
                  const [cx, cy, w, h] = box;
                  const x1 = (cx - w / 2) * (canvas.width/640);
                  const y1 = (cy - h / 2) * (canvas.height/640);
                  ctx.strokeRect(x1, y1, w*(canvas.width/640), h*(canvas.height/640));
                  const dist = Math.sqrt(Math.pow((cx/640)-0.5, 2) + Math.pow((cy/640)-0.5, 2));
                  if (dist < bestDist) { bestDist = dist; bestTarget = { x: cx/640, y: cy/640 }; }
               });
               setAiTarget(bestTarget);
            }
         }
      }

      const now = performance.now();
      if (model && !isInferringRef.current && (now - lastInferenceRef.current >= 16)) {
         isInferringRef.current = true;
         lastInferenceRef.current = now;
         (async () => {
            const startInf = performance.now();
            try {
               const infCanvas = inferenceCanvasRef.current;
               if (video && video.readyState === 4 && infCanvas) {
                  const infCtx = infCanvas.getContext('2d', { willReadFrequently: true, alpha: false });
                  if (infCtx) {
                     infCtx.drawImage(video, 0, 0, 640, 640);
                     const tensorData = tf.tidy(() => {
                        const img = tf.browser.fromPixels(infCanvas);
                        const normalized = img.toFloat().div(255.0).expandDims(0);
                        const output = model.predict(normalized) as tf.Tensor;
                        const res = output.squeeze([0]).transpose([1, 0]); 
                        const [boxes, scores] = tf.split(res, [4, 80], 1);
                        const nms = tf.image.nonMaxSuppression(convertCenterToCorners(boxes), scores.max(1), 20, 0.5, 0.5);
                        return { boxes: boxes.gather(nms), scores: scores.max(1).gather(nms), classes: scores.argMax(1).gather(nms) };
                     });
                     const [b, s, c] = await Promise.all([tensorData.boxes.array(), tensorData.scores.array(), tensorData.classes.array()]);
                     tensorData.boxes.dispose(); tensorData.scores.dispose(); tensorData.classes.dispose();
                     currentDetectionsRef.current = { boxes: b, scores: s, classes: c };
                     const endInf = performance.now();
                     setInferenceTime(Math.round(endInf - startInf));
                     setFps(Math.round(1000 / (endInf - startInf)));
                  }
               }
            } catch (e) { console.warn(e); } finally { isInferringRef.current = false; }
         })();
      }
      requestRef.current = requestAnimationFrame(detect);
    };
    detect();
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [model, profile.accessibility.yoloEnabled]);

  const startStream = async (mode: 'SCREEN' | 'CAMERA') => {
    try {
      let stream;
      if (mode === 'SCREEN') stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 60 } });
      else stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setSourceMode(mode);
    } catch (e) { setError("Stream Failed"); }
  };

  return (
    <div className="relative w-full aspect-video glass rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden bg-black">
      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} width={800} height={450} className="w-full h-full block" />
      <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between z-20">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-6"><div className="p-4 rounded-3xl bg-slate-800/50"><BrainCircuit className="w-10 h-10 text-slate-600" /></div><div><p className="text-[16px] font-black text-white uppercase tracking-[0.6em]">NEURAL_INTERCEPT</p><p className="text-[10px] text-slate-500 uppercase">{fps}FPS | {inferenceTime}MS</p></div></div>
            <div className="flex gap-4 pointer-events-auto">
             <button onClick={() => startStream('SCREEN')} className="p-4 rounded-2xl bg-blue-600 text-white"><Monitor className="w-6 h-6" /></button>
             <button onClick={() => startStream('CAMERA')} className="p-4 rounded-2xl bg-slate-900 text-slate-500"><Camera className="w-6 h-6" /></button>
            </div>
        </div>
        {needsDownload && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-30 pointer-events-auto">
                <div className="text-center space-y-6 max-w-md p-8 bg-slate-950/90 border border-white/10 rounded-[3rem]">
                    <h3 className="text-xl font-black text-white uppercase">Neural Core Required</h3>
                    <select className="w-full bg-slate-900 border border-white/20 rounded-2xl p-4 text-white" onChange={(e) => { if(e.target.value==='local') fileInputRef.current?.click(); else if(e.target.value==='cloud') downloadAndInstallModel(); }}>
                        <option value="default" disabled selected>Select Neural Source...</option>
                        <option value="cloud">Download Official YOLOv8n</option>
                        <option value="local">Load Local Model</option>
                    </select>
                    <input type="file" multiple accept=".json,.bin,.pt,.onnx" ref={fileInputRef} className="hidden" onChange={handleLocalFileSelect} />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};`,
  "electron/main.ts": `import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as os from 'os';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { keyboard, mouse, Button, Point } = require('@nut-tree/nut-js');

keyboard.config.autoDelayMs = 0; mouse.config.autoDelayMs = 0;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow: BrowserWindow | null = null;
const activeHeldKeys = new Set<number>();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360, height: 860, frame: false, show: false, backgroundColor: '#050505',
    webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.js'), backgroundThrottling: false },
  });
  if (!app.isPackaged) mainWindow.loadURL('http://localhost:5173');
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  mainWindow.once('ready-to-show', () => mainWindow?.show());
}

ipcMain.on('send-key-event', async (_, args) => {
    // simplified key injection logic
});
ipcMain.on('send-mouse-move', async (_, args) => {
    // simplified mouse move logic
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (os.platform() !== 'darwin') app.quit(); });`,
  "electron/preload.ts": `import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('icoreBridge', {
  version: "3.5.0",
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  sendKeyEvent: (args: any) => ipcRenderer.send('send-key-event', args),
  sendMouseMove: (args: any) => ipcRenderer.send('send-mouse-move', args),
  sendMouseButtonEvent: (args: any) => ipcRenderer.send('send-mouse-button-event', args),
  emergencyReset: () => ipcRenderer.send('emergency-reset'),
  saveTrainingData: (data: any) => ipcRenderer.invoke('save-training-data', data),
});`,
  "electron/tsconfig.json": `{ "compilerOptions": { "target": "ES2020", "module": "commonjs", "outDir": "../dist-electron", "esModuleInterop": true, "strict": true, "rootDir": "." }, "include": ["**/*.ts"] }`,
  ".gitignore": `node_modules/\ndist/\ndist-electron/\n*.log`
};

Object.keys(files).forEach(fileName => {
  const filePath = path.join(rootDir, fileName);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, files[fileName].trim());
  console.log('Created: ' + fileName);
});

console.log('\\nProject Setup Complete in ./1Man1Machine_Project');
console.log('To run:');
console.log('1. cd 1Man1Machine_Project');
console.log('2. npm install');
console.log('3. npm run dev');
