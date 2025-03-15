'use client';

import { useState, useEffect } from 'react';
import MapContainer from '@/components/Map/MapContainer';
import IndividualFilter from '@/components/Filters/IndividualFilter';
import Timeline from '@/components/Timeline/Timeline';
import { WhaleSighting } from '@/types/sighting';
import { loadAllSightings } from '@/services/utils/yearlyDataLoader';
import { findPositionsForDate } from '@/utils/positionUtils';

export default function Home() {
  const [sightings, setSightings] = useState<WhaleSighting[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedIndividuals, setSelectedIndividuals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEstimated, setIsEstimated] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const data = await loadAllSightings();
      setSightings(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Start autoplay when selection changes
  useEffect(() => {
    if (selectedIndividuals.length > 0) {
      setIsPlaying(true);
    }
  }, [selectedIndividuals]);

  // Handle click anywhere to toggle play/pause
  const handleGlobalClick = () => {
    if (selectedIndividuals.length > 0) {
      setIsPlaying(prev => !prev);
    }
  };

  // Update the estimation status when positions change
  useEffect(() => {
    if (!selectedDate) return;
    const positions = findPositionsForDate(selectedDate, sightings, selectedIndividuals);
    setIsEstimated(positions.some(p => !p.isActualSighting));
  }, [selectedDate, sightings, selectedIndividuals]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Add console.log to check if sightings data is available
  console.log('Sightings data:', sightings);

  return (
    <div 
      onClick={handleGlobalClick}
      className="map-page"
    >
      {/* Map Base Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <MapContainer 
          sightings={sightings}
          selectedDate={selectedDate}
          selectedIndividuals={selectedIndividuals}
          showPaths={true}
          isPlaying={isPlaying}
          onDateChange={setSelectedDate}
        />
      </div>

      {/* UI Overlay Layer */}
      <div 
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        onClick={e => e.stopPropagation()} // Prevent clicks on UI from triggering play/pause
      >
        {/* Whale Selector - top right */}
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          right: '1rem', 
          pointerEvents: 'auto',
          zIndex: 1000
        }}>
          {/* Add debug render to verify component is being rendered */}
          {/* <div className="text-white">Debug: Whale Selector</div> */}
          <IndividualFilter 
            sightings={sightings}
            onFilterChange={setSelectedIndividuals}
          />
        </div>

        {/* Timeline - bottom center */}
        <div style={{ 
          position: 'absolute', 
          bottom: '2rem', 
          left: '50%', 
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: '600px',
          pointerEvents: 'auto',
          zIndex: 1000
        }}>
          <Timeline 
            sightings={sightings}
            onDateChange={setSelectedDate}
            isPlaying={isPlaying}
            isEstimated={isEstimated}
          />
        </div>
      </div>
    </div>
  );
} 