
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
  MousePointer2
} from 'lucide-react';

const HelpView: React.FC = () => {
  const { state } = useGamepad();
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Plug in the Controller",
      desc: "Connect your PlayStation DualSense controller to your computer using a USB-C cable. USB is recommended for the fastest response time.",
      icon: Usb,
      status: state.connected ? 'complete' : 'pending',
      actionLabel: "I've plugged it in"
    },
    {
      id: 2,
      title: "Grant Access",
      desc: "Your computer needs permission to 'talk' to the controller. If a box pops up in your browser asking to 'Connect', click it and select 'DualSense'.",
      icon: ShieldCheck,
      status: state.id ? 'complete' : 'pending',
      actionLabel: "I see the prompt"
    },
    {
      id: 3,
      title: "Pick Your Playstyle",
      desc: "Go to the 'Stacks' tab and click on a game profile (like 'FPS Pro'). This sets up all your buttons automatically.",
      icon: Layers,
      status: 'pending',
      actionLabel: "Profile Selected"
    },
    {
      id: 4,
      title: "Start Playing",
      desc: "Leave this window open in the background. Move your sticks now to see the 'Telemetry' tab light up. You are ready!",
      icon: PlayCircle,
      status: 'pending',
      actionLabel: "Let's Go!"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Gen2Viral Onboarding</span>
        </div>
        <h2 className="text-5xl font-black text-white tracking-tighter uppercase">Getting Started</h2>
        <p className="text-slate-500 font-bold uppercase tracking-tight max-w-lg mx-auto">
          Follow these four simple steps to transform your controller into a high-performance gaming tool.
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
          {activeStep === 1 && (
             <div className="text-center space-y-4">
                <Usb className={`w-24 h-24 mx-auto transition-all ${state.connected ? 'text-green-500 scale-110' : 'text-slate-700 animate-pulse'}`} />
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  {state.connected ? 'Device Linked' : 'Awaiting Connection'}
                </p>
             </div>
          )}
          {activeStep === 2 && (
             <div className="text-center space-y-4 p-8">
                <div className="w-full h-12 bg-white/5 rounded-full border border-white/10 flex items-center px-4 gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="p-4 bg-slate-900 border border-blue-500/50 rounded-xl shadow-2xl animate-bounce">
                  <p className="text-xs font-bold text-white">Browser Prompt: Click "Connect"</p>
                </div>
             </div>
          )}
          {activeStep === 3 && (
             <div className="grid grid-cols-2 gap-4 p-8 w-full">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-20 rounded-2xl border ${i === 1 ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5'} flex items-center justify-center`}>
                    <Layers className={`w-6 h-6 ${i === 1 ? 'text-blue-500' : 'text-slate-800'}`} />
                  </div>
                ))}
             </div>
          )}
          {activeStep === 4 && (
             <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-4 border-blue-500/20 flex items-center justify-center animate-ping absolute" />
                <PlayCircle className="w-24 h-24 text-blue-500 relative z-10" />
             </div>
          )}
        </div>
      </div>

      <footer className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-[2.5rem] flex items-center gap-6">
        <AlertCircle className="w-8 h-8 text-blue-400 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Expert Support</h4>
          <p className="text-xs text-slate-500 font-bold uppercase leading-relaxed">
            Trouble with setup? Ensure you are using <span className="text-blue-400">Google Chrome</span> or <span className="text-blue-400">Microsoft Edge</span>. Older browsers do not support high-speed controller mapping.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HelpView;
