
import { useState, useRef, useCallback } from 'react';

export const useAudioVisualizer = (audioRef: React.RefObject<HTMLAudioElement>) => {
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const setupAudioContext = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;

      const analyser = context.createAnalyser();
      setAnalyserNode(analyser);

      if (!sourceNodeRef.current) {
         sourceNodeRef.current = context.createMediaElementSource(audioRef.current);
      }
      
      sourceNodeRef.current.connect(analyser);
      analyser.connect(context.destination);

    } catch(e) {
      console.error("Web Audio API is not supported by this browser.", e);
    }
  }, [audioRef]);

  return { analyserNode, setupAudioContext };
};
