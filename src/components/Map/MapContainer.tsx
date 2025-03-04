'use client';

/// <reference types="google.maps" />

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { WhaleSighting } from '@/types/sighting';

interface MapContainerProps {
  sightings: WhaleSighting[];
  selectedDate?: Date;
  selectedIndividuals?: string[];
  showPaths?: boolean;
  isPlaying: boolean;
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

// Update the findPositionForDate function to handle multiple whales
const findPositionsForDate = (
  date: Date,
  sightings: WhaleSighting[],
  selectedIndividuals: string[] = []
): Array<{
  position: { lat: number; lng: number };
  matrilines: string[];
  isActualSighting: boolean;
}> => {
  // Group sightings by matriline
  const matrilineGroups = new Map<string, WhaleSighting[]>();
  
  sightings.forEach(sighting => {
    sighting.matrilines.forEach(matriline => {
      const existing = matrilineGroups.get(matriline) || [];
      matrilineGroups.set(matriline, [...existing, sighting]);
    });
  });

  // For each matriline, find its position on the given date
  const positions: Array<{
    position: { lat: number; lng: number };
    matrilines: string[];
    isActualSighting: boolean;
  }> = [];

  // Process all matrilines if none selected, otherwise only process selected ones
  const matrilinesToProcess = selectedIndividuals.length > 0 
    ? selectedIndividuals 
    : Array.from(matrilineGroups.keys());

  matrilinesToProcess.forEach(matriline => {
    const matrilineSightings = matrilineGroups.get(matriline) || [];
    if (matrilineSightings.length === 0) return;

    // Sort sightings by date
    matrilineSightings.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Find surrounding sightings
    const exactSighting = matrilineSightings.find(s => 
      new Date(s.timestamp).toDateString() === date.toDateString()
    );

    if (exactSighting) {
      positions.push({
        position: exactSighting.location,
        matrilines: exactSighting.matrilines,
        isActualSighting: true
      });
      return;
    }

    const prevSighting = matrilineSightings
      .filter(s => new Date(s.timestamp) <= date)
      .pop();
    const nextSighting = matrilineSightings
      .find(s => new Date(s.timestamp) > date);

    if (!prevSighting || !nextSighting) return;

    // Calculate interpolated position
    const prevTime = new Date(prevSighting.timestamp).getTime();
    const nextTime = new Date(nextSighting.timestamp).getTime();
    const currentTime = date.getTime();
    
    const fraction = (currentTime - prevTime) / (nextTime - prevTime);
    const points = interpolatePoints(prevSighting.location, nextSighting.location, 20);
    const index = Math.floor(fraction * points.length);
    
    positions.push({
      position: points[Math.min(index, points.length - 1)],
      matrilines: [matriline],
      isActualSighting: false
    });
  });

  return positions;
};

// Replace the mapStyle object with an array of style rules
const mapStyles = [
  {
    // Water styling
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      { color: '#b3d1ff' }  // Light blue water
    ]
  },
  {
    // Land styling
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [
      { color: '#f5f5f5' }  // Light gray land
    ]
  },
  {
    // Remove road labels
    featureType: 'road',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    // Simplify roads
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      { visibility: 'simplified' },
      { color: '#ffffff' }
    ]
  },
  {
    // Remove POIs
    featureType: 'poi',
    stylers: [{ visibility: 'off' }]
  },
  {
    // Administrative boundaries
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ visibility: 'simplified' }]
  }
];

const MapContainer = ({ sightings, selectedDate, selectedIndividuals = [], showPaths = false, isPlaying }: MapContainerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const pathsRef = useRef<any[]>([]);

  // Initial map setup
  useEffect(() => {
    if (!mapRef.current) return;

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
    });

    loader.load().then(() => {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 48.8, lng: -123.5 },
        zoom: 8,
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      mapInstanceRef.current = map;
    });

    return () => {
      markersRef.current.forEach(marker => marker?.setMap(null));
      markersRef.current = [];
    };
  }, []);

  // Handle marker and path updates
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers and paths
    markersRef.current.forEach(marker => marker.setMap(null));
    pathsRef.current.forEach(path => path.setMap(null));
    markersRef.current = [];
    pathsRef.current = [];

    if (selectedDate) {
      const positions = findPositionsForDate(selectedDate, sightings, selectedIndividuals);
      const currentMarkers = positions.map(({ position, matrilines }) => 
        new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          icon: {
            url: matrilines.some(m => m.startsWith('T18')) 
              ? '/images/orca-icon.png'
              : '/images/orca-icon2.png',
            scaledSize: new window.google.maps.Size(40, 40),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(20, 20)
          },
          title: `Whales: ${matrilines.join(', ')}`
        })
      );

      markersRef.current = currentMarkers;

      if (showPaths) {
        // Add path creation logic here
        // ...
      }
    }
  }, [sightings, selectedDate, selectedIndividuals, showPaths]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
    />
  );
};

export default MapContainer; 