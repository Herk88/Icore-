import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGamepad } from './GamepadProvider';
import { Profile, AccessibilitySettings } from '../types';
import { Target, BrainCircuit, Loader2, Cpu, Scan, Monitor, Camera, HardDrive, AlertCircle, Database, Check, Wifi, ServerCrash, Download, CloudDownload, Trash2, ChevronDown, FolderOpen, FileCode, Terminal, Settings, Gauge, Zap, AppWindow, Square } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';

// Verified Mirrors for YOLOv8n Web Model
const MODEL_MIRRORS = [
  // Mirror 1: jsDelivr (CDN - High Speed)
  'https://cdn.jsdelivr.net/gh/Hyuto/yolov8-tfjs@master/model/yolov8n_web_model/model.json',
  // Mirror 2: GitHub Pages (High Availability)
  'https://yqlbu.github.io/yolov8-tfjs-demo/model/yolov8n_web_model/model.json',
  // Mirror 3: Raw GitHub (Fallback)
  'https://raw.githubusercontent.com/Hyuto/yolov8-tfjs/master/model/yolov8n_web_model/model.json'
];

interface CombatOverlayProps {
  profile: Profile;
  onUpdateProfile: (updates: Partial<Profile>) => void;
}

export const CombatOverlay: React.FC<CombatOverlayProps> = ({ profile, onUpdateProfile }) => {
  const { setAiTarget, state } = useGamepad();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);
  
  // Offscreen canvas for fast pixel reading (Performance Optimization)
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // Dedicated canvas for resizing input to 640x640 before Tensor conversion
  const inferenceCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Neural Core...');
  const [needsDownload, setNeedsDownload] = useState(false);
  const [inferenceTime, setInferenceTime] = useState(0);
  const [fps, setFps] = useState(0);
  const [sourceMode, setSourceMode] = useState<'SCREEN' | 'WINDOW' | 'CAMERA'>('SCREEN');
  const [isModelCached, setIsModelCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeMirrorIndex, setActiveMirrorIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);

  // New State for Model Info Display
  const [activeModelName, setActiveModelName] = useState<string>('Unloaded');
  const [activeModelSource, setActiveModelSource] = useState<'CACHE' | 'STREAM' | 'LOCAL'>('CACHE');
  
  // Capture System State
  const [captureStats, setCaptureStats] = useState({ total: 0, lastReason: 'IDLE', storageUsage: 0 });
  const lastCaptureTimeRef = useRef<number>(0);
  const currentDetectionsRef = useRef<{ boxes: number[][], scores: number[], classes: number[] } | null>(null);

  const requestRef = useRef<number | undefined>(undefined);
  const lastInferenceRef = useRef<number>(0);
  const isInferringRef = useRef(false); // Track async inference state
  
  // Initialize offscreen canvases
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 50; // Low res for fast analysis
    canvas.height = 50;
    analysisCanvasRef.current = canvas;

    const infCanvas = document.createElement('canvas');
    infCanvas.width = 640; // YOLOv8 Native Input
    infCanvas.height = 640;
    inferenceCanvasRef.current = infCanvas;

    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const updateAccess = (updates: Partial<AccessibilitySettings>) => {
    onUpdateProfile({ accessibility: { ...profile.accessibility, ...updates } });
  };

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

  const calculateImageQualityFast = (sourceCanvas: HTMLCanvasElement): { brightness: number, sharpness: number } => {
    const analysisCanvas = analysisCanvasRef.current;
    if (!analysisCanvas) return { brightness: 0, sharpness: 0 };

    const ctx = analysisCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { brightness: 0, sharpness: 0 };

    // Downsample for speed
    ctx.drawImage(sourceCanvas, 0, 0, analysisCanvas.width, analysisCanvas.height);
    
    const imageData = ctx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);
    const data = imageData.data;
    const width = analysisCanvas.width;
    const height = analysisCanvas.height;

    let brightnessSum = 0;
    const grayData = new Float32Array(width * height);

    // Calculate Brightness & Grayscale in one pass
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      brightnessSum += (r + g + b) / 3;
      grayData[i/4] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    const avgBrightness = brightnessSum / (width * height);

    // Laplacian Variance (Sharpness) on the small thumbnail
    let mean = 0;
    let variance = 0;
    let count = 0;

    // Convolve with 3x3 Laplacian kernel [[0,1,0],[1,-4,1],[0,1,0]]
    // Skip borders
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
         const idx = y * width + x;
         const laplacian = 
           grayData[idx - width] +      // Top
           grayData[idx - 1] +          // Left
           (grayData[idx] * -4) +       // Center
           grayData[idx + 1] +          // Right
           grayData[idx + width];       // Bottom
         
         mean += laplacian;
         variance += laplacian * laplacian;
         count++;
      }
    }
    
    mean /= count;
    variance = (variance / count) - (mean * mean);

    return { brightness: avgBrightness, sharpness: variance };
  };

  const processSporadicCapture = async () => {
    const config = profile.accessibility.trainingConfig;
    if (!config.enabled || !currentDetectionsRef.current || !canvasRef.current) return;

    const now = Date.now();
    if (now - lastCaptureTimeRef.current < config.minInterval) return;

    // 1. Evaluate Probability (Active Learning Logic)
    const detections = currentDetectionsRef.current;
    
    // Filter for Persons (Class 0) only
    const personIndices = detections.classes
      .map((c, i) => c === 0 ? i : -1)
      .filter(i => i !== -1);

    if (personIndices.length === 0) {
      if (isMounted.current) setCaptureStats(prev => ({...prev, lastReason: 'SKIP: No targets'}));
      return; 
    }

    const confidences = personIndices.map(i => detections.scores[i]);
    const hasLowConfidence = confidences.some(c => c < config.confidenceThreshold);
    const probability = hasLowConfidence ? config.probLowConfidence : config.probHighConfidence;

    if (Math.random() > probability) {
       if (isMounted.current) setCaptureStats(prev => ({...prev, lastReason: `SKIP: RNG (${(probability * 100).toFixed(0)}%)`}));
       return;
    }

    // 2. Image Quality Filters (Fast Path)
    const quality = calculateImageQualityFast(canvasRef.current);
    
    if (quality.brightness < config.minBrightness) {
      if (isMounted.current) setCaptureStats(prev => ({...prev, lastReason: 'SKIP: Too Dark'}));
      return;
    }
    
    // Sharpness check (Threshold adjusted for downsampled image, approx 50 is good for thumbnail)
    if (quality.sharpness < (config.minSharpness * 0.5)) { 
       if (isMounted.current) setCaptureStats(prev => ({...prev, lastReason: 'SKIP: Too Blurry'}));
       return;
    }

    // 3. Prepare Data for Export
    lastCaptureTimeRef.current = now;
    const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.9);
    const inputSize = 640; // YOLOv8 Standard Input Size

    // Format Labels for YOLO: <object-class> <x_center> <y_center> <width> <height>
    // NOTE: TFJS boxes from our model are [cx, cy, w, h] in PIXELS (relative to 640x640 input)
    // We must Normalize them to 0-1 range for the .txt file.
    const labels = personIndices.map(i => {
      const [cxRaw, cyRaw, wRaw, hRaw] = detections.boxes[i];
      
      const cx = cxRaw / inputSize;
      const cy = cyRaw / inputSize;
      const w = wRaw / inputSize;
      const h = hRaw / inputSize;

      // Clamp values to 0-1 to avoid training errors
      return `0 ${Math.max(0, Math.min(1, cx)).toFixed(6)} ${Math.max(0, Math.min(1, cy)).toFixed(6)} ${Math.max(0, Math.min(1, w)).toFixed(6)} ${Math.max(0, Math.min(1, h)).toFixed(6)}`;
    }).join('\n');

    const filename = `capture_${now}`;
    
    // 4. Send to Electron Bridge
    if (window.icoreBridge?.saveTrainingData) {
      const result = await window.icoreBridge.saveTrainingData({
        image: base64Image,
        labels: labels,
        filename: filename
      });
      
      if (isMounted.current) {
        if (result.success) {
          setCaptureStats(prev => ({
            total: prev.total + 1,
            lastReason: 'CAPTURED',
            storageUsage: Math.min(100, (prev.total + 1) / 10)
          }));
        } else {
          setCaptureStats(prev => ({...prev, lastReason: `ERR: ${result.reason}`}));
        }
      }
    }
  };

  const startStream = async (mode: 'SCREEN' | 'WINDOW' | 'CAMERA') => {
    try {
      if (isMounted.current) {
         setError(null);
         setShowSourceMenu(false); // Close menu on selection
      }
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }

      let stream: MediaStream;
      if (mode === 'SCREEN' || mode === 'WINDOW') {
        const displaySurface = mode === 'SCREEN' ? 'monitor' : 'window';
        // Note: displaySurface constraint is a hint. Browser may still show picker with multiple tabs.
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
             frameRate: { ideal: 60 },
             displaySurface: displaySurface 
          },
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
      if (isMounted.current) setSourceMode(mode);
    } catch (err) {
      console.error("[NEURAL] Stream failed:", err);
      if (isMounted.current) {
        setError("STREAM_FAIL: Check Permissions or Device Connection");
        setLoading(false);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleLocalFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
        if (isMounted.current) {
            setLoading(true);
            setLoadingMessage('Analyzing Neural Architecture...');
        }
        try {
            const files: File[] = Array.from(event.target.files);

            // COMPATIBILITY CHECK: Native YOLO Files (.pt / .onnx)
            const nativeFiles = files.filter(f => 
                f.name.toLowerCase().endsWith('.pt') || 
                f.name.toLowerCase().endsWith('.yaml') || 
                f.name.toLowerCase().endsWith('.onnx')
            );
            
            if (nativeFiles.length > 0) {
                // We handle this gracefully - User wants to test support
                if (isMounted.current) {
                    setLoading(false);
                    // Instead of crashing, we show a diagnostic warning
                    setError(`NATIVE_DETECTED: ${nativeFiles[0].name} loaded. Browser inference requires TFJS format.`);
                    // Clear input to allow re-selection
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }
            }

            // COMPLETENESS CHECK: Ensure model topology (.json) and weights (.bin) are present
            const hasJson = files.some(f => f.name.toLowerCase().endsWith('.json'));
            const hasBin = files.some(f => f.name.toLowerCase().endsWith('.bin'));

            if (!hasJson || !hasBin) {
                throw new Error("INCOMPLETE_MODEL: Selection must include 'model.json' AND weight files (.bin) together.");
            }

            // TFJS requires the model.json and the binary weights passed together as a set of files
            const model = await tf.loadGraphModel(tf.io.browserFiles(files));
            
            // Warmup
            if (isMounted.current) setLoadingMessage('Verifying Neural Integrity...');
            tf.tidy(() => model.predict(tf.zeros([1, 640, 640, 3])));
            
            if (isMounted.current) {
                setModel(model);
                setLoading(false);
                setNeedsDownload(false);
                setError(null);
                setIsModelCached(false); // Local models aren't auto-cached to IDB here for simplicity
                
                // Set metadata for UI
                const jsonFile = files.find(f => f.name.toLowerCase().endsWith('.json'));
                const simpleName = jsonFile ? jsonFile.name.replace('.json', '').replace(/[_-]/g, ' ').toUpperCase() : 'CUSTOM MODEL';
                setActiveModelName(simpleName);
                setActiveModelSource('LOCAL');

                setSuccessMsg("Local Neural Core Active");
                setTimeout(() => setSuccessMsg(null), 3000);
            }
        } catch (err: any) {
            console.error("Local Load Error:", err);
            if (isMounted.current) {
                const errorMessage = err.message || "LOCAL_LOAD_FAIL: Invalid Model Files (Select .json and .bin)";
                setError(errorMessage);
                setLoading(false);
            }
        } finally {
            // Ensure input is cleared so change event fires again if user picks same file
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }
  };

  const downloadAndInstallModel = async () => {
      if (isMounted.current) {
        setNeedsDownload(false);
        setLoading(true);
        setError(null);
      }
      
      const localModelPath = `indexeddb://yolo-nano-m1m-cache`;

      // Clean up previous attempts
      try {
        await tf.io.removeModel(localModelPath);
      } catch (e) { /* ignore */ }

      for (let i = 0; i < MODEL_MIRRORS.length; i++) {
        if (!isMounted.current) return;
        
        const url = MODEL_MIRRORS[i];
        try {
          setActiveMirrorIndex(i);
          setLoadingMessage(`Connecting to Mirror ${i + 1}...`);
          
          // Use a timestamp to bust cache if needed
          const fetchUrl = `${url}?t=${Date.now()}`;
          const loadedModel = await tf.loadGraphModel(fetchUrl, {
             onProgress: (p) => {
               if (isMounted.current) setLoadingMessage(`Downloading Data: ${(p * 100).toFixed(0)}%`);
             }
          });
          
          if (isMounted.current) setLoadingMessage('Verifying Neural Integrity...');
          // Warmup inference to check model validity
          tf.tidy(() => loadedModel.predict(tf.zeros([1, 640, 640, 3])));

          if (isMounted.current) setLoadingMessage('Installing to Local Storage...');
          try {
            await loadedModel.save(localModelPath);
            if (isMounted.current) {
                setIsModelCached(true);
                setActiveModelSource('CACHE');
            }
            console.log(`[NEURAL] Model successfully installed from Mirror ${i + 1}`);
          } catch (saveError) {
             console.warn("[NEURAL] Local storage failed (IndexedDB access denied?), using memory-only model.", saveError);
             if (isMounted.current) {
                 setIsModelCached(false);
                 setActiveModelSource('STREAM');
             }
          }
          
          if (isMounted.current) {
            setModel(loadedModel);
            setActiveModelName('YOLOv8n (Official)');
            setLoading(false);
          }
          return;
        } catch (err) {
          console.warn(`[NEURAL] Mirror ${i + 1} download failed:`, err);
        }
      }

      if (isMounted.current) {
        setError("INSTALL_FAIL: Unable to download model from any mirror. Check Network.");
        setLoading(false);
        setNeedsDownload(true);
      }
  };

  const clearCacheAndRetry = async () => {
    try {
       await tf.io.removeModel(`indexeddb://yolo-nano-m1m-cache`);
    } catch (e) { /* ignore */ }
    window.location.reload();
  };

  useEffect(() => {
    const checkCacheAndInit = async () => {
      if (!isMounted.current) return;
      setLoading(true);
      setLoadingMessage('Checking Local VRAM...');
      setModel(null); 
      setError(null);
      setNeedsDownload(false);
      
      try {
        // Race condition timeout for tf.ready()
        await Promise.race([
            tf.ready(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('TFJS_TIMEOUT')), 5000))
        ]);

        if (tf.getBackend() !== 'webgl') {
          // Attempt to force WebGL, fallback to CPU if needed
          await tf.setBackend('webgl').catch(async () => {
             console.warn('WebGL backend not available, falling back to CPU');
             await tf.setBackend('cpu');
          });
        }
      } catch (e) {
        console.warn('TensorFlow backend initialization error:', e);
        if (isMounted.current) {
           setError("NEURAL_INIT_TIMEOUT: WebGL Backend Unresponsive. Check Hardware Acceleration.");
           setLoading(false);
        }
        return;
      }

      const localModelPath = `indexeddb://yolo-nano-m1m-cache`;

      // 1. Try Loading from Cache First
      try {
        const loadedModel = await tf.loadGraphModel(localModelPath);
        console.log('[NEURAL] Model loaded from IndexedDB cache');
        
        // Quick verify
        tf.tidy(() => loadedModel.predict(tf.zeros([1, 640, 640, 3])));
        
        if (isMounted.current) {
          setModel(loadedModel);
          setIsModelCached(true);
          setActiveModelName('YOLOv8n (Official)');
          setActiveModelSource('CACHE');
          setLoading(false);
        }
      } catch (e) {
        console.log('[NEURAL] Cache miss or invalid. Download required.');
        if (isMounted.current) {
          setIsModelCached(false);
          setNeedsDownload(true);
          setLoading(false);
        }
      }
    };

    checkCacheAndInit();
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [profile.accessibility.neuralModelQuality]);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    }
  }, []);

  // Trigger capture logic on R2 press
  useEffect(() => {
    if (state.buttons[7]) {
      processSporadicCapture();
    }
  }, [state.buttons]);

  // Main Detection Loop (Optimized for Async/Sync Hybrid)
  useEffect(() => {
    if (!profile.accessibility.yoloEnabled || !model) {
      setAiTarget(null);
      return;
    }

    const detect = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // 1. RENDER LOOP (Sync - 60Hz)
      // Always draw the latest video frame and existing detections to maintain high FPS visual feedback
      if (video && canvas && video.readyState === 4) {
         const ctx = canvas.getContext('2d', { alpha: false });
         if (ctx) {
            // Draw Video
            if (video.videoWidth > 0 && video.videoHeight > 0) {
               ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            
            // Draw Overlays (using cached detections from refs)
            if (currentDetectionsRef.current) {
               const detections = currentDetectionsRef.current;
               const inputSize = 640;
               let bestTarget = null;
               let bestDist = Infinity;

               ctx.strokeStyle = '#ef4444';
               ctx.lineWidth = 2;

               detections.boxes.forEach((box, i) => {
                  const score = detections.scores[i];
                  if (detections.classes[i] !== 0 || score < (profile.accessibility.yoloConfidence || 0.5)) return;

                  const [cx, cy, w, h] = box;
                  
                  const scaleX = canvas.width / inputSize;
                  const scaleY = canvas.height / inputSize;
                  
                  const x1 = (cx - w / 2) * scaleX;
                  const y1 = (cy - h / 2) * scaleY;
                  const scaledW = w * scaleX;
                  const scaledH = h * scaleY;

                  ctx.strokeRect(x1, y1, scaledW, scaledH);
                  
                  const normCX = cx / inputSize;
                  const normCY = cy / inputSize;
                  const dist = Math.sqrt(Math.pow(normCX - 0.5, 2) + Math.pow(normCY - 0.5, 2));
                  
                  if (dist < bestDist) {
                     bestDist = dist;
                     bestTarget = { x: normCX, y: normCY };
                  }
               });
               
               // Update global target ref (Fast, no re-render)
               setAiTarget(bestTarget);
            }
         }
      }

      // 2. INFERENCE LOOP (Async - Throttled by Model Speed)
      // Only start new inference if previous one is finished
      const now = performance.now();
      if (model && !isInferringRef.current && (now - lastInferenceRef.current >= 16)) {
         isInferringRef.current = true;
         lastInferenceRef.current = now;

         (async () => {
            const startInf = performance.now();
            try {
               const inputSize = 640;
               const infCanvas = inferenceCanvasRef.current;

               // CPU-based Resize (More efficient than GPU resize for large video textures)
               if (video && video.readyState === 4 && infCanvas) {
                  const infCtx = infCanvas.getContext('2d', { willReadFrequently: true, alpha: false });
                  if (infCtx) {
                     infCtx.drawImage(video, 0, 0, inputSize, inputSize);

                     // Run Inference Pipeline
                     // tf.tidy ensures intermediate tensors are cleaned up
                     const tensorData = tf.tidy(() => {
                        const img = tf.browser.fromPixels(infCanvas);
                        const normalized = img.toFloat().div(255.0).expandDims(0);
                        
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
                        
                        // Return selected tensors for download
                        return {
                           boxes: boxes.gather(nmsIndices),
                           scores: maxScores.gather(nmsIndices),
                           classes: classes.gather(nmsIndices)
                        };
                     });

                     // Async Download to prevent blocking UI thread
                     const [b, s, c] = await Promise.all([
                        tensorData.boxes.array(),
                        tensorData.scores.array(),
                        tensorData.classes.array()
                     ]);

                     // Explicit disposal of download tensors
                     tensorData.boxes.dispose();
                     tensorData.scores.dispose();
                     tensorData.classes.dispose();

                     // Update Refs
                     currentDetectionsRef.current = { boxes: b, scores: s, classes: c };

                     const endInf = performance.now();
                     if (isMounted.current) {
                        setInferenceTime(Math.round(endInf - startInf));
                        // Approximate FPS based on inference duration
                        setFps(Math.round(1000 / (endInf - startInf)));
                     }
                  }
               }
            } catch (e) {
               console.warn("[NEURAL] Async inference failed:", e);
            } finally {
               isInferringRef.current = false;
            }
         })();
      }

      requestRef.current = requestAnimationFrame(detect);
    };

    const startDetection = () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      detect();
    };
    
    startDetection();
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }

  }, [model, profile.accessibility.yoloEnabled, profile.accessibility.yoloConfidence, setAiTarget]);

  return (
    <div className="relative w-full aspect-video glass rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden bg-black">
      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} width={800} height={450} className="w-full h-full block" />
      
      <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between z-20">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-3xl ${profile.accessibility.yoloEnabled ? 'bg-purple-600/30' : 'bg-slate-800/50'}`}>
              <BrainCircuit className={`w-10 h-10 ${profile.accessibility.yoloEnabled && !loading && !error && !needsDownload ? 'text-purple-400 animate-pulse' : 'text-slate-600'}`} />
            </div>
            <div>
              <p className="text-[16px] font-black text-white uppercase tracking-[0.6em]">NEURAL_INTERCEPT</p>
              
              {!loading && !error && !needsDownload && (
                <div className="flex items-center gap-4 mt-2">
                   <div className="flex flex-col">
                      <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">Model</span>
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">{activeModelName}</span>
                   </div>
                   <div className="w-px h-5 bg-white/10"></div>
                   <div className="flex flex-col">
                      <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Source</span>
                      <div className="flex items-center gap-1.5">
                         {activeModelSource === 'CACHE' && <HardDrive className="w-3 h-3 text-green-500" />}
                         {activeModelSource === 'STREAM' && <Wifi className="w-3 h-3 text-blue-500" />}
                         {activeModelSource === 'LOCAL' && <FolderOpen className="w-3 h-3 text-yellow-500" />}
                         <span className={`text-[9px] font-black uppercase tracking-widest ${
                            activeModelSource === 'CACHE' ? 'text-green-500' :
                            activeModelSource === 'STREAM' ? 'text-blue-500' :
                            'text-yellow-500'
                         }`}>
                           {activeModelSource}
                         </span>
                      </div>
                   </div>
                </div>
              )}

              <div className="flex items-center gap-3 mt-2">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">
                  {error ? 'DIAGNOSTIC_MODE' : needsDownload ? 'INSTALL_REQ' : sourceMode} | {fps}FPS | {inferenceTime}MS
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-4 pointer-events-auto items-center relative">
             <button 
               onClick={() => setShowSettings(!showSettings)}
               className={`p-4 rounded-2xl border transition-all ${showSettings ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-white'}`}
             >
                <Settings className="w-6 h-6" />
             </button>
             
             {/* Source Selection Menu */}
             <div className="relative">
                <button 
                  onClick={() => setShowSourceMenu(!showSourceMenu)} 
                  className={`p-4 rounded-2xl border transition-all flex items-center gap-2 ${showSourceMenu || sourceMode !== 'SCREEN' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-900 text-slate-500'}`}
                  title="Select Input Source"
                >
                  {sourceMode === 'CAMERA' ? <Camera className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSourceMenu ? 'rotate-180' : ''}`} />
                </button>

                {showSourceMenu && (
                  <div className="absolute top-20 right-0 w-64 glass p-4 rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-top-4 fade-in z-50 flex flex-col gap-2">
                    <div className="px-2 py-1">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Scan className="w-3 h-3 text-blue-400" /> Select Input Source
                      </h4>
                    </div>
                    
                    <button 
                      onClick={() => startStream('SCREEN')}
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400 group-hover:text-white group-hover:bg-blue-600 transition-all">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-black text-white uppercase tracking-widest">Entire Screen</span>
                        <span className="block text-[8px] font-bold text-slate-500 uppercase">Full Desktop Capture</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => startStream('WINDOW')}
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className="p-2 bg-purple-600/20 rounded-lg text-purple-400 group-hover:text-white group-hover:bg-purple-600 transition-all">
                        <AppWindow className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-black text-white uppercase tracking-widest">Specific Window</span>
                        <span className="block text-[8px] font-bold text-slate-500 uppercase">Isolate Application</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => startStream('CAMERA')}
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className="p-2 bg-green-600/20 rounded-lg text-green-400 group-hover:text-white group-hover:bg-green-600 transition-all">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-black text-white uppercase tracking-widest">Webcam Feed</span>
                        <span className="block text-[8px] font-bold text-slate-500 uppercase">Physical Camera</span>
                      </div>
                    </button>
                  </div>
                )}
             </div>

             {/* SETTINGS POPUP */}
             {showSettings && (
               <div className="absolute top-20 right-20 w-72 glass p-6 rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-top-4 fade-in z-50">
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Settings className="w-3 h-3 text-purple-400" /> Neural Configuration
                 </h4>
                 
                 <div className="space-y-6">
                   {/* Confidence Slider */}
                   <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Confidence Threshold</span>
                       <span className="text-[9px] font-black text-purple-400 font-mono">
                         {((profile.accessibility.yoloConfidence || 0.75) * 100).toFixed(0)}%
                       </span>
                     </div>
                     <div className="relative h-6 flex items-center">
                        <Gauge className="absolute left-0 w-4 h-4 text-slate-600" />
                        <input 
                          type="range" min="0.1" max="0.95" step="0.05"
                          value={profile.accessibility.yoloConfidence || 0.75}
                          onChange={(e) => updateAccess({ yoloConfidence: parseFloat(e.target.value) })}
                          className="w-full ml-6 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                     </div>
                   </div>

                   {/* Quality Toggle */}
                   <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Model Quality</span>
                       <Zap className={`w-3 h-3 ${profile.accessibility.neuralModelQuality === 'fast' ? 'text-yellow-400' : 'text-slate-600'}`} />
                     </div>
                     <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-white/5">
                        <button
                          onClick={() => updateAccess({ neuralModelQuality: 'fast' })}
                          className={`py-2 rounded-lg text-[8px] font-black uppercase transition-all ${profile.accessibility.neuralModelQuality === 'fast' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          Fast
                        </button>
                        <button
                          onClick={() => updateAccess({ neuralModelQuality: 'accurate' })}
                          className={`py-2 rounded-lg text-[8px] font-black uppercase transition-all ${profile.accessibility.neuralModelQuality === 'accurate' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          Accurate
                        </button>
                     </div>
                   </div>
                   
                   {/* Load Local Model - Moved here for easy access */}
                   <div className="space-y-3 pt-4 border-t border-white/5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Advanced</span>
                        <button 
                            onClick={() => {
                                setShowSettings(false);
                                fileInputRef.current?.click();
                            }}
                            className="w-full py-3 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all group"
                        >
                            <FolderOpen className="w-3 h-3 text-blue-500 group-hover:text-blue-400" />
                            <span className="text-[8px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Load Custom Model</span>
                        </button>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Success Toast */}
        {successMsg && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 bg-green-500/20 backdrop-blur-md border border-green-500/50 text-green-400 px-6 py-2 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-in slide-in-from-top-4 fade-in duration-300">
               <Check className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">{successMsg}</span>
            </div>
        )}

        {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-30">
                <div className="text-center space-y-6 px-8 max-w-2xl">
                    <div className="flex justify-center">
                        {error.includes("NATIVE_DETECTED") ? (
                            <FileCode className="w-16 h-16 text-yellow-500 animate-pulse" />
                        ) : (
                            <ServerCrash className="w-16 h-16 text-red-500" />
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className={`text-2xl font-black uppercase tracking-tighter ${error.includes("NATIVE_DETECTED") ? "text-yellow-500" : "text-red-500"}`}>
                            {error.includes("NATIVE_DETECTED") ? "Diagnostic Mode Active" : "Neural Link Failure"}
                        </h3>
                        <p className="text-slate-400 font-bold uppercase tracking-widest leading-relaxed text-xs">
                            {error}
                        </p>
                    </div>

                    {error.includes("NATIVE_DETECTED") && (
                        <div className="bg-slate-950/80 p-6 rounded-2xl border border-white/10 text-left space-y-4">
                            <div className="flex items-center gap-2 text-blue-400">
                                <Terminal className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Required Conversion Command</span>
                            </div>
                            <code className="block bg-black p-4 rounded-lg text-green-400 font-mono text-[10px] select-all cursor-text">
                                yolo export model=yolov8n.pt format=tfjs
                            </code>
                            <p className="text-[9px] text-slate-500 uppercase font-bold">
                                Run this in your Python environment to generate the compatible 'model.json' + binary shards.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-4 justify-center pointer-events-auto">
                      <button onClick={downloadAndInstallModel} className="px-6 py-3 bg-slate-800 rounded-full text-[10px] font-black uppercase text-white hover:bg-slate-700 transition-colors border border-white/5">
                        Download Standard Model
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-blue-600 rounded-full text-[10px] font-black uppercase text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30">
                        Select Different File
                      </button>
                    </div>
                </div>
            </div>
        )}

        {needsDownload && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-30 animate-in fade-in">
                <div className="text-center space-y-6 max-w-md p-8 bg-slate-950/90 border border-white/10 rounded-[3rem] shadow-2xl">
                    <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/30 animate-pulse">
                        <CloudDownload className="w-10 h-10 text-blue-400" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Neural Core Required</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                            A YOLOv8n detection model is required to enable visual sign blocking and object tracking.
                        </p>
                    </div>
                    
                    {/* DROPDOWN MENU FOR MODEL LOADING */}
                    <div className="relative w-full pointer-events-auto">
                        <select 
                            className="w-full bg-slate-900 border border-white/20 rounded-2xl p-4 text-white appearance-none cursor-pointer font-black uppercase tracking-widest text-[10px] hover:border-blue-500/50 transition-colors focus:outline-none focus:border-blue-500"
                            onChange={(e) => {
                                if (e.target.value === 'local') {
                                    fileInputRef.current?.click();
                                    e.target.value = 'default'; // Reset
                                } else if (e.target.value === 'cloud') {
                                    downloadAndInstallModel();
                                }
                            }}
                            defaultValue="default"
                        >
                            <option value="default" disabled>Select Neural Source...</option>
                            <option value="cloud">☁️ Download Official YOLOv8n (6MB)</option>
                            <option value="local">📂 Load Local Model (Supports .json, .pt, .onnx)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>

                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Supports TFJS Graph Models</p>
                </div>
            </div>
        )}

        {/* Capture Stats HUD */}
        {profile.accessibility.trainingConfig.enabled && !error && !needsDownload && (
          <div className="self-end flex items-center gap-4 animate-in fade-in slide-in-from-right-4">
             <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex items-center gap-3">
               <Database className={`w-4 h-4 ${captureStats.lastReason === 'CAPTURED' ? 'text-green-500' : 'text-slate-500'}`} />
               <div className="space-y-0.5">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Dataset</p>
                 <p className="text-[10px] font-black text-white uppercase">{captureStats.total} / {profile.accessibility.trainingConfig.maxImages}</p>
               </div>
             </div>
             <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex items-center gap-3">
               {captureStats.lastReason === 'CAPTURED' ? <Check className="w-4 h-4 text-green-500" /> : <Scan className="w-4 h-4 text-slate-500" />}
               <div className="space-y-0.5">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Capture State</p>
                 <p className={`text-[10px] font-black uppercase ${captureStats.lastReason.startsWith('ERR') ? 'text-red-500' : captureStats.lastReason === 'CAPTURED' ? 'text-green-500' : 'text-slate-400'}`}>
                   {captureStats.lastReason}
                 </p>
               </div>
             </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center z-50">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
          <div className="mt-8 space-y-2 text-center">
            <h3 className="text-[12px] font-black text-white uppercase tracking-[0.5em] animate-pulse">Establishing Link...</h3>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
              {loadingMessage}
            </p>
          </div>
        </div>
      )}

      {/* Hidden File Input for Local Loading - Now Outside Conditional Blocks */}
      <input 
          type="file" 
          multiple 
          accept=".json,.bin,.pt,.onnx,.yaml" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleLocalFileSelect} 
      />
    </div>
  );
};