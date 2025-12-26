
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGamepad } from './GamepadProvider';
import { Profile } from '../types';
import { Target, BrainCircuit, Loader2, Boxes, Cpu, Zap, Scan, MousePointer2, Crosshair } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';

const CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog',
  'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella',
  'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite',
  'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 'bottle',
  'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich',
  'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
  'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote',
  'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book',
  'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

export const CombatOverlay: React.FC<{ profile: Profile }> = ({ profile }) => {
  const { setAiTarget } = useGamepad();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [inferenceTime, setInferenceTime] = useState(0);
  const [fps, setFps] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const requestRef = useRef<number>();
  
  const simTargets = useRef<{x: number, y: number, vx: number, vy: number, label: string}[]>([]);

  const convertCenterToCorners = useCallback((boxes: tf.Tensor) => {
    return tf.tidy(() => {
      const [cx, cy, w, h] = tf.split(boxes, 4, 1);
      const x1 = tf.sub(cx, tf.div(w, 2));
      const y1 = tf.sub(cy, tf.div(h, 2));
      const x2 = tf.add(cx, tf.div(w, 2));
      const y2 = tf.add(cy, tf.div(h, 2));
      return tf.concat([y1, x1, y2, x2], 1) as tf.Tensor2D;
    });
  }, []);

  useEffect(() => {
    const setup = async () => {
      try {
        setLoading(true);
        await tf.ready();
        const modelUrl = 'https://raw.githubusercontent.com/Hyun-Sang/yolov8n-tfjs/main/model/model.json';
        const loadedModel = await tf.loadGraphModel(modelUrl);
        setModel(loadedModel);

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 60 } },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }
        setLoading(false);
      } catch (err: any) {
        setIsSimulating(true);
        setLoading(false);
        simTargets.current = [
          { x: 0.35, y: 0.45, vx: 0.002, vy: 0.001, label: 'ENEMY_ASSET_A' },
          { x: 0.65, y: 0.55, vx: -0.0015, vy: -0.002, label: 'ENEMY_ASSET_B' }
        ];
      }
    };

    setup();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!profile.accessibility.yoloEnabled) {
      setAiTarget(null);
      return;
    }

    const detect = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const start = performance.now();
      const inputSize = 640;
      let detections: { boxes: number[][], scores: number[], classes: number[], labels?: string[] } = { boxes: [], scores: [], classes: [] };

      if (model && !isSimulating && video && video.readyState === 4) {
        detections = tf.tidy(() => {
          const img = tf.browser.fromPixels(video);
          const resized = tf.image.resizeBilinear(img, [inputSize, inputSize]);
          const expanded = resized.expandDims(0);
          const normalized = expanded.div(255.0);

          const output = model.predict(normalized) as tf.Tensor;
          const res = output.squeeze([0]); 
          const transposed = res.transpose([1, 0]); 

          const [boxes, scores] = tf.split(transposed, [4, 80], 1);
          const maxScores = scores.max(1);
          const classes = scores.argMax(1);

          const nmsIndices = tf.image.nonMaxSuppression(
            convertCenterToCorners(boxes),
            maxScores as tf.Tensor1D,
            12,
            0.45,
            profile.accessibility?.yoloConfidence || 0.5
          );

          return {
            boxes: boxes.gather(nmsIndices).arraySync() as number[][],
            scores: maxScores.gather(nmsIndices).arraySync() as number[],
            classes: classes.gather(nmsIndices).arraySync() as number[]
          };
        });
      } else if (isSimulating) {
        detections.labels = [];
        simTargets.current.forEach(t => {
          t.x += t.vx; t.y += t.vy;
          if (t.x < 0.1 || t.x > 0.9) t.vx *= -1;
          if (t.y < 0.15 || t.y > 0.85) t.vy *= -1;
          detections.boxes.push([t.x * inputSize, t.y * inputSize, 60, 90]);
          detections.scores.push(0.96 + Math.random() * 0.03);
          detections.classes.push(0); 
          detections.labels?.push(t.label);
        });
      }

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (video && video.readyState === 4) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else {
        // High-tech Grid
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
        ctx.lineWidth = 1;
        for(let x=0; x<canvas.width; x+=50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
        for(let y=0; y<canvas.height; y+=50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
      }

      const time = performance.now() / 1000;
      let activeTargetFound = false;

      // Render Engagement Perimeter
      if (profile.accessibility.aimSlowdownEnabled) {
         ctx.beginPath();
         ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width * 0.14, 0, Math.PI * 2);
         ctx.setLineDash([12, 6]);
         ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
         ctx.stroke();
         ctx.setLineDash([]);
         ctx.fillStyle = 'rgba(59, 130, 246, 0.02)';
         ctx.fill();
      }

      if (profile.accessibility.combatHudEnabled) {
        let bestTarget = null;
        let bestDist = Infinity;
        let targetsToDraw: any[] = [];

        detections.boxes.forEach((box, i) => {
          const [cx, cy, w, h] = box;
          const score = detections.scores[i];
          const classIdx = detections.classes[i];
          const className = detections.labels ? detections.labels[i] : (CLASSES[classIdx] || 'Target');

          const normCX = cx / inputSize;
          const normCY = cy / inputSize;
          const dist = Math.sqrt(Math.pow(normCX - 0.5, 2) + Math.pow(normCY - 0.5, 2));
          
          targetsToDraw.push({ cx, cy, w, h, score, className, normCX, normCY, dist });

          if (dist < bestDist && score > (profile.accessibility.yoloConfidence || 0.5)) {
            bestDist = dist;
            bestTarget = { x: normCX, y: normCY };
          }
        });

        targetsToDraw.forEach(t => {
          const x = (t.cx - t.w / 2) * (canvas.width / inputSize);
          const y = (t.cy - t.h / 2) * (canvas.height / inputSize);
          const width = t.w * (canvas.width / inputSize);
          const height = t.h * (canvas.height / inputSize);
          const isBest = t.normCX === bestTarget?.x && t.normCY === bestTarget?.y;
          if (isBest) activeTargetFound = true;

          const baseColor = isBest ? '#f43f5e' : '#a855f7';
          const power = profile.accessibility.yoloTrackingPower;

          ctx.shadowBlur = isBest ? 25 : 10;
          ctx.shadowColor = baseColor;
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = isBest ? 3 : 1;
          if (!isBest) ctx.setLineDash([5, 5]);
          ctx.strokeRect(x, y, width, height);
          ctx.setLineDash([]);
          
          if (isBest) {
            // Intercept Tether
            ctx.beginPath();
            ctx.moveTo(canvas.width/2, canvas.height/2);
            ctx.lineTo(x + width/2, y + height/2);
            ctx.strokeStyle = `rgba(244, 63, 94, ${0.2 + (power/300)})`;
            ctx.setLineDash([5, 10]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Locking Rings
            const ringS = 1 + Math.sin(time * 8) * 0.08;
            ctx.beginPath();
            ctx.ellipse(x + width/2, y + height/2, (width/1.8) * ringS, (height/1.8) * ringS, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Bracket Corners
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x, y + 20); ctx.lineTo(x, y); ctx.lineTo(x + 20, y);
          ctx.moveTo(x + width - 20, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + 20);
          ctx.moveTo(x + width, y + height - 20); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width - 20, y + height);
          ctx.moveTo(x + 20, y + height); ctx.lineTo(x, y + height); ctx.lineTo(x, y + height - 20);
          ctx.stroke();

          // Data Label
          ctx.fillStyle = baseColor;
          ctx.fillRect(x, y - 28, 130, 28);
          ctx.fillStyle = '#fff';
          ctx.font = 'black 11px JetBrains Mono';
          ctx.fillText(`${t.className.toUpperCase()}`, x + 10, y - 10);
          ctx.font = '8px JetBrains Mono';
          ctx.fillText(`${Math.round(t.score * 100)}% LCK`, x + 95, y - 10);
          
          ctx.shadowBlur = 0;
        });

        setAiTarget(bestTarget);
      }

      // Dynamic Central Reticle (Production Refinement)
      const reticleColor = activeTargetFound ? '#f43f5e' : 'rgba(255, 255, 255, 0.5)';
      const reticleSize = activeTargetFound ? (8 + Math.sin(time * 12) * 2) : 12;
      ctx.strokeStyle = reticleColor;
      ctx.lineWidth = activeTargetFound ? 3 : 1;
      ctx.beginPath();
      // Crosshair lines
      ctx.moveTo(canvas.width/2 - reticleSize - 5, canvas.height/2); ctx.lineTo(canvas.width/2 - 4, canvas.height/2);
      ctx.moveTo(canvas.width/2 + 4, canvas.height/2); ctx.lineTo(canvas.width/2 + reticleSize + 5, canvas.height/2);
      ctx.moveTo(canvas.width/2, canvas.height/2 - reticleSize - 5); ctx.lineTo(canvas.width/2, canvas.height/2 - 4);
      ctx.moveTo(canvas.width/2, canvas.height/2 + 4); ctx.lineTo(canvas.width/2, canvas.height/2 + reticleSize + 5);
      ctx.stroke();
      
      if (activeTargetFound) {
         ctx.beginPath();
         ctx.arc(canvas.width/2, canvas.height/2, 2, 0, Math.PI * 2);
         ctx.fillStyle = '#f43f5e';
         ctx.fill();
      }

      const end = performance.now();
      setInferenceTime(Math.round(end - start));
      setFps(Math.round(1000 / (end - start)));
      requestRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, [model, isSimulating, profile.accessibility.yoloEnabled, profile.accessibility.yoloTrackingPower, profile.accessibility.yoloConfidence, profile.accessibility.combatHudEnabled, profile.accessibility.aimSlowdownEnabled, convertCenterToCorners, setAiTarget]);

  return (
    <div className="relative w-full aspect-video glass rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden bg-black group">
      <video ref={videoRef} className="hidden" />
      <canvas ref={canvasRef} width={800} height={450} className="w-full h-full block opacity-95 transition-opacity duration-500" />
      
      <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between z-20">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-3xl ${profile.accessibility.yoloEnabled ? 'bg-purple-600/30 shadow-[0_0_50px_rgba(168,85,247,0.4)]' : 'bg-slate-800/50'}`}>
              <BrainCircuit className={`w-10 h-10 ${profile.accessibility.yoloEnabled ? 'text-purple-400 animate-pulse' : 'text-slate-600'}`} />
            </div>
            <div className="mt-1">
              <p className="text-[16px] font-black text-white uppercase tracking-[0.6em] text-shadow-xl">1Man1Machine by killBill2</p>
              <div className="flex items-center gap-3 mt-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${isSimulating ? 'bg-amber-500 shadow-[0_0_15px_#f59e0b]' : 'bg-green-500 shadow-[0_0_15px_#22c55e]'} animate-pulse`} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                  M1M_PROTOCOL: {isSimulating ? 'SIM_ACTIVE' : (model ? 'KERNEL_ACTIVE' : 'IDLE')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-950/80 backdrop-blur-3xl px-8 py-5 rounded-3xl border border-white/10 flex gap-12 shadow-2xl">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Inference</span>
              <span className="text-[18px] font-black text-blue-400 font-mono">{inferenceTime}ms</span>
            </div>
            <div className="w-px h-12 bg-white/10 self-center" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Pipeline</span>
              <span className="text-[18px] font-black text-green-400 font-mono">{fps}Hz</span>
            </div>
          </div>
        </div>

        {profile.accessibility.yoloEnabled && (
          <div className="absolute top-1/2 right-12 -translate-y-1/2 flex flex-col items-center gap-6">
             <div className="h-64 w-3 bg-slate-950 rounded-full border border-white/10 relative overflow-hidden shadow-inner">
                <div 
                  className="absolute bottom-0 left-0 w-full bg-purple-500 shadow-[0_0_30px_rgba(168,85,247,1)] transition-all duration-500" 
                  style={{ height: `${profile.accessibility.yoloTrackingPower}%` }}
                />
                <div className="absolute inset-0 flex flex-col justify-between py-2 opacity-30">
                  {[...Array(12)].map((_, i) => <div key={i} className="w-full h-px bg-white" />)}
                </div>
             </div>
             <div className="flex flex-col items-center">
               <Zap className={`w-5 h-5 transition-colors ${profile.accessibility.yoloTrackingPower > 75 ? 'text-purple-400 animate-pulse' : 'text-slate-700'}`} />
               <span className="text-[9px] font-black text-slate-500 uppercase mt-2 tracking-widest">Vector Force</span>
             </div>
          </div>
        )}

        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-5">
             <div className="flex items-center gap-4 px-7 py-5 bg-red-600/10 rounded-3xl border border-red-500/30 backdrop-blur-3xl shadow-2xl">
                <Target className="w-8 h-8 text-red-500 animate-pulse" />
                <div>
                  <span className="text-[14px] font-black text-white uppercase tracking-[0.3em] block leading-none">Neural Lock by killBill2</span>
                  <span className="text-[10px] font-black text-red-400/50 uppercase tracking-widest mt-1.5">M1M_ACQUISITION_MATRIX OPERATIONAL</span>
                </div>
             </div>
             {profile.accessibility.aimSlowdownEnabled && (
               <div className="flex items-center gap-3 px-6 py-4 bg-blue-500/10 rounded-2xl border border-blue-500/30 backdrop-blur-xl">
                 <Scan className="w-5 h-5 text-blue-400" />
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Slowdown Perimeter Active</span>
               </div>
             )}
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-3">
               <MousePointer2 className="w-4 h-4 text-slate-600" />
               <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.5em]">Protocol: <span className="text-slate-300">1M1M-PRO-BY-KILLBILL2</span></p>
            </div>
            <div className="w-72 h-3 bg-slate-950 rounded-full overflow-hidden border border-white/10 relative">
               <div className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,1)] animate-[progress_2s_ease-in-out_infinite]" style={{width: '35%'}} />
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
          <div className="relative">
            <Loader2 className="w-28 h-28 text-blue-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Boxes className="w-12 h-12 text-blue-400 opacity-60" />
            </div>
          </div>
          <h3 className="text-[20px] font-black text-white uppercase tracking-[0.8em] mt-16 animate-pulse">Initializing 1Man1Machine...</h3>
          <p className="text-[11px] text-slate-600 uppercase mt-5 tracking-[0.5em] font-bold">Neural core by killBill2 v3.2</p>
        </div>
      )}
    </div>
  );
};
