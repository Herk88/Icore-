import React, { useState } from 'react';
import { AxisMapping, ControllerAxis, Profile } from '../types';
import { Layout, MousePointer2, Move, Circle, Square, Plus, BoxSelect, Maximize } from 'lucide-react';
import CurveEditor from './CurveEditor';

interface StickConfiguratorProps {
  profile: Profile;
  updateAxisMapping: (axis: string, updates: Partial<AxisMapping>) => void;
}

const StickConfigurator: React.FC<StickConfiguratorProps> = ({ profile, updateAxisMapping }) => {
  const [activeStick, setActiveStick] = useState<'LEFT' | 'RIGHT'>('RIGHT');

  const getAxisKey = (type: 'X' | 'Y') => `${activeStick}_STICK_${type}` as ControllerAxis;
  
  const mappingX = profile.axisMappings.find(a => a.axis === getAxisKey('X'));
  const mappingY = profile.axisMappings.find(a => a.axis === getAxisKey('Y'));
  
  // Default to X mapping for shared properties like deadzone/curve in this UI
  const primaryMapping = mappingX || { 
    axis: getAxisKey('X'),
    mappedTo: 'NONE',
    deadzone: 0.1, 
    deadzoneOuter: 1.0, 
    deadzoneType: 'CIRCULAR', 
    curve: 'LINEAR', 
    sensitivity: 100 
  } as AxisMapping;

  const handleUpdate = (updates: Partial<AxisMapping>) => {
    // Apply updates to both X and Y axes of the selected stick for symmetry in this simplified UI
    updateAxisMapping(getAxisKey('X'), updates);
    updateAxisMapping(getAxisKey('Y'), updates);
  };

  return (
    <div className="glass p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-10">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
           <Move className="w-4 h-4" /> Stick Precision Matrix
        </h3>
        
        <div className="flex bg-slate-950 rounded-xl p-1 border border-white/5">
           <button 
             onClick={() => setActiveStick('LEFT')}
             className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeStick === 'LEFT' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <Layout className="w-3 h-3" /> Left Stick
           </button>
           <button 
             onClick={() => setActiveStick('RIGHT')}
             className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeStick === 'RIGHT' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <MousePointer2 className="w-3 h-3" /> Right Stick
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         {/* Visual Deadzone Editor */}
         <div className="space-y-6">
            <div className="flex justify-between items-center">
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Deadzone Logic</span>
               <div className="flex gap-1">
                  {[
                    { id: 'CIRCULAR', icon: Circle, label: 'Radial' },
                    { id: 'SQUARE', icon: Square, label: 'Box' },
                    { id: 'CROSS', icon: Plus, label: 'Cross' },
                    { id: 'AXIAL', icon: BoxSelect, label: 'Axial' },
                  ].map(shape => (
                     <button 
                       key={shape.id}
                       onClick={() => handleUpdate({ deadzoneType: shape.id as any })}
                       title={shape.label}
                       className={`p-2 rounded-lg border transition-all ${primaryMapping.deadzoneType === shape.id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-white/5 text-slate-600'}`}
                     >
                        <shape.icon className="w-4 h-4" />
                     </button>
                  ))}
               </div>
            </div>

            {/* Visualization Canvas */}
            <div className="aspect-square bg-slate-950 rounded-[2rem] border border-white/5 relative flex items-center justify-center overflow-hidden group">
               <div className="absolute inset-0 border-t border-white/5 top-1/2" />
               <div className="absolute inset-0 border-l border-white/5 left-1/2" />
               
               {/* Outer Deadzone Indicator */}
               <div 
                  className={`absolute border-2 border-slate-700 opacity-30 transition-all duration-300 ${primaryMapping.deadzoneType === 'CIRCULAR' ? 'rounded-full' : 'rounded-none'}`}
                  style={{ 
                    width: `${(primaryMapping.deadzoneOuter || 1.0) * 100}%`, 
                    height: `${(primaryMapping.deadzoneOuter || 1.0) * 100}%` 
                  }}
               />

               {/* Inner Deadzone Indicator */}
               <div 
                  className={`absolute bg-red-500/10 border border-red-500/30 transition-all duration-300 ${primaryMapping.deadzoneType === 'CIRCULAR' ? 'rounded-full' : primaryMapping.deadzoneType === 'CROSS' ? '' : 'rounded-sm'}`}
                  style={{ 
                     width: primaryMapping.deadzoneType === 'CROSS' ? '100%' : `${primaryMapping.deadzone * 100}%`, 
                     height: primaryMapping.deadzoneType === 'CROSS' ? `${primaryMapping.deadzone * 100}%` : `${primaryMapping.deadzone * 100}%`,
                     clipPath: primaryMapping.deadzoneType === 'CROSS' ? 'polygon(0% 45%, 45% 45%, 45% 0%, 55% 0%, 55% 45%, 100% 45%, 100% 55%, 55% 55%, 55% 100%, 45% 100%, 45% 55%, 0% 55%)' : undefined 
                  }}
               >
                  {/* Cross uses specific rendering logic or clip-path, simplified here as standard box for demo if css clip-path fails */}
               </div>
               
               {primaryMapping.deadzoneType === 'CROSS' && (
                  // Vertical bar for Cross
                   <div 
                    className="absolute bg-red-500/10 border-x border-red-500/30 transition-all duration-300"
                    style={{ width: `${primaryMapping.deadzone * 100}%`, height: '100%' }}
                   />
               )}
               
               <p className="absolute bottom-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                  {primaryMapping.deadzoneType} Projection
               </p>
            </div>
            
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between mb-2">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Inner Threshold</span>
                     <span className="text-[9px] font-mono text-white">{((primaryMapping.deadzone) * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="50" step="1"
                    value={primaryMapping.deadzone * 100}
                    onChange={(e) => handleUpdate({ deadzone: parseInt(e.target.value) / 100 })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
               </div>
               <div>
                  <div className="flex justify-between mb-2">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Outer Max</span>
                     <span className="text-[9px] font-mono text-white">{((primaryMapping.deadzoneOuter || 1.0) * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" min="50" max="100" step="1"
                    value={(primaryMapping.deadzoneOuter || 1.0) * 100}
                    onChange={(e) => handleUpdate({ deadzoneOuter: parseInt(e.target.value) / 100 })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
               </div>
            </div>
         </div>

         {/* Curve & Output Settings */}
         <div className="space-y-8">
            <CurveEditor 
               type={primaryMapping.curve as any} 
               onChange={(c) => handleUpdate({ curve: c })} 
            />

            <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">Function Mapping</span>
                   <select 
                      value={primaryMapping.mappedTo || 'NONE'} 
                      onChange={(e) => handleUpdate({ mappedTo: e.target.value as any })} 
                      className="bg-slate-950 border border-white/10 px-4 py-2 rounded-xl font-black text-[10px] text-white uppercase focus:border-blue-500 outline-none"
                   >
                      <option value="NONE">Disabled</option>
                      <option value="WASD">WASD Emulation</option>
                      <option value="MOUSE_MOVEMENT">Mouse Aim</option>
                      <option value="SCROLL">Scroll Wheel</option>
                   </select>
                </div>
                
                <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Sensitivity</span>
                     <span className="text-[10px] font-mono text-blue-400 font-black">{primaryMapping.sensitivity}%</span>
                   </div>
                   <input 
                     type="range" min="1" max="200" 
                     value={primaryMapping.sensitivity} 
                     onChange={(e) => handleUpdate({ sensitivity: parseInt(e.target.value) })} 
                     className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                   />
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StickConfigurator;