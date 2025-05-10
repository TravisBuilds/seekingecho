'use client';

import { useState, useEffect, useMemo } from 'react';
import MapContainer from '@/components/Map/MapContainer';
import IndividualFilter from '@/components/Filters/IndividualFilter';
import Timeline from '@/components/Timeline/Timeline';
import { WhaleSighting } from '@/types/sighting';
import { findPositionsForDate } from '@/utils/positionUtils';
import { useSightings } from '@/hooks/useSightings';

export default function MapPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedIndividuals, setSelectedIndividuals] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEstimated, setIsEstimated] = useState(false);

  // Use our new hook to fetch sightings with stable filters
  const filters = useMemo(() => ({
    dateRange: { start: null, end: null },
    location: '',
    groupSize: { min: 0, max: 100 },
    matrilines: [],
    showPath: true
  }), []);

  const { sightings, loading, error } = useSightings(filters);

  // Set initial date when sightings are loaded
  useEffect(() => {
    if (sightings.length > 0 && !selectedDate) {
      const firstDate = new Date(Math.min(...sightings.map(s => new Date(s.timestamp).getTime())));
      console.log('Setting initial date:', firstDate);
      setSelectedDate(firstDate);
    }
  }, [sightings, selectedDate]);

  // Debug sightings data
  useEffect(() => {
    console.log('Sightings loaded:', sightings.length);
    if (sightings.length > 0) {
      console.log('First sighting:', sightings[0]);
      console.log('Date range:', {
        start: new Date(Math.min(...sightings.map(s => new Date(s.timestamp).getTime()))),
        end: new Date(Math.max(...sightings.map(s => new Date(s.timestamp).getTime())))
      });
    }
  }, [sightings]);

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
    if (!selectedDate || !sightings.length) return;
    const positions = findPositionsForDate(selectedDate, sightings, selectedIndividuals);
    setIsEstimated(positions.some(p => !p.isActualSighting));
  }, [selectedDate, sightings, selectedIndividuals]);

  // Memoize the MapContainer to prevent unnecessary remounts
  const mapComponent = useMemo(() => (
    <MapContainer 
      sightings={sightings}
      selectedDate={selectedDate}
      selectedIndividuals={selectedIndividuals}
      showPaths={true}
      isPlaying={isPlaying}
      onDateChange={setSelectedDate}
    />
  ), [sightings, selectedDate, selectedIndividuals, isPlaying, setSelectedDate]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mb-2">Loading sightings data...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <div className="text-red-500 text-center">
          <div>Error loading data:</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 w-screen h-screen"
      onClick={handleGlobalClick}
    >
      {/* Map Base Layer */}
      <div className="absolute inset-0">
        {mapComponent}
      </div>

      {/* UI Overlay Layer */}
      <div 
        className="absolute inset-0 pointer-events-none"
      >
        {/* Whale Selector - top right */}
        <div className="absolute top-4 right-4 pointer-events-auto z-10" onClick={e => e.stopPropagation()}>
          <IndividualFilter 
            sightings={sightings}
            onFilterChange={setSelectedIndividuals}
          />
        </div>

        {/* Timeline - bottom center */}
        <div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-4/5 max-w-2xl pointer-events-auto z-10"
          onClick={e => e.stopPropagation()}
        >
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