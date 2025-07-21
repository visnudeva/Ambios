import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  colors: string[];
}

const Visualizer: React.FC<VisualizerProps> = ({ analyserNode, colors }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number>(0);

  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    analyserNode.fftSize = 128;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
      
    const render = () => {
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      const barWidth = (WIDTH / bufferLength) * 1.8;
      
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      
      analyserNode.getByteFrequencyData(dataArray);

      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * HEIGHT * 0.9;
        
        const gradient = ctx.createLinearGradient(0, HEIGHT, 0, HEIGHT - barHeight);
        gradient.addColorStop(0, colors[0] || 'rgba(168, 85, 247, 0.4)');
        gradient.addColorStop(0.6, colors[1] || 'rgba(217, 70, 239, 0.7)');
        gradient.addColorStop(1, colors[2] || 'rgba(56, 189, 248, 1)');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = colors[2] || `rgb(56, 189, 248, 0.8)`;
        ctx.shadowBlur = 8;
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
        
        x += barWidth + 2;
      }
      
      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      if (ctx) {
        ctx.clearRect(0,0, canvas.width, canvas.height);
      }
    };

  }, [analyserNode, colors]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width="600" 
      height="150"
      className="w-full h-full"
    />
  );
};

export default Visualizer;