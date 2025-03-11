'use client';

/// <reference types="google.maps" />

import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { WhaleSighting } from '@/types/sighting';
import { mapStyles } from './mapStyles';

interface MapContainerProps {
  sightings: WhaleSighting[];
  selectedDate: Date | undefined;
  selectedIndividuals: string[];
  showPaths: boolean;
  isPlaying: boolean;
  onDateChange: (date: Date) => void;
}

interface Position {
  position: google.maps.LatLngLiteral;
  matrilines: string[];
  isActualSighting: boolean;
}

// Check if a point is in water (rough Salish Sea boundaries)
const isInWater = (lat: number, lng: number): boolean => {
  // Rough boundaries of the Salish Sea and connected waters
  const boundaries = [
    { minLat: 47.0, maxLat: 50.0, minLng: -125.0, maxLng: -122.0 }, // Main Salish Sea
    { minLat: 49.0, maxLat: 49.5, minLng: -123.5, maxLng: -122.5 }, // Burrard Inlet
    { minLat: 49.3, maxLat: 49.7, minLng: -123.5, maxLng: -123.0 }  // Howe Sound
  ];

  return boundaries.some(b => 
    lat >= b.minLat && lat <= b.maxLat && 
    lng >= b.minLng && lng <= b.maxLng
  );
};

// Interpolate between two points, keeping path in water
const interpolatePoints = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  steps: number
): Array<{ lat: number; lng: number }> => {
  const points: Array<{ lat: number; lng: number }> = [];
  
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    
    // Try direct interpolation first
    let lat = start.lat + (end.lat - start.lat) * fraction;
    let lng = start.lng + (end.lng - start.lng) * fraction;
    
    // If point is not in water, try to find nearest water point
    if (!isInWater(lat, lng)) {
      // Add slight curve toward deeper water
      const midPoint = {
        lat: (start.lat + end.lat) / 2,
        lng: (start.lng + end.lng) / 2
      };
      
      // Adjust midpoint toward deeper water
      if (midPoint.lng > -123.5) { // If too close to shore
        midPoint.lng -= 0.2; // Move west toward deeper water
      }
      
      // Recalculate interpolation with curved path
      lat = start.lat + (2 * (midPoint.lat - start.lat) * fraction) * (1 - fraction) + 
           (end.lat - start.lat) * fraction * fraction;
      lng = start.lng + (2 * (midPoint.lng - start.lng) * fraction) * (1 - fraction) + 
           (end.lng - start.lng) * fraction * fraction;
    }
    
    points.push({ lat, lng });
  }
  
  return points;
};

// Add a type for valid matrilines
type Matriline = 'T18' | 'T19' | 'OTHER';

// Helper function to determine matriline type
const getMatrilineType = (matrilines: string[]): Matriline => {
  if (matrilines.some(m => m.startsWith('T18'))) return 'T18';
  if (matrilines.some(m => m.startsWith('T19'))) return 'T19';
  return 'OTHER';
};

// Get icon URL based on matriline type
const getIconUrl = (matrilineType: Matriline): string => {
  switch (matrilineType) {
    case 'T18':
      return '/images/orca-icon.png';
    case 'T19':
      return '/images/orca-icon2.png';
    default:
      return '/images/orca-icon3.png';
  }
};

