'use client';

import { useState, useEffect } from 'react';
import MapContainer from '@/components/Map/MapContainer';
import IndividualFilter from '@/components/Filters/IndividualFilter';
import Timeline from '@/components/Timeline/Timeline';
import { WhaleSighting } from '@/types/sighting';
import { loadAllSightings } from '@/services/utils/yearlyDataLoader';

export default function MapPage() {
  const [sightings, setSightings] = useState<WhaleSighting[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedIndividuals, setSelectedIndividuals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div 
      onClick={handleGlobalClick}
      className="w-screen h-screen relative overflow-hidden"
    >
      {/* Map Base Layer */}
      <div className="absolute inset-0">
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
        className="absolute inset-0 pointer-events-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Whale Selector - top right */}
        <div className="absolute top-4 right-4 pointer-events-auto z-10">
          <IndividualFilter 
            sightings={sightings}
            onFilterChange={setSelectedIndividuals}
          />
        </div>

        {/* Timeline - bottom center */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-4/5 max-w-2xl pointer-events-auto z-10">
          <Timeline 
            sightings={sightings}
            onDateChange={setSelectedDate}
            isPlaying={isPlaying}
          />
        </div>
      </div>
    </div>
  );
} 