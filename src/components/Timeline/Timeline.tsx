'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { WhaleSighting } from '@/types/sighting';
import { format } from 'date-fns';

interface TimelineProps {
  sightings: WhaleSighting[];
  onDateChange: (date: Date | undefined) => void;
}

const Timeline = ({ sightings, onDateChange }: TimelineProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Get unique dates once
  const dates = useMemo(() => {
    return Array.from(new Set(
      sightings.map(s => new Date(s.timestamp).toDateString())
    )).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
  }, [sightings]);

  // Find current index based on selected date
  const currentIndex = useMemo(() => {
    if (!selectedDate) return 0;
    return Math.max(0, dates.findIndex(
      date => date.toDateString() === selectedDate.toDateString()
    ));
  }, [dates, selectedDate]);

  // Handle date changes
  const handleDateChange = useCallback((index: number) => {
    const newDate = dates[index];
    setSelectedDate(newDate);
    onDateChange(newDate);
  }, [dates, onDateChange]);

  // Handle playback
  useEffect(() => {
    if (!isPlaying || dates.length === 0) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % dates.length;
      handleDateChange(nextIndex);
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, dates, currentIndex, handleDateChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setIsPlaying(prev => !prev)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <input 
          type="range"
          min={0}
          max={dates.length - 1}
          value={currentIndex}
          onChange={(e) => handleDateChange(parseInt(e.target.value))}
          className="flex-1 mx-4"
        />

        <select 
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
          className="p-2 border rounded"
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
      </div>

      <div className="text-center text-sm">
        {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
      </div>
    </div>
  );
};

export default Timeline; 