// Update the findPositionsForDate function to filter out land positions
const findPositionsForDate = (
  date: Date,
  sightings: WhaleSighting[],
  selectedIndividuals: string[] = []
): Array<{
  position: { lat: number; lng: number };
  matrilines: string[];
  isActualSighting: boolean;
}> => {
  const dateStr = date.toDateString();
  const positions = new Map<string, {
    position: { lat: number; lng: number };
    matrilines: string[];
    isActualSighting: boolean;
  }>();

  // Filter sightings for selected individuals
  const filteredSightings = selectedIndividuals.length > 0
    ? sightings.filter(s => {
        return s.matrilines.some(m => selectedIndividuals.includes(m)) &&
               isInWater(s.location.lat, s.location.lng); // Check if in water
      })
    : sightings.filter(s => isInWater(s.location.lat, s.location.lng)); // Check if in water

  // Process exact matches first
  const exactMatches = filteredSightings.filter(s => 
    new Date(s.timestamp).toDateString() === dateStr
  );

  // Process exact matches first
  exactMatches.forEach(sighting => {
    // Only process matrilines that are selected (or all if none selected)
    const relevantMatrilines = selectedIndividuals.length > 0
      ? sighting.matrilines.filter(m => selectedIndividuals.includes(m))
      : sighting.matrilines;

    relevantMatrilines.forEach(matriline => {
      const familyKey = matriline.startsWith('T18') ? 'T18' : 
                       matriline.startsWith('T19') ? 'T19' : 'OTHER';

      if (!positions.has(familyKey)) {
        positions.set(familyKey, {
          position: sighting.location,
          matrilines: [matriline],
          isActualSighting: true
        });
      }
    });
  });

  // For interpolation, ensure all points are in water
  const familiesToProcess = selectedIndividuals.length > 0
    ? [...new Set(selectedIndividuals.map(m => m.startsWith('T18') ? 'T18' : 
                                             m.startsWith('T19') ? 'T19' : 'OTHER'))]
    : ['T18', 'T19', 'OTHER'];

  familiesToProcess.forEach(family => {
    if (positions.has(family)) return;

    const familySightings = filteredSightings
      .filter(s => s.matrilines.some(m => 
        family === 'T18' ? m.startsWith('T18') :
        family === 'T19' ? m.startsWith('T19') :
        (!m.startsWith('T18') && !m.startsWith('T19'))
      ))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const prevSighting = familySightings
      .filter(s => new Date(s.timestamp) <= date)
      .pop();
    const nextSighting = familySightings
      .find(s => new Date(s.timestamp) > date);

    if (prevSighting && nextSighting) {
      const prevTime = new Date(prevSighting.timestamp).getTime();
      const nextTime = new Date(nextSighting.timestamp).getTime();
      const currentTime = date.getTime();
      
      const fraction = (currentTime - prevTime) / (nextTime - prevTime);
      const points = interpolatePoints(prevSighting.location, nextSighting.location, 20);
      const index = Math.floor(fraction * points.length);
      
      const interpolatedPosition = points[Math.min(index, points.length - 1)];
      
      // Only add the position if it's in water
      if (isInWater(interpolatedPosition.lat, interpolatedPosition.lng)) {
        positions.set(family, {
          position: interpolatedPosition,
          matrilines: familySightings[0].matrilines.filter(m => m.startsWith(family)),
          isActualSighting: false
        });
      }
    }
  });

  return Array.from(positions.values());
};

const MapContainer = ({ 
  sightings, 
  selectedDate, 
  selectedIndividuals = [], 
  showPaths = false, 
  isPlaying,
  onDateChange 
}: MapContainerProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Initial map setup
  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
    });

    loader.load().then((google) => {
      const map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
        center: { lat: 48.5, lng: -123.3 },
        zoom: 9,
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: true
      });

      mapRef.current = map;
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, []);

  // Handle markers update
  useEffect(() => {
    if (!mapRef.current || !selectedDate) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const positions = findPositionsForDate(selectedDate, sightings, selectedIndividuals);
    
    // Create new markers
    markersRef.current = positions.map(({ position, matrilines, isActualSighting }) => {
      const matrilineType = getMatrilineType(matrilines);
      const iconUrl = getIconUrl(matrilineType);

      return new google.maps.Marker({
        position,
        map: mapRef.current!,
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(40, 40),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(20, 20)
        },
        title: `${matrilines.join(', ')}${!isActualSighting ? ' (Estimated)' : ''}`
      });
    });
  }, [selectedDate, sightings, selectedIndividuals]);

  // Handle animation with controlled timing
  useEffect(() => {
    if (!isPlaying || !selectedDate || selectedIndividuals.length === 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const FRAME_RATE = 1000; // Update every 1 second
    let currentDate = new Date(selectedDate);

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateTimeRef.current >= FRAME_RATE) {
        // Update the date
        currentDate.setDate(currentDate.getDate() + 1);
        
        // Reset to earliest date if we've gone past the latest date
        if (currentDate > new Date()) {
          currentDate = new Date(Math.min(...sightings.map(s => new Date(s.timestamp).getTime())));
        }

        onDateChange(new Date(currentDate));
        lastUpdateTimeRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastUpdateTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, selectedDate, selectedIndividuals, onDateChange, sightings]);

  return (
    <div 
      id="map" 
      className="w-full h-full"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
};

export default MapContainer; 