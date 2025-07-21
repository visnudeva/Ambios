import React, { useRef } from 'react';
import type { Station } from '../types';
import Icon from './Icon';

interface StationListProps {
  stations: Station[];
  onStationSelect: (station: Station) => void;
  currentStationUuid: string | null;
}

const StationListItem: React.FC<{
  station: Station;
  onStationSelect: (station: Station) => void;
  isPlaying: boolean;
}> = ({ station, onStationSelect, isPlaying }) => {
  const hoverEffect = "hover:bg-gray-800/80 hover:border-[var(--color-primary)]";
  
  // Use inline style for dynamic color to ensure it applies, and class for static state
  const playingStyle = isPlaying ? { borderColor: 'var(--color-secondary)' } : {};
  const playingClass = isPlaying ? "bg-gray-800/70" : "border-gray-700/50";
  
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fallbackRef = useRef<HTMLDivElement | null>(null);

  const handleImageError = () => {
    if(imgRef.current) imgRef.current.style.display = 'none';
    if(fallbackRef.current) fallbackRef.current.style.display = 'flex';
  };

  return (
    <li
      className={`p-3 bg-gray-900/50 backdrop-blur-sm border ${playingClass} rounded-lg flex items-center gap-4 cursor-pointer transition-all duration-300 ${hoverEffect}`}
      style={playingStyle}
      onClick={() => onStationSelect(station)}
    >
      <img
        ref={imgRef}
        src={station.favicon || 'invalid-url'}
        alt={station.name}
        className="w-12 h-12 rounded-md bg-gray-800 object-cover flex-shrink-0"
        onError={handleImageError}
      />
       <div ref={fallbackRef} className="w-12 h-12 rounded-md bg-gray-800 flex-shrink-0 items-center justify-center" style={{display: 'none', color: 'var(--color-primary)'}}>
        <Icon name="radio-tower" className="w-8 h-8"/>
      </div>
      <div className="flex-grow overflow-hidden">
        <p className="font-bold truncate" style={{color: 'var(--color-primary)'}}>{station.name}</p>
        <p className="text-sm truncate" style={{color: 'var(--color-secondary)'}}>{station.country} - {station.codec}</p>
      </div>
    </li>
  );
};

const StationList: React.FC<StationListProps> = ({ stations, onStationSelect, currentStationUuid }) => {
  if (!stations.length) {
    return null;
  }
  return (
    <div className="w-full max-w-xl mx-auto mt-6">
      <ul className="space-y-3 max-h-[calc(100vh-450px)] min-h-[100px] overflow-y-auto pr-2">
        {stations.map((station) => (
          <StationListItem
            key={station.stationuuid}
            station={station}
            onStationSelect={onStationSelect}
            isPlaying={currentStationUuid === station.stationuuid}
          />
        ))}
      </ul>
    </div>
  );
};

export default StationList;