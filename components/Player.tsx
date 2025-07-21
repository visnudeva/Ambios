
import React, { useRef, useEffect } from 'react';
import type { Station, ThemeColors } from '../types';
import Icon from './Icon';

interface PlayerProps {
  station: Station | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onPlaybackError: () => void;
  isThemeLoading: boolean;
  onAnalyserReady: (analyser: AnalyserNode) => void;
  themeColors: ThemeColors;
}

const Player: React.FC<PlayerProps> = ({ station, isPlaying, setIsPlaying, onPlaybackError, isThemeLoading, onAnalyserReady, themeColors }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const setupAudioContext = () => {
    if (!audioRef.current || audioContextRef.current) return;
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;

      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      onAnalyserReady(analyser);
      
      sourceNodeRef.current = context.createMediaElementSource(audioRef.current);
      sourceNodeRef.current.connect(analyser);
      analyser.connect(context.destination);

    } catch(e) {
      console.error("Web Audio API is not supported by this browser.", e);
    }
  };

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement && station) {
      const newSrc = station.url_resolved;
      if (audioElement.src !== newSrc) {
        audioElement.src = newSrc;
        audioElement.load();
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name !== 'AbortError') {
              console.error("Playback failed on station change:", error);
              setIsPlaying(false);
              onPlaybackError();
            }
          });
        }
      }
    } else if (audioElement && !station) {
        audioElement.pause();
        audioElement.src = '';
    }
  }, [station, onPlaybackError, setIsPlaying]);
  

  const togglePlay = () => {
    if (!audioRef.current || !station) return;
    
    // Ensure audio context is started on user interaction
    if (!audioContextRef.current) {
        setupAudioContext();
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        console.error("Manual playback failed:", e);
        onPlaybackError();
      });
    }
  };
  
  if (!station) {
    return (
        <div className="mt-8 p-6 w-full max-w-2xl mx-auto bg-gray-900/50 rounded-xl border border-gray-700 flex flex-col items-center justify-center h-48 transition-all duration-500 text-white">
           <p className="text-lg" style={{color: 'var(--color-primary)'}}>Select a station to start listening</p>
           <Icon name="radio-tower" className="w-16 h-16 mt-4 opacity-30" style={{color: 'var(--color-secondary)'}}/>
        </div>
    );
  }

  return (
    <div 
        className="mt-8 p-4 sm:p-6 w-full max-w-2xl mx-auto backdrop-blur-sm rounded-xl border transition-all duration-500"
        style={{
            background: `linear-gradient(135deg, ${themeColors.gradientColors[0]}B3, ${themeColors.gradientColors[1]}B3)`,
            borderColor: 'var(--color-secondary)',
        }}
    >
      <div className="flex items-center gap-4">
        <img src={station.favicon || 'invalid-url'} alt={station.name} className="w-16 h-16 rounded-lg bg-gray-800 object-cover flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <div className="flex-grow overflow-hidden">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold truncate text-white drop-shadow-md">{station.name}</h2>
              {isThemeLoading && <div className="w-5 h-5 border-2 border-white rounded-full animate-spin flex-shrink-0" style={{borderTopColor: 'transparent'}}></div>}
            </div>
            <p className="truncate text-white/80 drop-shadow-sm">{station.country} &middot; {station.bitrate} kbps</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6">
        <button 
            onClick={togglePlay} 
            className="p-3 rounded-full border-2 border-white/50 bg-white/20 hover:bg-white/30 transition-all text-white"
        >
          <Icon name={isPlaying ? 'pause' : 'play'} className="w-8 h-8"/>
        </button>
      </div>
       <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onPlay={() => {
            if (!audioContextRef.current) setupAudioContext();
            setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onError={onPlaybackError}
        className="hidden"
      ></audio>
    </div>
  );
};

export default Player;