import React, { useRef, useEffect, useMemo } from 'react';

interface CanvasPlayerProps {
  videoUrl: string | null;
  audioUrl: string | null;
  captions: Array<{ start: number; end: number; text: string }>;
  filter: 'none' | 'noir' | 'vintage';
  isPlaying: boolean;
  onTimeUpdate?: (time: number) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const CanvasPlayer: React.FC<CanvasPlayerProps> = ({
  videoUrl,
  audioUrl,
  captions,
  filter,
  isPlaying,
  onTimeUpdate,
  canvasRef
}) => {
  // Fixed: Use useMemo to ensure media elements are created only once to avoid performance issues
  const videoEl = useMemo(() => document.createElement('video'), []);
  const audioEl = useMemo(() => document.createElement('audio'), []);
  
  const videoRef = useRef<HTMLVideoElement>(videoEl);
  const audioRef = useRef<HTMLAudioElement>(audioEl);
  
  // Fixed: Initialize useRef with undefined to satisfy strict type requirements (Expected 1 argument, got 0)
  const reqIdRef = useRef<number | undefined>(undefined);

  // Initialize Video
  useEffect(() => {
    const video = videoRef.current;
    if (videoUrl) {
      video.src = videoUrl;
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.load();
    }
    return () => {
      video.pause();
      video.src = "";
    };
  }, [videoUrl]);

  // Initialize Audio
  useEffect(() => {
    const audio = audioRef.current;
    if (audioUrl) {
      audio.src = audioUrl;
      audio.crossOrigin = "anonymous";
      audio.load();
    }
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  // Playback Logic
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (isPlaying) {
      video.play().catch(e => console.warn("Video play interrupted", e));
      audio.play().catch(e => console.warn("Audio play interrupted", e));
      drawFrame();
    } else {
      video.pause();
      audio.pause();
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    }

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [isPlaying]);

  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    const audio = audioRef.current;

    // Set 9:16 Portrait Resolution
    canvas.width = 720;
    canvas.height = 1280;

    // 1. Draw Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Apply Filters
    ctx.filter = filter === 'noir' ? 'grayscale(100%) contrast(120%)' : 
                 filter === 'vintage' ? 'sepia(50%) contrast(90%) brightness(110%)' : 'none';

    // 3. Draw Video (Center Crop / Cover Mode)
    if (video.readyState >= 2) {
      const vidRatio = video.videoWidth / video.videoHeight;
      const canvasRatio = canvas.width / canvas.height;
      let drawW, drawH, startX, startY;

      if (vidRatio > canvasRatio) {
        // Video is wider than canvas
        drawH = canvas.height;
        drawW = drawH * vidRatio;
        startX = (canvas.width - drawW) / 2;
        startY = 0;
      } else {
        // Video is taller than canvas
        drawW = canvas.width;
        drawH = drawW / vidRatio;
        startX = 0;
        startY = (canvas.height - drawH) / 2;
      }
      ctx.drawImage(video, startX, startY, drawW, drawH);
    } else {
       // Loading State
       ctx.fillStyle = '#111';
       ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.filter = 'none'; // Reset filters for text

    // 4. Draw Captions (Karaoke Sync)
    const currentTime = audio.currentTime;
    if (onTimeUpdate) onTimeUpdate(currentTime);

    const activeCaption = captions.find(c => currentTime >= c.start && currentTime <= c.end);
    
    if (activeCaption) {
      const text = activeCaption.text;
      const fontSize = 48; // Responsive font size could be calculated here
      
      ctx.font = `900 ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const x = canvas.width / 2;
      const y = canvas.height * 0.8;

      // Draw Shadow/Stroke for readability
      ctx.lineWidth = 8;
      ctx.strokeStyle = 'black';
      ctx.strokeText(text, x, y);

      // Draw Base Text (White)
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(text, x, y);

      // Draw Karaoke Highlight
      // Calculate progress of current word/phrase
      const duration = activeCaption.end - activeCaption.start;
      const progress = Math.max(0, Math.min(1, (currentTime - activeCaption.start) / duration));
      
      if (progress > 0) {
        ctx.save();
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        
        // Define clipping region for the highlight
        ctx.beginPath();
        const clipX = x - (textWidth / 2);
        const clipY = y - fontSize;
        const clipW = textWidth * progress; // Animate width based on audio time
        const clipH = fontSize * 2;
        
        ctx.rect(clipX, clipY, clipW, clipH);
        ctx.clip();

        // Draw Filled Text
        ctx.fillStyle = '#3b82f6'; // Bright Blue Highlight
        ctx.fillText(text, x, y);
        // Re-stroke to maintain edge definition over highlight
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'black';
        ctx.strokeText(text, x, y);
        
        ctx.restore();
      }
    }

    if (isPlaying) {
      reqIdRef.current = requestAnimationFrame(drawFrame);
    }
  };

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full object-cover bg-black shadow-2xl"
    />
  );
};