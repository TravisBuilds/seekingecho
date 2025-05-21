'use client';

import { useState, useEffect, useMemo } from 'react';
import { CircularProgress } from '@mui/material';
import IndividualFilter from '@/components/Filters/IndividualFilter';
import Timeline from '@/components/Timeline/Timeline';
import MapContainer from '@/components/Map/MapContainer';
import { WhaleSighting, NewSighting } from '@/types/sighting';
import { findPositionsForDate } from '@/utils/positionUtils';
import { useWhaleData } from '@/hooks/useWhaleData';
import SightingForm from '@/components/SightingForm/SightingForm';

export default function MapPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedIndividuals, setSelectedIndividuals] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEstimated, setIsEstimated] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Use our new hook to fetch sightings with stable filters
  const filters = useMemo(() => ({
    dateRange: { start: null, end: null },
    location: '',
    groupSize: { min: 0, max: 100 },
    matrilines: [],
    showPath: true
  }), []);

  const { sightings, loading, error, mutate } = useWhaleData(filters);

  // Handle new sighting submission
  const handleSightingSubmit = async (newSighting: NewSighting) => {
    try {
      console.log('Submitting new sighting:', newSighting);
      
      // Add the new sighting to the database
      const response = await fetch('/api/sightings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSighting),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to add sighting: ${errorData.message || response.statusText}`);
      }

      // Refresh the sightings data
      await mutate();
      
      // Show success message
      alert('Sighting added successfully!');
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error adding sighting:', error);
      alert('Failed to add sighting. Please try again.');
    }
  };

  // Set initial date when sightings are loaded
  useEffect(() => {
    console.log('Checking initial date setup:', {
      sightingsCount: sightings.length,
      currentSelectedDate: selectedDate?.toISOString(),
      hasData: sightings.length > 0,
      firstSighting: sightings[0]
    });

    if (sightings.length > 0 && !selectedDate) {
      const dates = sightings.map(s => new Date(s.date).getTime());
      const firstDate = new Date(Math.min(...dates));
      console.log('Setting initial date:', {
        firstDate: firstDate.toISOString(),
        allDates: dates.map(d => new Date(d).toISOString()).slice(0, 5) // Show first 5 dates
      });
      setSelectedDate(firstDate);
    }
  }, [sightings, selectedDate]);

  // Debug sightings data
  useEffect(() => {
    console.log('Sightings data updated:', {
      count: sightings.length,
      hasData: sightings.length > 0,
      firstSighting: sightings[0],
      dateRange: sightings.length > 0 ? {
        start: new Date(Math.min(...sightings.map(s => new Date(s.date).getTime()))).toISOString(),
        end: new Date(Math.max(...sightings.map(s => new Date(s.date).getTime()))).toISOString()
      } : null
    });
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
    if (!selectedDate || !sightings.length) {
      console.log('Cannot check positions - missing data:', {
        hasSelectedDate: !!selectedDate,
        selectedDateValue: selectedDate?.toISOString(),
        sightingsCount: sightings.length
      });
      return;
    }

    const positions = findPositionsForDate(selectedDate, sightings, selectedIndividuals);
    console.log('Found positions for current date:', {
      selectedDate: selectedDate.toISOString(),
      positionsCount: positions.length,
      positions,
      selectedIndividuals
    });

    setIsEstimated(positions.some(p => !p.isActualSighting));
  }, [selectedDate, sightings, selectedIndividuals]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mb-2">Loading sightings data...</div>
          <CircularProgress />
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
          className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-4/5 max-w-2xl pointer-events-auto z-[9999] mb-8"
          onClick={e => e.stopPropagation()}
          style={{ 
            minHeight: '120px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(0px)',
            borderRadius: '0px',
            padding: '30px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0)'
          }}
        >
          <Timeline 
            sightings={sightings}
            onDateChange={setSelectedDate}
            isPlaying={isPlaying}
            isEstimated={isEstimated}
          />
        </div>
      </div>

      {/* Interactive Elements Layer (outside pointer-events-none) */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Add Sighting FAB - bottom right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('FAB clicked, opening form...');
            setIsFormOpen(true);
            console.log('isFormOpen set to:', true);
          }}
          className="pointer-events-auto"
          style={{ 
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '56px',
            height: '56px',
            backgroundColor: '#2563eb',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 6px 12px rgba(37, 99, 235, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(37, 99, 235, 0.5)',
            cursor: 'pointer',
            border: 'none',
            outline: 'none',
            zIndex: 99999,
            transform: 'translateY(0)',
            transition: 'all 0.2s ease',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(2px)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(37, 99, 235, 0.5)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(37, 99, 235, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(37, 99, 235, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(37, 99, 235, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(37, 99, 235, 0.5)';
          }}
        >
          +
        </button>

        {/* Sighting Form Modal */}
        <div className="pointer-events-auto">
          <SightingForm
            isOpen={isFormOpen}
            onClose={() => {
              console.log('Closing form...');
              setIsFormOpen(false);
              console.log('isFormOpen set to:', false);
            }}
            onSubmit={handleSightingSubmit}
          />
        </div>
      </div>
    </div>
  );
} 