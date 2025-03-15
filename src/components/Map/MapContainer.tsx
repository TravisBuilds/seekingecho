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
): Position[] => {
  const dateStr = date.toDateString();
  const positions = new Map<string, Position>();

  // Only process selected families (or both if none selected)
  const familiesToProcess = selectedIndividuals.length > 0
    ? [...new Set(selectedIndividuals.map(m => 
        m.startsWith('T18') ? 'T18' : 
        m.startsWith('T19') ? 'T19' : null
      ).filter(Boolean) as string[])]
    : ['T18', 'T19'];

  // Process exact matches first
  const exactMatches = sightings.filter(s => 
    new Date(s.timestamp).toDateString() === dateStr &&
    s.matrilines.some(m => 
      familiesToProcess.some(family => m.startsWith(family)) &&
      (selectedIndividuals.length === 0 || selectedIndividuals.includes(m))
    )
  );

  // Try to find exact matches for each family
  familiesToProcess.forEach(family => {
    const familyExactMatch = exactMatches.find(s => 
      s.matrilines.some(m => m.startsWith(family)) &&
      isInWater(s.location.lat, s.location.lng)
    );

    if (familyExactMatch) {
      positions.set(family, {
        position: familyExactMatch.location,
        matrilines: familyExactMatch.matrilines.filter(m => m.startsWith(family)),
        isActualSighting: true
      });
    }
  });

  // For any family without an exact match, interpolate
  familiesToProcess.forEach(family => {
    if (positions.has(family)) return;

    const familySightings = sightings
      .filter(s => 
        s.matrilines.some(m => m.startsWith(family)) &&
        isInWater(s.location.lat, s.location.lng)
      )
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

  // Update map options to show more of Vancouver Island
  const mapOptions: google.maps.MapOptions = {
    center: { lat: 48.6, lng: -123.5 }, // Centered between Vancouver Island and mainland
    zoom: 9, // Zoom out to show more area
    styles: mapStyles,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    minZoom: 8,  // Prevent zooming out too far
    maxZoom: 12, // Prevent zooming in too close
    restriction: {
      latLngBounds: {
        north: 50.5,  // North of Vancouver Island
        south: 47.0,  // South of Olympic Peninsula
        west: -125.5, // West of Vancouver Island
        east: -122.0  // East of mainland
      },
      strictBounds: true
    }
  };

  // Initial map setup
  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
    });

    loader.load().then((google) => {
      const map = new google.maps.Map(document.getElementById('map') as HTMLElement, mapOptions);

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
      const iconUrl = matrilines.some(m => m.startsWith('T18')) ? '/images/orca-icon.png' : 
                     matrilines.some(m => m.startsWith('T19')) ? '/images/orca-icon2.png' : 
                     '/images/orca-icon3.png';

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