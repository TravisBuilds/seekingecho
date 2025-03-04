'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WhaleSighting } from '@/types/sighting';
import { format, eachDayOfInterval, startOfYear, endOfYear } from 'date-fns';

interface TimelineProps {
  sightings: WhaleSighting[];
  onDateChange: (date: Date | undefined) => void;
}

const PLAYBACK_INTERVAL = 250; // 4x speed (1000ms / 4)

const Timeline = ({ sightings, onDateChange }: TimelineProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
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
    <div className="w-full px-16 flex items-center">
      <button 
        onClick={() => setIsPlaying(prev => !prev)}
        className="w-12 h-12 rounded-full bg-black flex items-center justify-center mr-6 shrink-0"
      >
        {isPlaying ? (
          <span className="text-white text-2xl">⏸</span>
        ) : (
          <span className="text-white text-2xl">▶</span>
        )}
      </button>

      <div className="flex-1 h-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg">
        <input 
          type="range"
          min={0}
          max={allDates.length - 1}
          value={currentIndex}
          onChange={(e) => handleDateChange(parseInt(e.target.value))}
          className="w-full h-full appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
        />
      </div>
    </div>
  );
};

export default Timeline; 