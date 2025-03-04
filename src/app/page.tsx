'use client';

import { useState, useEffect } from 'react';
import MapContainer from '@/components/Map/MapContainer';
import IndividualFilter from '@/components/Filters/IndividualFilter';
import Timeline from '@/components/Timeline/Timeline';
import { WhaleSighting } from '@/types/sighting';
import { loadAllSightings } from '@/services/utils/yearlyDataLoader';

export default function Home() {
  const [sightings, setSightings] = useState<WhaleSighting[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedIndividuals, setSelectedIndividuals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await loadAllSightings();
      setSightings(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Add console.log to check if sightings data is available
  console.log('Sightings data:', sightings);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Map Base Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <MapContainer 
          sightings={sightings}
          selectedDate={selectedDate}
          selectedIndividuals={selectedIndividuals}
          showPaths={true}
        />
      </div>

      {/* UI Overlay Layer */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* Whale Selector - top right */}
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          right: '1rem', 
          pointerEvents: 'auto',
          zIndex: 1000
        }}>
          {/* Add debug render to verify component is being rendered */}
          <div className="text-white">Debug: Whale Selector</div>
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
          />
        </div>
      </div>
    </div>
  );
} 