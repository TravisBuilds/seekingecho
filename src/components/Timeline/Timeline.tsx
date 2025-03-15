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

  return (
    <Box className="w-full px-16" sx={{ marginBottom: '5%' }}>
      <Box className="relative h-6">
        <Box className="absolute inset-x-0 bg-white/80 backdrop-blur-sm rounded-full shadow-lg h-full flex items-center">
          <Slider
            min={0}
            max={allDates.length - 1}
            value={currentIndex}
            onChange={(_, value) => handleDateChange(value as number)}
            sx={{
              padding: '4px 12px !important',
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                bgcolor: 'black',
              },
              '& .MuiSlider-track': {
                bgcolor: 'black',
                height: 2,
              },
              '& .MuiSlider-rail': {
                bgcolor: 'rgba(0,0,0,0.2)',
                height: 2,
              }
            }}
          />
        </Box>
      </Box>
      <div className="text-center mt-2 text-sm font-medium text-gray-600">
        {allDates[currentIndex] ? format(allDates[currentIndex], 'MMMM d, yyyy') : ''}
        {isEstimated && " (Estimated)"}
      </div>
    </Box>
  );
};

export default Timeline; 