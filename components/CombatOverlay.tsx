
import React, { useEffect, useRef, useState } from 'react';
import { useGamepad } from './GamepadProvider';
import { Profile } from '../types';
import { Target, BrainCircuit, Camera, EyeOff } from 'lucide-react';

export const CombatOverlay: React.FC<{ profile: Profile }> = ({ profile }) => {
  const { state, setAiTarget } = useGamepad();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detections, setDetections] = useState<any[]>([]);

  useEffect(() => {
    if (!profile.accessibility.yoloEnabled) {
      setDetections([]);
      setAiTarget(null);
      return;
    }

    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        const x = 0.3 + Math.random() * 0.4;
        const y = 0.3 + Math.random() * 0.4;
        const target = { x, y, label: 'HEAD', conf: 0.92 + Math.random() * 0.05 };
        setDetections([target]);
        setAiTarget({ x, y });
      } else if (Math.random() > 0.8) {
        setDetections([]);
        setAiTarget(null);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [profile.accessibility.yoloEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!profile.accessibility.combatHudEnabled) return;

      detections.forEach(d => {
        const tx = d.x * canvas.width;
        const ty = d.y * canvas.height;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx - 20, ty - 20, 40, 40);
        ctx.fillStyle = '#a855f7';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`${d.label} ${(d.conf * 100).toFixed(0)}%`, tx - 20, ty - 25);
      });
      requestAnimationFrame(render);
    };
    render();
  }, [detections, profile.accessibility.combatHudEnabled]);

  return (
    <div className="relative w-full aspect-video glass rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden group bg-slate-950">
      <canvas ref={canvasRef} width={800} height={450} className="w-full h-full pointer-events-none z-10" />
      
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-500 animate-pulse" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Neural_Kernel_v2.4</span>
             </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
             <div className="flex items-center gap-2">
                <Target className={`w-4 h-4 ${profile.accessibility.yoloEnabled ? 'text-blue-400' : 'text-slate-600'}`} />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Tracking Magnet</span>
             </div>
             <div className="w-32 h-1.5 bg-slate-900 border border-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300" 
                  style={{ width: `${profile.accessibility.yoloEnabled ? profile.accessibility.yoloTrackingPower : 0}%` }}
                />
             </div>
          </div>
        </div>

        <div className="flex justify-between items-end">
           <div className="px-6 py-2 bg-slate-950/80 border border-white/10 rounded-full flex items-center gap-6 backdrop-blur-md">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inference: 4.2ms</span>
              <div className="w-px h-3 bg-white/10" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Freq: 120Hz</span>
           </div>
        </div>
      </div>
      
      {!profile.accessibility.combatHudEnabled && (
         <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm z-30">
           <EyeOff className="w-12 h-12 text-slate-700" />
         </div>
      )}
    </div>
  );
};
