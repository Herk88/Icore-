
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGamepad } from './GamepadProvider';
import { Profile } from '../types';
import { Target, BrainCircuit, Loader2, Cpu, Scan, Monitor, Camera, HardDrive, AlertCircle } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';

export const CombatOverlay: React.FC<{ profile: Profile }> = ({ profile }) => {
  const { setAiTarget } = useGamepad();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [inferenceTime, setInferenceTime] = useState(0);
  const [fps, setFps] = useState(0);
  const [sourceMode, setSourceMode] = useState<'SCREEN' | 'CAMERA'>('SCREEN');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isModelCached, setIsModelCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Added initial value undefined to useRef to satisfy TypeScript requirements
  const requestRef = useRef<number | undefined>(undefined);
  const lastInferenceRef = useRef<number>(0);
  
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

  const startStream = async (mode: 'SCREEN' | 'CAMERA') => {
    try {
      setLoading(true);
      setError(null);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }

      let stream: MediaStream;
      if (mode === 'SCREEN') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 60 } },
          audio: false
        }).catch(() => {
            throw new Error("Display media denied");
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 60 } },
          audio: false
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setSourceMode(mode);
      setIsSimulating(false);
      setLoading(false);
    } catch (err) {
      console.warn("[NEURAL] Local stream unavailable, activating simulation matrix.");
      setIsSimulating(true);
      setLoading(false);
      if (simTargets.current.length === 0) {
        simTargets.current = [
          { x: 0.35, y: 0.45, vx: 0.002, vy: 0.001, label: 'SIM_UNIT_01' },
          { x: 0.65, y: 0.55, vx: -0.0015, vy: -0.002, label: 'SIM_UNIT_02' }
        ];
      }
    }
  };

  useEffect(() => {
    const initModel = async () => {
      await tf.ready();
      const modelUrl = 'https://cdn.jsdelivr.net/gh/andrey-bashanov/yolov8-tfjs@main/model/yolov8n_web_model/model.json';
      const localModelPath = 'indexeddb://yolov8n-m1m-cache';

      try {
        setLoading(true);
        let loadedModel: tf.GraphModel | null = null;
        
        try {
          loadedModel = await tf.loadGraphModel(localModelPath);
          setIsModelCached(true);
        } catch (e) {
          loadedModel = await tf.loadGraphModel(modelUrl);
          try {
            await loadedModel.save(localModelPath);
            setIsModelCached(true);
          } catch (saveErr) {}
        }
        
        if (loadedModel) {
            setModel(loadedModel);
            await startStream('SCREEN');
        }
      } catch (err: any) {
        setError(`LINK_FAIL: Remote Repository Unreachable. Kernel Simulation Engaged.`);
        setIsSimulating(true);
        setLoading(false);
        if (simTargets.current.length === 0) {
            simTargets.current = [
              { x: 0.2, y: 0.3, vx: 0.001, vy: 0.0012, label: 'SIM_TARGET_01' },
              { x: 0.8, y: 0.7, vx: -0.001, vy: -0.0008, label: 'SIM_TARGET_02' }
            ];
        }
        await startStream('SCREEN');
      }
    };
    initModel();
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
      const now = performance.now();
      if (now - lastInferenceRef.current < 32 && !isSimulating) {
        requestRef.current = requestAnimationFrame(detect);
        return;
      }
      lastInferenceRef.current = now;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const inputSize = 640;
      let detections: { boxes: number[][], scores: number[], classes: number[] } = { boxes: [], scores: [], classes: [] };

      const startInference = performance.now();

      if (model && !isSimulating && video && video.readyState === 4) {
        try {
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
                12, 0.45,
                profile.accessibility?.yoloConfidence || 0.5
              );
              return {
                boxes: boxes.gather(nmsIndices).arraySync() as number[][],
                scores: maxScores.gather(nmsIndices).arraySync() as number[],
                classes: classes.gather(nmsIndices).arraySync() as number[]
              };
            });
        } catch (e) {
            console.warn("[NEURAL] Runtime inference error:", e);
        }
      } else if (isSimulating) {
        simTargets.current.forEach(t => {
          t.x += t.vx; t.y += t.vy;
          if (t.x < 0.1 || t.x > 0.9) t.vx *= -1;
          if (t.y < 0.15 || t.y > 0.85) t.vy *= -1;
          detections.boxes.push([t.x * inputSize, t.y * inputSize, 60, 90]);
          detections.scores.push(0.95 + Math.random() * 0.04);
          detections.classes.push(0); 
        });
      }

      ctx.drawImage(video && video.readyState === 4 ? video : canvas, 0, 0, canvas.width, canvas.height);
      
      const scanY = (now % 2500) / 2500 * canvas.height;
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(canvas.width, scanY); ctx.stroke();

      let bestTarget = null;
      let bestDist = Infinity;

      // Draw Center Crosshair with Glow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Slowdown Zone Indicator
      if (profile.accessibility.aimSlowdownEnabled) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width * 0.1, 0, Math.PI * 2);
        ctx.stroke();
      }

      detections.boxes.forEach((box, i) => {
        const [cx, cy, w, h] = box;
        const score = detections.scores[i];
        if (detections.classes[i] !== 0) return;

        const normCX = cx / inputSize;
        const normCY = cy / inputSize;
        const dist = Math.sqrt(Math.pow(normCX - 0.5, 2) + Math.pow(normCY - 0.5, 2));
        
        const isBest = dist < bestDist && score > (profile.accessibility.yoloConfidence || 0.5);
        if (isBest) {
          bestDist = dist;
          bestTarget = { x: normCX, y: normCY };
        }

        if (profile.accessibility.visualIndicatorsEnabled) {
          const x = (cx - w / 2) * (canvas.width / inputSize);
          const y = (cy - h / 2) * (canvas.height / inputSize);
          const width = w * (canvas.width / inputSize);
          const height = h * (canvas.height / inputSize);
          const color = isBest ? '#f43f5e' : '#a855f7';

          ctx.strokeStyle = color;
          ctx.lineWidth = isBest ? 2 : 1;
          ctx.strokeRect(x, y, width, height);
          
          if (isBest) {
            // Visualize tracking pull strength
            const pullPower = profile.accessibility.yoloTrackingPower;
            ctx.setLineDash([2, 4]);
            ctx.strokeStyle = `rgba(244, 63, 94, ${0.3 + (pullPower/100) * 0.7})`;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, canvas.height / 2);
            ctx.lineTo(x + width/2, y + height/2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Pulse on target when snapped/hovering
            if (dist < 0.1) {
              ctx.beginPath();
              ctx.arc(canvas.width / 2, canvas.height / 2, 10 + Math.sin(now/100) * 5, 0, Math.PI * 2);
              ctx.strokeStyle = '#f43f5e';
              ctx.stroke();
            }
          }
        }
      });

      setAiTarget(bestTarget);
      const endInference = performance.now();
      setInferenceTime(Math.round(endInference - startInference));
      setFps(Math.round(1000 / (endInference - (lastInferenceRef.current || now))));
      requestRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, [model, isSimulating, profile.accessibility.yoloEnabled, profile.accessibility.visualIndicatorsEnabled, profile.accessibility.aimSlowdownEnabled, profile.accessibility.yoloTrackingPower, setAiTarget]);

  return (
    <div className="relative w-full aspect-video glass rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden bg-black">
      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} width={800} height={450} className="w-full h-full block opacity-95 grayscale-[0.2] contrast-125" />
      
      <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between z-20">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-3xl ${profile.accessibility.yoloEnabled ? 'bg-purple-600/30' : 'bg-slate-800/50'}`}>
              <BrainCircuit className={`w-10 h-10 ${profile.accessibility.yoloEnabled ? 'text-purple-400 animate-pulse' : 'text-slate-600'}`} />
            </div>
            <div>
              <p className="text-[16px] font-black text-white uppercase tracking-[0.6em]">NEURAL_INTERCEPT</p>
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                  {isSimulating ? 'SIM_EMULATION' : sourceMode} | {fps}FPS | {inferenceTime}MS
                </p>
                {isModelCached && !isSimulating && (
                  <div className="flex items-center gap-1 text-[8px] text-green-500/60 font-black tracking-widest uppercase">
                    <HardDrive className="w-3 h-3" /> Local_VRAM_Link
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-4 pointer-events-auto">
             <button onClick={() => startStream('SCREEN')} className={`p-4 rounded-2xl border transition-all ${sourceMode === 'SCREEN' && !isSimulating ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-900 text-slate-500'}`}><Monitor className="w-6 h-6" /></button>
             <button onClick={() => startStream('CAMERA')} className={`p-4 rounded-2xl border transition-all ${sourceMode === 'CAMERA' && !isSimulating ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-900 text-slate-500'}`}><Camera className="w-6 h-6" /></button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center z-50">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
          <div className="mt-8 space-y-2 text-center">
            <h3 className="text-[12px] font-black text-white uppercase tracking-[0.5em] animate-pulse">Establishing Link...</h3>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Verifying Neural Repository Integrity</p>
          </div>
        </div>
      )}
    </div>
  );
};
