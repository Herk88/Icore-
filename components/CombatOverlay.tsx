import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGamepad } from './GamepadProvider';
import { Profile } from '../types';
import { BrainCircuit, Camera, Monitor } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';

const MODEL_MIRRORS = ['https://cdn.jsdelivr.net/gh/Hyuto/yolov8-tfjs@master/model/yolov8n_web_model/model.json'];

export const CombatOverlay: React.FC<{ profile: Profile }> = ({ profile }) => {
  const { setAiTarget, state } = useGamepad();
  const stateRef = useRef(state);
  
  // Sync state for the animation loop
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inferenceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMounted = useRef(true);

  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsDownload, setNeedsDownload] = useState(false);
  const [inferenceTime, setInferenceTime] = useState(0);
  const [fps, setFps] = useState(0);
  const [sourceMode, setSourceMode] = useState<'SCREEN' | 'CAMERA'>('SCREEN');
  const [error, setError] = useState<string | null>(null);
  
  const currentDetectionsRef = useRef<{ boxes: number[][], scores: number[], classes: number[] } | null>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const lastInferenceRef = useRef<number>(0);
  const isInferringRef = useRef(false);

  // Sticky Targeting State
  const lastTargetRef = useRef<{x: number, y: number} | null>(null);

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
            const hasJson = files.some((f: any) => f.name.toLowerCase().endsWith('.json'));
            const hasBin = files.some((f: any) => f.name.toLowerCase().endsWith('.bin'));
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
               
               let bestTarget = null;
               let bestScore = -Infinity;
               let lockedIndex = -1;

               // Engagement Logic: Check L2 (6) or R2 (7)
               const buttons = stateRef.current.buttons;
               const isEngaged = buttons[6] || buttons[7]; 

               // Hysteresis Parameters
               // If engaged, we stick much harder to the target
               const STICKY_BONUS = isEngaged ? 2.5 : 0.8; 
               const SAME_TARGET_RADIUS = isEngaged ? 0.3 : 0.15; // normalized distance

               detections.boxes.forEach((box, i) => {
                  const score = detections.scores[i];
                  const threshold = profile.accessibility.yoloConfidence || 0.5;
                  if (score < threshold) return;

                  const [cx, cy] = box;
                  // Normalize 0-1
                  const nx = cx / 640;
                  const ny = cy / 640;
                  
                  // Base score: Proximity to crosshair (0.5, 0.5)
                  const distToCenter = Math.sqrt(Math.pow(nx - 0.5, 2) + Math.pow(ny - 0.5, 2));
                  let calculatedScore = (1.0 - distToCenter); 

                  // Apply Hysteresis (Sticky Targeting)
                  if (lastTargetRef.current) {
                      const distToLast = Math.sqrt(Math.pow(nx - lastTargetRef.current.x, 2) + Math.pow(ny - lastTargetRef.current.y, 2));
                      if (distToLast < SAME_TARGET_RADIUS) {
                          calculatedScore += STICKY_BONUS;
                      }
                  }

                  if (calculatedScore > bestScore) {
                      bestScore = calculatedScore;
                      bestTarget = { x: nx, y: ny };
                      lockedIndex = i;
                  }
               });

               // Smoothing & State Update
               if (bestTarget) {
                   if (lastTargetRef.current) {
                       // Low-pass filter to reduce jitter
                       const alpha = isEngaged ? 0.4 : 0.7; // Lower alpha = more smoothing (heavier feel)
                       bestTarget.x = bestTarget.x * alpha + lastTargetRef.current.x * (1 - alpha);
                       bestTarget.y = bestTarget.y * alpha + lastTargetRef.current.y * (1 - alpha);
                   }
                   lastTargetRef.current = bestTarget;
               } else {
                   // Immediate clear or decay? For now immediate clear to prevent ghosting
                   lastTargetRef.current = null;
               }
               
               setAiTarget(bestTarget);

               // Rendering Logic
               detections.boxes.forEach((box, i) => {
                  const score = detections.scores[i];
                  if (score < (profile.accessibility.yoloConfidence || 0.5)) return;
                  
                  const [cx, cy, w, h] = box;
                  const x1 = (cx - w / 2) * (canvas.width / 640);
                  const y1 = (cy - h / 2) * (canvas.height / 640);
                  const rw = w * (canvas.width / 640);
                  const rh = h * (canvas.height / 640);

                  if (i === lockedIndex) {
                      // Locked Target Visuals
                      const color = isEngaged ? '#ef4444' : '#06b6d4'; // Red vs Cyan
                      ctx.shadowColor = color;
                      ctx.shadowBlur = isEngaged ? 25 : 15;
                      ctx.strokeStyle = color;
                      ctx.lineWidth = isEngaged ? 4 : 2;
                      
                      // Bracket Style
                      const bracketLen = Math.min(rw, rh) * 0.3;
                      ctx.beginPath();
                      ctx.moveTo(x1, y1 + bracketLen); ctx.lineTo(x1, y1); ctx.lineTo(x1 + bracketLen, y1);
                      ctx.moveTo(x1 + rw - bracketLen, y1); ctx.lineTo(x1 + rw, y1); ctx.lineTo(x1 + rw, y1 + bracketLen);
                      ctx.moveTo(x1 + rw, y1 + rh - bracketLen); ctx.lineTo(x1 + rw, y1 + rh); ctx.lineTo(x1 + rw - bracketLen, y1 + rh);
                      ctx.moveTo(x1 + bracketLen, y1 + rh); ctx.lineTo(x1, y1 + rh); ctx.lineTo(x1, y1 + rh - bracketLen);
                      ctx.stroke();

                      // Label
                      ctx.shadowBlur = 0;
                      ctx.fillStyle = color;
                      const label = `${isEngaged ? 'ENGAGED' : 'LOCKED'} ${(score * 100).toFixed(0)}%`;
                      ctx.font = 'bold 12px monospace';
                      const metrics = ctx.measureText(label);
                      ctx.fillRect(x1, y1 - 22, metrics.width + 10, 22);
                      ctx.fillStyle = '#000';
                      ctx.fillText(label, x1 + 5, y1 - 6);

                      // Vector Line
                      if (isEngaged) {
                          ctx.beginPath();
                          ctx.moveTo(canvas.width/2, canvas.height/2);
                          ctx.lineTo(x1 + rw/2, y1 + rh/2);
                          ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
                          ctx.lineWidth = 1;
                          ctx.stroke();
                      }
                  } else if (profile.accessibility.visualIndicatorsEnabled) {
                      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                      ctx.lineWidth = 1;
                      ctx.strokeRect(x1, y1, rw, rh);
                  }
               });
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
    <div className="relative w-full aspect-video glass rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden bg-black group">
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
};