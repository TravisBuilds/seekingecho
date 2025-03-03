'use client';

import { useEffect, useState } from 'react';
import MapContainer from '@/components/Map/MapContainer';
import FilterPanel from '@/components/Filters/FilterPanel';
import IndividualFilter from '@/components/Filters/IndividualFilter';
import Timeline from '@/components/Timeline/Timeline';
import { WhaleSighting } from '@/types/sighting';
import { loadAllSightings } from '@/services/utils/yearlyDataLoader';

export default function Home() {
  const [sightings, setSightings] = useState<WhaleSighting[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedIndividuals, setSelectedIndividuals] = useState<string[]>([]);
  const [showPaths, setShowPaths] = useState(true);
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
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Loading sighting data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-blue-900 text-white p-4">
        <h1 className="text-2xl font-bold">Seeking Echo</h1>
        <p className="text-sm">T18 Matriline Whale Tracking</p>
      </header>
      
      <div className="flex flex-1 h-[calc(100vh-4rem)]">
        <aside className="w-80 bg-white shadow-lg p-4 overflow-y-auto">
          <div className="space-y-6">
            <IndividualFilter 
              sightings={sightings}
              onFilterChange={setSelectedIndividuals}
            />
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showPaths}
                  onChange={(e) => setShowPaths(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span>Show Movement Paths</span>
              </label>
            </div>
          </div>
        </aside>
        
        <main className="flex-1 relative flex flex-col">
          <div className="flex-1">
            <MapContainer 
              sightings={sightings}
              selectedDate={selectedDate}
              selectedIndividuals={selectedIndividuals}
              showPaths={showPaths}
            />
          </div>
          <div className="h-24 bg-white/90 p-4">
            <Timeline 
              sightings={sightings}
              onDateChange={setSelectedDate}
            />
          </div>
        </main>
      </div>
    </div>
  );
} 