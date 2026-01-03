
import { useState } from 'react';

export interface VideoState {
  isGenerating: boolean;
  script: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  captions: Array<{ start: number; end: number; text: string }>;
  progress: number;
}

export const useVideoEngine = () => {
  const [state, setState] = useState<VideoState>({
    isGenerating: false,
    script: null,
    audioUrl: null,
    videoUrl: null,
    captions: [],
    progress: 0
  });

  const generateContent = async (prompt: string, apiKey: string) => {
    if (!prompt) return;
    
    // Reset state
    setState(prev => ({
      ...prev,
      isGenerating: true,
      script: null,
      audioUrl: null,
      videoUrl: null,
      captions: [],
      progress: 0
    }));

    try {
      // 1. SIMULATION: Gemini 3 Flash (Script Generation)
      setState(prev => ({ ...prev, progress: 10 }));
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const script = `Generated Script for: "${prompt}".\nWelcome to the Faceless AI experience. We are creating content at light speed.`;
      setState(prev => ({ ...prev, script, progress: 35 }));

      // 2. SIMULATION: Gemini 2.5 (Audio/TTS)
      await new Promise(resolve => setTimeout(resolve, 1200));
      // Using a short royalty-free sample URL for demonstration
      const audioUrl = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"; 
      
      const captions = [
        { start: 0, end: 1.5, text: "Generated Script based on your prompt." },
        { start: 1.5, end: 3.5, text: "Welcome to the Faceless AI experience." },
        { start: 3.5, end: 5.5, text: "We are creating content at light speed." }
      ];
      
      setState(prev => ({ ...prev, audioUrl, captions, progress: 70 }));

      // 3. SIMULATION: Veo (Video Generation)
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Using a Google public sample video
      const videoUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
      
      setState(prev => ({ ...prev, videoUrl, progress: 100, isGenerating: false }));

    } catch (error) {
      console.error("Generation failed:", error);
      setState(prev => ({ ...prev, isGenerating: false, progress: 0 }));
    }
  };

  return { state, generateContent };
};
