import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGamepad } from './GamepadProvider';
import { Profile } from '../types';
import { BrainCircuit, Camera, Monitor, Zap, Gauge } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';

const MODEL_MIRRORS = ['https://cdn.jsdelivr.net/gh/Hyuto/yolov8-tfjs@master/model/yolov8n_web_model/model.json'];

interface CombatOverlayProps {
  profile: Profile;
  onUpdateProfile?: (updates: Partial<Profile>) => void;
}

export const CombatOverlay: React.FC<CombatOverlayProps> = ({ profile, onUpdateProfile }) => {
  const { setAiTarget } = useGamepad();
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
  const lastTargetTimeRef = useRef<number>(0);

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
            const files = Array.from(event.target.files) as File[];
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

               const now = performance.now();
               
               // HYSTERESIS LOGIC:
               // Check if we have a valid history target from < 600ms ago (short memory)
               const hasHistory = lastTargetRef.current && (now - lastTargetTimeRef.current < 600);

               detections.boxes.forEach((box, i) => {
                  if (detections.scores[i] < (profile.accessibility.yoloConfidence || 0.5)) return;
                  const [cx, cy] = box;
                  // Normalized center coordinates (0-1)
                  const nx = cx / 640;
                  const ny = cy / 640;
                  
                  // 1. Centrality Score: Proximity to crosshair (0.5, 0.5)
                  // Lower distance = Higher Base Score
                  const distToCenter = Math.sqrt(Math.pow(nx - 0.5, 2) + Math.pow(ny - 0.5, 2));
                  
                  let historyBonus = 0;
                  if (hasHistory && lastTargetRef.current) {
                      // 2. Consistency Score: Proximity to previous target
                      const distToHistory = Math.sqrt(Math.pow(nx - lastTargetRef.current.x, 2) + Math.pow(ny - lastTargetRef.current.y, 2));
                      
                      // If this candidate is within 15% screen distance of the last locked target, boost it significantly.
                      // This makes the lock "sticky".
                      if (distToHistory < 0.15) {
                          historyBonus = 0.4; // Strong sticky bias
                      }
                  }

                  // Final Score Algorithm: (Inverted Distance) + Bonus
                  const score = (1.0 - distToCenter) + historyBonus;

                  if (score > bestScore) {
                      bestScore = score;
                      bestTarget = { x: nx, y: ny };
                      lockedIndex = i;
                  }
               });

               // Update history if we found a valid target
               if (bestTarget) {
                   lastTargetRef.current = bestTarget;
                   lastTargetTimeRef.current = now;
               }

               setAiTarget(bestTarget);

               // Rendering Logic
               detections.boxes.forEach((box, i) => {
                  if (detections.scores[i] < (profile.accessibility.yoloConfidence || 0.5)) return;
                  
                  const [cx, cy, w, h] = box;
                  // Convert model coords (640x640) to canvas coords
                  const x1 = (cx - w / 2) * (canvas.width / 640);
                  const y1 = (cy - h / 2) * (canvas.height / 640);
                  const rw = w * (canvas.width / 640);
                  const rh = h * (canvas.height / 640);

                  if (i === lockedIndex) {
                      // Locked Target Visuals
                      ctx.shadowColor = '#06b6d4'; // Cyan Glow
                      ctx.shadowBlur = 15;
                      ctx.strokeStyle = '#06b6d4';
                      ctx.lineWidth = 3;
                      ctx.strokeRect(x1, y1, rw, rh);
                      ctx.shadowBlur = 0;

                      // Score Label
                      const score = (detections.scores[i] * 100).toFixed(0);
                      ctx.fillStyle = '#06b6d4';
                      const label = `LOCKED ${score}%`;
                      const textMetrics = ctx.measureText(label);
                      const bgWidth = textMetrics.width + 12;
                      
                      ctx.fillRect(x1, y1 - 22, bgWidth, 22);
                      ctx.fillStyle = '#000';
                      ctx.font = 'bold 12px monospace';
                      ctx.fillText(label, x1 + 6, y1 - 6);

                      // Vector Line to Center (Visualizing the "Pull")
                      ctx.beginPath();
                      ctx.moveTo(canvas.width / 2, canvas.height / 2);
                      ctx.lineTo(x1 + rw / 2, y1 + rh / 2);
                      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
                      ctx.setLineDash([5, 5]); 
                      ctx.lineWidth = 1;
                      ctx.stroke();
                      ctx.setLineDash([]); 

                  } else if (profile.accessibility.visualIndicatorsEnabled) {
                      // Candidate Visuals
                      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // Faint Red
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
  }, [model, profile.accessibility.yoloEnabled, profile.accessibility.visualIndicatorsEnabled, profile.accessibility.yoloConfidence]);

  const startStream = async (mode: 'SCREEN' | 'CAMERA') => {
    try {
      let stream;
      if (mode === 'SCREEN') stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 60 } });
      else stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setSourceMode(mode);
    } catch (e) { setError("Stream Failed"); }
  };

  const updateTurboSettings = (enabled: boolean, rate?: number) => {
    if (onUpdateProfile) {
        onUpdateProfile({
            accessibility: {
                ...profile.accessibility,
                rapidFireEnabled: enabled,
                globalTurboRate: rate ?? profile.accessibility.globalTurboRate
            }
        });
    }
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

        {/* FIRE CONTROL HUD (Bottom Left) */}
        {!loading && !error && (
            <div className="pointer-events-auto absolute bottom-10 left-10 flex flex-col gap-3 transition-opacity duration-300 opacity-80 hover:opacity-100 bg-slate-950/80 backdrop-blur-md p-4 rounded-[2rem] border border-white/5">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => updateTurboSettings(!profile.accessibility.rapidFireEnabled)}
                        className={`p-3 rounded-xl transition-all ${profile.accessibility.rapidFireEnabled ? 'bg-yellow-500/20 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-slate-800 text-slate-500'}`}
                    >
                        <Zap className="w-5 h-5" />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Fire Control</p>
                        <p className={`text-[8px] font-bold uppercase tracking-widest ${profile.accessibility.rapidFireEnabled ? 'text-yellow-500' : 'text-slate-600'}`}>
                            {profile.accessibility.rapidFireEnabled ? 'RAPID_FIRE [ACTIVE]' : 'MANUAL_MODE'}
                        </p>
                    </div>
                </div>
                
                {profile.accessibility.rapidFireEnabled && (
                    <div className="flex items-center gap-3 px-1 animate-in slide-in-from-left-2">
                        <Gauge className="w-4 h-4 text-slate-500" />
                        <div className="flex-1 w-32">
                             <input 
                                type="range" 
                                min="5" max="60" step="1"
                                value={profile.accessibility.globalTurboRate}
                                onChange={(e) => updateTurboSettings(true, parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-yellow-500"
                             />
                        </div>
                        <span className="text-[9px] font-mono font-black text-yellow-500 w-8 text-right">
                            {profile.accessibility.globalTurboRate}Hz
                        </span>
                    </div>
                )}
            </div>
        )}

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