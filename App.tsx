
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Station, ThemeColors } from './types';
import { searchStations, getTopStations } from './services/radioService';
import { extractColorsFromImage } from './services/colorService';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import StationList from './components/StationList';
import Player from './components/Player';
import FluidGradient from './components/FluidGradient';

const DEFAULT_THEME: ThemeColors = {
  primary: '#e5e7eb',
  secondary: '#9ca3af',
  gradientColors: ['#3b82f6', '#a855f7', '#ec4899'],
};

const App: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState<boolean>(false);
  const [themeColors, setThemeColors] = useState<ThemeColors>(DEFAULT_THEME);
  const [isThemeLoading, setIsThemeLoading] = useState<boolean>(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const idleTimerRef = useRef<number | null>(null);

  // Effect for idle detection
  useEffect(() => {
    const handleActivity = () => {
      setIsIdle(false);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (isPlaying) {
        idleTimerRef.current = window.setTimeout(() => {
          setIsIdle(true);
        }, 15000); // 15 seconds
      }
    };

    if (isPlaying) {
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('mousedown', handleActivity);
      handleActivity(); // Start timer immediately
    } else {
      // If not playing, ensure UI is not idle and clear any existing timers
      setIsIdle(false);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    }

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
    };
  }, [isPlaying]);

  // Effect for initial data load from localStorage or API
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      const storedStationsJSON = localStorage.getItem('lastPlayedStations');
      const storedThemeJSON = localStorage.getItem('lastTheme');
      
      if (storedThemeJSON) {
        setThemeColors(JSON.parse(storedThemeJSON));
      }

      if (storedStationsJSON) {
        const storedStations = JSON.parse(storedStationsJSON);
        if (storedStations.length > 0) {
          setStations(storedStations);
          setSearched(true);
          setIsLoading(false);
          return;
        }
      }

      // If no stored stations, fetch popular ones
      try {
        const popularStations = await getTopStations();
        if (popularStations.length > 0) {
          setStations(popularStations);
        } else {
          setError("Could not fetch popular stations. Please try a search.");
        }
        setSearched(true);
      } catch (err) {
        setError('Failed to fetch popular stations. The radio-browser API might be down.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);


  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', themeColors.primary);
    root.style.setProperty('--color-secondary', themeColors.secondary);
  }, [themeColors]);

  const handleSearch = useCallback(async (prompt: string) => {
    if (!prompt) return;
    setIsLoading(true);
    setError(null);
    setSearched(true);
    setCurrentStation(null);
    setIsPlaying(false);
    setStations([]);
    try {
      // Directly use the user's prompt as the search term
      const results = await searchStations(prompt);
      if (results.length === 0) {
        setError('No stations found for your search.');
      }
      setStations(results);
    } catch (err) {
      setError('Failed to fetch stations. The radio-browser API might be down.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist station list and theme when a new station is selected
  useEffect(() => {
    const persistAndTheme = async () => {
        if (!currentStation) return;

        // 1. Persist station list
        const storedStationsJSON = localStorage.getItem('lastPlayedStations');
        const storedStations: Station[] = storedStationsJSON ? JSON.parse(storedStationsJSON) : [];
        const newStations = [
            currentStation,
            ...storedStations.filter(s => s.stationuuid !== currentStation.stationuuid)
        ].slice(0, 10);
        localStorage.setItem('lastPlayedStations', JSON.stringify(newStations));

        // 2. Generate and persist theme from icon
        setIsThemeLoading(true);
        try {
            let finalTheme: ThemeColors | null = null;
            if (currentStation.favicon) {
                finalTheme = await extractColorsFromImage(currentStation.favicon);
            }

            if (finalTheme) {
                setThemeColors(finalTheme);
                localStorage.setItem('lastTheme', JSON.stringify(finalTheme));
            } else {
                // Fallback to default if color extraction fails or no icon
                console.log("Color extraction from icon failed or icon missing, falling back to default theme.");
                setThemeColors(DEFAULT_THEME);
                localStorage.removeItem('lastTheme');
            }
        } catch (error) {
            console.error("Theme generation process failed:", error);
            setThemeColors(DEFAULT_THEME); 
            localStorage.removeItem('lastTheme');
        } finally {
            setIsThemeLoading(false);
        }
    };
    persistAndTheme();
  }, [currentStation]);

  const handleStationSelect = useCallback((station: Station) => {
    if (currentStation?.stationuuid !== station.stationuuid) {
        setCurrentStation(station);
        setError(null);
    }
  }, [currentStation]);

  const handlePlaybackError = useCallback(() => {
      setError("This station's stream seems to be offline or unavailable.");
      setCurrentStation(null);
      setIsPlaying(false);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
       <FluidGradient 
        colors={themeColors.gradientColors} 
        analyserNode={analyserNode}
        isPlaying={isPlaying}
       />
      <div 
        className="relative z-10 p-4 flex flex-col items-center min-h-screen w-full backdrop-blur-md transition-colors duration-500"
        style={{
          background: `linear-gradient(180deg, ${themeColors.gradientColors[0]}33, rgba(0,0,0,0.3))`
        }}
      >
        <div className={`w-full transition-opacity duration-700 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <Header />
        </div>

        <main className="w-full flex-grow flex flex-col items-center mt-4">
          <div className={`w-full flex-grow flex flex-col items-center transition-opacity duration-700 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            
            {error && <p className="mt-4 p-3 rounded-lg animate-pulse text-white font-bold" style={{ backgroundColor: 'var(--color-secondary)' }}>{error}</p>}
            
            {!isLoading && stations.length > 0 && (
              <StationList 
                stations={stations} 
                onStationSelect={handleStationSelect}
                currentStationUuid={currentStation?.stationuuid ?? null}
              />
            )}
            
            {!isLoading && searched && stations.length === 0 && !error && (
                <div className="mt-8 text-center p-6 bg-gray-900/50 rounded-xl border border-gray-700">
                    <p className="text-gray-400">No stations found. Try searching for a genre, artist, or keyword!</p>
                </div>
            )}
          </div>
          
          <Player 
              station={currentStation}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              onPlaybackError={handlePlaybackError} 
              isThemeLoading={isThemeLoading}
              onAnalyserReady={setAnalyserNode}
              themeColors={themeColors}
          />
        </main>
        <footer className={`text-center py-4 mt-auto transition-opacity duration-700 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <p className="text-gray-400 text-sm">Powered by <a href="https://www.radio-browser.info/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-primary)] transition-colors" style={{color: 'var(--color-secondary)'}}>Radio Browser API</a></p>
        </footer>
      </div>
    </div>
  );
};

export default App;
