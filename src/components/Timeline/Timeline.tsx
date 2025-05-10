'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Slider, Box } from '@mui/material';
import { WhaleSighting } from '@/types/sighting';
import { format, eachDayOfInterval, startOfYear, endOfYear } from 'date-fns';

interface TimelineProps {
  sightings: WhaleSighting[];
  onDateChange: (date: Date) => void;
  isPlaying: boolean;
  isEstimated?: boolean;
}

const PLAYBACK_INTERVAL = 250; // 4x speed (1000ms / 4)

const Timeline: React.FC<TimelineProps> = ({ sightings, onDateChange, isPlaying, isEstimated }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate dates once when sightings change
  const allDates = useRef(
    sightings.length > 0
      ? eachDayOfInterval({
          start: startOfYear(new Date(Math.min(...sightings.map(s => new Date(s.timestamp).getTime())))),
          end: endOfYear(new Date(Math.max(...sightings.map(s => new Date(s.timestamp).getTime()))))
        })
      : []
  ).current;

  // Debug logs
  useEffect(() => {
    console.log('Timeline Debug:', {
      sightingsLength: sightings.length,
      allDatesLength: allDates.length,
      currentIndex,
      currentDate: allDates[currentIndex],
      firstSighting: sightings[0]?.timestamp,
      lastSighting: sightings[sightings.length - 1]?.timestamp
    });
  }, [sightings, allDates, currentIndex]);

  // Move date change to useEffect
  useEffect(() => {
    if (allDates[currentIndex]) {
      onDateChange(allDates[currentIndex]);
    }
  }, [currentIndex, allDates, onDateChange]);

  const handleDateChange = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Handle playback
  useEffect(() => {
    if (!isPlaying || allDates.length === 0) {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
      return;
    }

    const playStep = () => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % allDates.length);
      playTimeoutRef.current = setTimeout(playStep, PLAYBACK_INTERVAL);
    };

    playTimeoutRef.current = setTimeout(playStep, PLAYBACK_INTERVAL);

    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
    };
  }, [isPlaying, allDates.length]);

  // Early return if no dates
  if (allDates.length === 0) {
    return (
      <Box className="w-full px-8 flex flex-col items-center">
        <div className="text-center text-xl font-bold text-black bg-white shadow-xl rounded-xl py-3 px-8">
          No data available
        </div>
      </Box>
    );
  }

  return (
    <Box className="w-full px-4 flex flex-col items-center justify-center" sx={{ marginBottom: '0' }}>
      <div 
        className="text-center mb-4 text-2xl font-semibold text-black flex-col items-center justify-center MuiBox-root css-0"
        style={{ display: 'block', width: 'fit-content' }}
      >
        <div className="whitespace-nowrap">
          {allDates[currentIndex] ? format(allDates[currentIndex], 'MMMM d, yyyy') : 'Loading...'}
          {isEstimated && <span className="text-gray-600 text-lg ml-2">(Estimated)</span>}
        </div>
      </div>
      <Box className="relative h-5 w-full">
        <Box className="absolute inset-x-0 bg-black/5 rounded-full h-full flex items-center">
          <Slider
            min={0}
            max={Math.max(0, allDates.length - 1)}
            value={currentIndex}
            onChange={(_, value) => handleDateChange(value as number)}
            disabled={allDates.length === 0}
            sx={{
              padding: '2px 12px !important',
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                bgcolor: 'black',
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(0, 0, 0, 0.1)',
                },
              },
              '& .MuiSlider-track': {
                bgcolor: 'black',
                height: 2,
              },
              '& .MuiSlider-rail': {
                bgcolor: 'rgba(0, 0, 0, 0.1)',
                height: 2,
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Timeline; 