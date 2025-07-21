import React, { useRef, useEffect } from 'react';

interface FluidGradientProps {
  colors: string[];
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

class Orb {
  x: number;
  y: number;
  baseRadius: number;
  radius: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  color: string;

  constructor(canvasWidth: number, canvasHeight: number, color: string) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    const baseSize = Math.min(canvasWidth, canvasHeight);
    this.baseRadius = Math.random() * (baseSize * 0.15) + (baseSize * 0.1);
    this.radius = this.baseRadius;
    
    // Set a base velocity vector for direction and base speed
    const speed = (Math.random() * 0.4) + 0.2; // Base speed: 0.2 to 0.6 pixels/frame
    const angle = Math.random() * 2 * Math.PI;
    this.baseVx = Math.cos(angle) * speed;
    this.baseVy = Math.sin(angle) * speed;
    this.vx = this.baseVx;
    this.vy = this.baseVy;
    
    this.color = color;
  }
  
  updateRadius(beatIntensity: number) {
    const maxRadiusAddition = this.baseRadius * 1.0; // Orb can now double in size on a strong beat
    const targetRadius = this.baseRadius + (maxRadiusAddition * beatIntensity);
    // Lerp (linear interpolation) for smooth radius transitions.
    // A higher factor (e.g., 0.6) makes the "beat" pulse more responsive and snappy.
    this.radius += (targetRadius - this.radius) * 0.6;
  }

  updateVelocity(musicEnergy: number) {
    // musicEnergy is a smoothed value from 0 to ~1
    // The speed multiplier can make orbs up to 4x faster for high-energy music
    const speedMultiplier = 1 + (musicEnergy * 3.0); 
    this.vx = this.baseVx * speedMultiplier;
    this.vy = this.baseVy * speedMultiplier;
  }

  move(canvasWidth: number, canvasHeight: number) {
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off walls and reverse base direction
    if (this.x - this.radius < 0) {
      this.baseVx = Math.abs(this.baseVx);
      this.x = this.radius;
    } else if (this.x + this.radius > canvasWidth) {
      this.baseVx = -Math.abs(this.baseVx);
      this.x = canvasWidth - this.radius;
    }

    if (this.y - this.radius < 0) {
      this.baseVy = Math.abs(this.baseVy);
      this.y = this.radius;
    } else if (this.y + this.radius > canvasHeight) {
      this.baseVy = -Math.abs(this.baseVy);
      this.y = canvasHeight - this.radius;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, `${this.color}00`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

const FluidGradient: React.FC<FluidGradientProps> = ({ colors, analyserNode, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);
  const orbs = useRef<Orb[]>([]);
  // Use refs for props that change often to avoid re-triggering the main useEffect hook
  const isPlayingRef = useRef(isPlaying);
  const analyserNodeRef = useRef(analyserNode);
  const musicEnergyRef = useRef(0); // For smoothed energy

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  
  useEffect(() => {
    analyserNodeRef.current = analyserNode;
  }, [analyserNode]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let dataArray: Uint8Array | null = null;
    if (analyserNodeRef.current) {
        // Increase FFT size for better frequency resolution to isolate bass/kick drums.
        analyserNodeRef.current.fftSize = 256; 
        dataArray = new Uint8Array(analyserNodeRef.current.frequencyBinCount);
    }
    
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        orbs.current = colors.map(color => new Orb(canvas.width, canvas.height, color));
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      // Create a "motion trail" effect instead of clearing the canvas.
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.globalCompositeOperation = 'lighter';

      let beatIntensity = 0;
      if (analyserNodeRef.current && isPlayingRef.current && dataArray) {
        analyserNodeRef.current.getByteFrequencyData(dataArray);
        // Focus on low-frequency bins for bass/kick drum energy (0-344Hz range).
        const bassLevel = (dataArray[0] + dataArray[1]) / 2;
        // A higher power function (e.g., 3.0) makes the pulse even more selective to strong peaks.
        beatIntensity = Math.pow(bassLevel / 255, 3.0);
      }
      
      // Smooth the energy value over time using an exponential moving average for graceful speed changes
      const SMOOTHING_FACTOR = 0.05;
      musicEnergyRef.current = (SMOOTHING_FACTOR * beatIntensity) + ((1 - SMOOTHING_FACTOR) * musicEnergyRef.current);
      
      // Decay energy when paused to slow down blobs gracefully
      if (!isPlayingRef.current && musicEnergyRef.current > 0.001) {
          musicEnergyRef.current *= 0.95;
      } else if (!isPlayingRef.current) {
          musicEnergyRef.current = 0;
      }
      
      orbs.current.forEach(orb => {
        orb.updateRadius(beatIntensity); // Pulse radius to the raw beat
        orb.updateVelocity(musicEnergyRef.current); // Set speed from smoothed energy
        orb.move(canvas.width, canvas.height);
        orb.draw(ctx);
      });
      
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [colors]); // Only re-initialize the entire effect when the theme colors change

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full -z-10"
    />
  );
};

export default FluidGradient;