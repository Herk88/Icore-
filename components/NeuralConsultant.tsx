
import React from 'react';
import { BrainCircuit } from 'lucide-react';

// STUB COMPONENT - UNREACHABLE IN PRODUCTION
const NeuralConsultant: React.FC = () => {
  return (
    <div className="flex flex-col h-[700px] glass rounded-[3.5rem] border border-white/5 shadow-2xl items-center justify-center p-10 text-center">
      <div className="p-6 bg-slate-900/50 rounded-full mb-6">
        <BrainCircuit className="w-12 h-12 text-slate-600" />
      </div>
      <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest mb-2">Module Deactivated</h3>
      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest max-w-sm">
        This module has been disabled for the v3.5.0 Offline Production Build.
      </p>
    </div>
  );
};

export default NeuralConsultant;
