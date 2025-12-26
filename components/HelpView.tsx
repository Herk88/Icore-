
import React, { useState } from 'react';
import { useGamepad } from './GamepadProvider';
import { 
  Usb, 
  ShieldCheck, 
  Layers, 
  PlayCircle, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Download,
  Monitor,
  Cpu
} from 'lucide-react';

const HelpView: React.FC = () => {
  const { state } = useGamepad();
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Plug in the Controller",
      desc: "Connect your PlayStation DualSense controller via USB-C. USB is required for 1000Hz polling and native Haptic support.",
      icon: Usb,
      status: state.connected ? 'complete' : 'pending',
      actionLabel: "I've plugged it in"
    },
    {
      id: 2,
      title: "Grant Access",
      desc: "Click 'Connect' in the browser prompt to link the HID interface. This allows the kernel to intercept your button presses.",
      icon: ShieldCheck,
      status: state.id ? 'complete' : 'pending',
      actionLabel: "I see the prompt"
    },
    {
      id: 3,
      title: "Auto-Game Detection",
      desc: "Go to 'Stacks' and link a profile to a game process (e.g., 'cod.exe'). The app will switch automatically when you launch the game.",
      icon: Layers,
      status: 'pending',
      actionLabel: "Profile Linked"
    },
    {
      id: 4,
      title: "Install Desktop App",
      desc: "For full system-wide mapping and anti-cheat compatibility, download the Windows Installer (.exe) to run in the background.",
      icon: Download,
      status: 'pending',
      actionLabel: "Download Installer"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">1Man1Machine Deployment Cluster by killBill2</span>
        </div>
        <h2 className="text-5xl font-black text-white tracking-tighter uppercase">Deployment Guide</h2>
        <p className="text-slate-500 font-bold uppercase tracking-tight max-w-lg mx-auto">
          Follow these steps to deploy the neural mapping kernel to your hardware.
        </p>
      </header>

      {/* Progress Bar */}
      <div className="flex items-center justify-between px-12 relative">
        <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-12 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-500" 
          style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
              activeStep === step.id 
                ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110' 
                : step.id < activeStep || step.status === 'complete'
                ? 'bg-blue-900 border-blue-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            {step.id < activeStep || step.status === 'complete' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <span className="font-black text-sm">{step.id}</span>
            )}
          </button>
        ))}
      </div>

      {/* Active Step Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-slate-900/40 p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10" />
        
        <div className="space-y-8">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20">
            {React.createElement(steps[activeStep - 1].icon, { className: "w-10 h-10 text-white" })}
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
              {steps[activeStep - 1].title}
            </h3>
            <p className="text-slate-400 font-medium leading-relaxed text-lg">
              {steps[activeStep - 1].desc}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => activeStep < steps.length && setActiveStep(activeStep + 1)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-blue-600/20"
            >
              {steps[activeStep - 1].actionLabel} <ChevronRight className="w-4 h-4" />
            </button>
            {steps[activeStep - 1].status === 'complete' && (
              <span className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </span>
            )}
          </div>
        </div>

        <div className="relative aspect-square bg-slate-950/50 rounded-[3rem] border border-white/5 flex items-center justify-center overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {activeStep === 4 ? (
             <div className="text-center space-y-6">
                <Monitor className="w-24 h-24 text-blue-500 mx-auto" />
                <div className="space-y-2">
                  <p className="text-xs font-black text-white uppercase tracking-widest">1Man1Machine by killBill2</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Compatible with Windows 10/11</p>
                </div>
                <button className="bg-white text-slate-950 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 transition-colors">
                  Build Installer (.exe)
                </button>
             </div>
          ) : (
            <div className="flex items-center justify-center p-12">
               <Cpu className="w-32 h-32 text-slate-800 animate-spin-slow" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-950/80 p-10 rounded-[3rem] border border-white/5 space-y-6">
           <h4 className="text-lg font-black text-white uppercase tracking-tighter">Installation FAQ</h4>
           <div className="space-y-4">
              <div className="space-y-1">
                 <p className="text-[11px] font-black text-blue-400 uppercase">Is this a driver?</p>
                 <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">No, it's a user-mode HID interceptor. It does not require BIOS changes or disabling Secure Boot.</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[11px] font-black text-blue-400 uppercase">How do I update?</p>
                 <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">The desktop app checks for updates on startup. Simply restart the app to pull the latest kernel.</p>
              </div>
           </div>
        </div>

        <div className="bg-blue-600/5 border border-blue-500/20 p-10 rounded-[3rem] space-y-4">
           <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-blue-400" />
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Dev Tip</h4>
           </div>
           <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">
              To build the installer yourself, ensure you have <span className="text-blue-400">Node.js</span> installed. 
              Run <code className="bg-slate-900 px-2 py-1 rounded text-white font-mono">npm run build:win</code> in the project root. 
              The resulting installer will appear in the <span className="text-white">dist/</span> directory.
           </p>
        </div>
      </div>
    </div>
  );
};

export default HelpView;
