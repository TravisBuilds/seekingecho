'use client';

/// <reference types="google.maps" />

import { useEffect, useRef, useState } from 'react';
import { WhaleSighting } from '@/types/sighting';
import { mapStyles } from './mapStyles';
import { mapsLoader } from '@/utils/maps';

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

// Check if a point is in water (ocean areas and bays of the Salish Sea)
const isInWater = (lat: number, lng: number): boolean => {
  // Define specific ocean areas and bays where whales can be
  const waterAreas = [
    // Main Salish Sea (comprehensive coverage)
    { minLat: 47.0, maxLat: 50.5, minLng: -125.5, maxLng: -122.0,
      name: 'Salish Sea' },

    // West Coast Vancouver Island
    { minLat: 48.0, maxLat: 50.5, minLng: -127.0, maxLng: -125.0,
      name: 'West Coast Vancouver Island' },

    // Puget Sound and Approaches
    { minLat: 47.0, maxLat: 48.5, minLng: -123.0, maxLng: -122.0,
      name: 'Puget Sound' },

    // San Juan Islands and Gulf Islands
    { minLat: 48.3, maxLat: 49.0, minLng: -123.3, maxLng: -122.7,
      name: 'San Juan and Gulf Islands' },

    // Northern Waters (Discovery Passage to Johnstone Strait)
    { minLat: 49.8, maxLat: 51.0, minLng: -125.5, maxLng: -124.0,
      name: 'Northern Waters' },

    // Desolation Sound
    { minLat: 49.8, maxLat: 50.3, minLng: -124.8, maxLng: -124.0,
      name: 'Desolation Sound' },

    // Inside Passage
    { minLat: 50.0, maxLat: 51.0, minLng: -125.5, maxLng: -124.5,
      name: 'Inside Passage' },

    // Additional Coverage Areas
    { minLat: 47.5, maxLat: 49.5, minLng: -127.0, maxLng: -122.0,
      name: 'Extended Coverage' }
  ];

  // Check if point is in any of the defined water areas
  const matchingArea = waterAreas.find(area => 
    lat >= area.minLat && lat <= area.maxLat && 
    lng >= area.minLng && lng <= area.maxLng
  );

  if (matchingArea) {
    console.log('Position is in water area:', matchingArea.name);
    return true;
  }

  console.log('Position is not in any known water area:', { lat, lng });
  return false;
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
      // Add curve toward deeper water (Strait of Georgia)
      const midPoint = {
        lat: (start.lat + end.lat) / 2,
        lng: (start.lng + end.lng) / 2
      };
      
      // Adjust midpoint toward Strait of Georgia
      if (midPoint.lng > -123.5) {
        midPoint.lng -= 0.2; // Move west toward strait
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
type Matriline = 'T18' | 'T19';

// Helper function to get matriline type
const getMatrilineType = (id: string): Matriline | null => {
  if (id.startsWith('T18')) return 'T18';
  if (id.startsWith('T19')) return 'T19';
  return null;
};

// Get icon URL based on matriline type
const getIconUrl = (matrilineType: Matriline): string => {
  console.log('Getting icon for matriline:', matrilineType);
  // Use absolute paths for icons
  const iconPath = matrilineType === 'T18' ? '/images/orca-icon.png' : '/images/orca-icon2.png';
  console.log('Icon path:', iconPath);
  return iconPath;
};

// Update the findPositionsForDate function to filter out land positions
const findPositionsForDate = (
  date: Date,
  sightings: WhaleSighting[],
  selectedIndividuals: string[] = []
): Position[] => {
  const dateStr = date.toDateString();
  const positions = new Map<Matriline, Position>();

  // Only process selected families (or both if none selected)
  const familiesToProcess: Matriline[] = selectedIndividuals.length > 0
    ? Array.from(new Set(
        selectedIndividuals
          .map(getMatrilineType)
          .filter((type): type is Matriline => type !== null)
      ))
    : ['T18', 'T19'];

  // Process exact matches first
  const exactMatches = sightings.filter(s => 
    new Date(s.date).toDateString() === dateStr &&
    s.matrilines.some(m => 
      familiesToProcess.some(family => m.startsWith(family)) &&
      (selectedIndividuals.length === 0 || selectedIndividuals.includes(m))
    )
  );

  // Try to find exact matches for each family
  familiesToProcess.forEach(family => {
    const familyExactMatch = exactMatches.find(s => 
      s.matrilines.some(m => m.startsWith(family)) &&
      s.startLocation && isInWater(s.startLocation.lat, s.startLocation.lng)
    );

    if (familyExactMatch && familyExactMatch.startLocation) {
      positions.set(family, {
        position: familyExactMatch.startLocation,
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
        s.startLocation && isInWater(s.startLocation.lat, s.startLocation.lng)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const prevSighting = familySightings
      .filter(s => new Date(s.date) <= date)
      .pop();
    const nextSighting = familySightings
      .find(s => new Date(s.date) > date);

    if (prevSighting && nextSighting && prevSighting.startLocation && nextSighting.startLocation) {
      const prevTime = new Date(prevSighting.date).getTime();
      const nextTime = new Date(nextSighting.date).getTime();
      const currentTime = date.getTime();
      
      const fraction = (currentTime - prevTime) / (nextTime - prevTime);
      const points = interpolatePoints(prevSighting.startLocation, nextSighting.startLocation, 20);
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

// Find nearest water point using a spiral search pattern
const findNearestWaterPoint = (lat: number, lng: number, maxAttempts: number = 20): google.maps.LatLngLiteral => {
  if (isInWater(lat, lng)) {
    return { lat, lng };
  }

  // Search in an expanding spiral pattern
  const searchSteps = [0.01, 0.02, 0.05, 0.1]; // Different step sizes in degrees
  const directions = [
    [0, 1],   // North
    [1, 0],   // East
    [0, -1],  // South
    [-1, 0],  // West
    [1, 1],   // Northeast
    [-1, 1],  // Northwest
    [-1, -1], // Southwest
    [1, -1]   // Southeast
  ];

  for (const step of searchSteps) {
    for (const [dlat, dlng] of directions) {
      const newLat = lat + (dlat * step);
      const newLng = lng + (dlng * step);
      
      if (isInWater(newLat, newLng)) {
        console.log('Found water point:', {
          original: { lat, lng },
          adjusted: { lat: newLat, lng: newLng },
          distance: Math.sqrt(Math.pow(lat - newLat, 2) + Math.pow(lng - newLng, 2))
        });
        return { lat: newLat, lng: newLng };
      }
    }
  }

  // If no water point found, return the closest point in the Strait of Georgia
  const straitOfGeorgia = { minLat: 48.7, maxLat: 50.0, minLng: -124.0, maxLng: -123.0 };
  const closestLat = Math.max(straitOfGeorgia.minLat, Math.min(straitOfGeorgia.maxLat, lat));
  const closestLng = Math.max(straitOfGeorgia.minLng, Math.min(straitOfGeorgia.maxLng, lng));
  
  console.log('Falling back to Strait of Georgia point:', {
    original: { lat, lng },
    adjusted: { lat: closestLat, lng: closestLng }
  });
  
  return { lat: closestLat, lng: closestLng };
};

// Add type declaration for Google Maps error handler
declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

const MapContainer = ({ 
  sightings, 
  selectedDate, 
  selectedIndividuals = [], 
  showPaths = false, 
  isPlaying,
  onDateChange 
}: MapContainerProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boundsSet, setBoundsSet] = useState(false);

  // Update map options to show more of Vancouver Island
  const mapOptions: google.maps.MapOptions = {
    center: { lat: 49.5, lng: -126.0 },
    zoom: 7,
    mapTypeId: 'roadmap',
    disableDefaultUI: true,
    styles: mapStyles,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    minZoom: 7,
    maxZoom: 12,
    restriction: {
      latLngBounds: {
        north: 51.0,
        south: 47.0,
        west: -128.0,
        east: -122.0
      },
      strictBounds: true
    }
  };

  // Initial map setup
  useEffect(() => {
    console.log('Starting map initialization...');
    
    const initMap = async () => {
      if (!mapContainerRef.current) {
        console.error('Map container ref is null');
        return;
      }

      try {
        console.log('Loading Google Maps API...');
        const google = await mapsLoader.load();
        console.log('Google Maps API loaded successfully');

        // Create map instance
        console.log('Creating map instance...');
        const map = new google.maps.Map(mapContainerRef.current, mapOptions);

        // Wait for the map to be ready
        await new Promise<void>((resolve) => {
          google.maps.event.addListenerOnce(map, 'idle', () => {
            console.log('Map is ready');
            mapRef.current = map;
            setIsLoaded(true);
            resolve();
          });
        });

      } catch (error) {
        const errorMsg = error instanceof Error 
          ? `Error initializing Google Maps: ${error.message}`
          : 'An unknown error occurred while initializing Google Maps';
        console.error(errorMsg);
        setError(errorMsg);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, []);

  // Set initial bounds based on all sightings
  useEffect(() => {
    if (!mapRef.current || !sightings.length || boundsSet) return;

    const map = mapRef.current;
    const bounds = new google.maps.LatLngBounds();

    // Add all sighting locations to bounds
    sightings.forEach(sighting => {
      if (sighting.startLocation && isInWater(sighting.startLocation.lat, sighting.startLocation.lng)) {
        bounds.extend(sighting.startLocation);
      }
      if (sighting.endLocation && isInWater(sighting.endLocation.lat, sighting.endLocation.lng)) {
        bounds.extend(sighting.endLocation);
      }
    });

    // Add padding to the bounds
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latPadding = (ne.lat() - sw.lat()) * 0.1;
    const lngPadding = (ne.lng() - sw.lng()) * 0.1;
    bounds.extend(new google.maps.LatLng(ne.lat() + latPadding, ne.lng() + lngPadding));
    bounds.extend(new google.maps.LatLng(sw.lat() - latPadding, sw.lng() - lngPadding));

    map.fitBounds(bounds);
    setBoundsSet(true);
    
    console.log('Set initial map bounds:', bounds.toJSON());
  }, [sightings, boundsSet]);

  // Add logging for incoming props
  useEffect(() => {
    console.log('MapContainer received props:', {
      sightingsCount: sightings.length,
      selectedDate: selectedDate?.toISOString(),
      selectedIndividuals,
      showPaths,
      isPlaying,
      sightingsSample: sightings.slice(0, 2)
    });
  }, [sightings, selectedDate, selectedIndividuals, showPaths, isPlaying]);

  // Handle markers update
  useEffect(() => {
    if (!mapRef.current || !selectedDate) {
      console.log('Map or date not ready for markers:', {
        mapReady: !!mapRef.current,
        selectedDate,
        sightingsAvailable: sightings.length > 0
      });
      return;
    }

    const map = mapRef.current;
    
    // Validate the date
    let dateString;
    try {
      dateString = selectedDate.toISOString();
    } catch (error) {
      console.error('Invalid date:', selectedDate);
      return;
    }

    console.log('Starting marker update with:', {
      selectedDate: dateString,
      selectedIndividuals,
      sightingsCount: sightings.length,
      sightingDates: sightings.map(s => s.date).slice(0, 5) // Show first 5 dates
    });

    // Clear existing markers
    const markerCount = markersRef.current.length;
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    console.log(`Cleared ${markerCount} existing markers`);

    // Ensure we have a valid date object for comparison
    const validDate = new Date(dateString);
    const positions = findPositionsForDate(validDate, sightings, selectedIndividuals);
    console.log('Found positions for date:', {
      date: validDate.toISOString(),
      count: positions.length,
      positions: positions.map(p => {
        // Find the corresponding sighting for additional data
        const sighting = sightings.find(s => 
          s.matrilines.some(m => p.matrilines.includes(m)) &&
          new Date(s.date).toDateString() === validDate.toDateString()
        );

        // If this is an estimated position, find the previous known sighting
        let groupSize = sighting?.groupSize;
        if (!p.isActualSighting && !groupSize) {
          const prevSighting = sightings
            .filter(s => 
              s.matrilines.some(m => p.matrilines.includes(m)) &&
              new Date(s.date) <= validDate
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          groupSize = prevSighting?.groupSize || 0;
        }
        
        return {
          lat: p.position.lat,
          lng: p.position.lng,
          matrilines: p.matrilines,
          isActual: p.isActualSighting,
          isInWater: isInWater(p.position.lat, p.position.lng),
          // Additional data
          groupSize: groupSize || 0,
          date: sighting?.date || 'interpolated',
          startLocation: sighting?.startLocation || p.position,
          endLocation: sighting?.endLocation
        };
      })
    });
    
    // Adjust positions to ensure they're in water and create markers
    markersRef.current = positions.map(({ position, matrilines, isActualSighting }) => {
      try {
        // Ensure position is in water
        const adjustedPosition = isInWater(position.lat, position.lng) 
          ? position 
          : findNearestWaterPoint(position.lat, position.lng);

        const matrilineType = getMatrilineType(matrilines[0]);
        if (!matrilineType) {
          console.error('Invalid matriline type for:', matrilines[0]);
          return null;
        }

        console.log('Creating marker with icon:', {
          matrilineType,
          iconUrl: getIconUrl(matrilineType),
          matrilines,
          originalPosition: position,
          adjustedPosition,
          wasAdjusted: position !== adjustedPosition
        });

        // Find the corresponding sighting or use previous known group size
        const sighting = sightings.find(s => 
          s.matrilines.some(m => matrilines.includes(m)) &&
          new Date(s.date).toDateString() === validDate.toDateString()
        );

        let groupSize = sighting?.groupSize;
        if (!isActualSighting && !groupSize) {
          const prevSighting = sightings
            .filter(s => 
              s.matrilines.some(m => matrilines.includes(m)) &&
              new Date(s.date) <= validDate
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          groupSize = prevSighting?.groupSize || 0;
        }

        // Create a basic marker first
        const marker = new google.maps.Marker({
          position: adjustedPosition,
          map: null, // Don't add to map yet
          title: `${matrilines.join(', ')}${!isActualSighting ? ' (Estimated)' : ''}\nGroup Size: ${groupSize || 0}${position !== adjustedPosition ? '\n(Adjusted to nearest water)' : ''}`,
          visible: false,
          optimized: false,
          icon: {
            url: getIconUrl(matrilineType),
            scaledSize: new google.maps.Size(40, 40),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 20)
          },
          label: {
            text: (groupSize || 0).toString(),
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        });

        // Add marker to map immediately
        marker.setMap(map);
        marker.setVisible(true);
        console.log('Marker added to map:', {
          position: marker.getPosition()?.toJSON(),
          title: marker.getTitle(),
          icon: marker.getIcon()
        });

        return marker;
      } catch (error) {
        console.error('Error creating marker:', error);
        return null;
      }
    }).filter((marker): marker is google.maps.Marker => marker !== null);

    console.log('Marker update complete:', {
      totalMarkers: markersRef.current.length,
      date: validDate.toISOString()
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
          currentDate = new Date(Math.min(...sightings.map(s => new Date(s.date).getTime())));
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
    <div className="absolute inset-0">
      <div 
        ref={mapContainerRef}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f0f0f0'
        }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80">
          <div className="text-center">
            {error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div>
                <div className="mb-2">Loading Google Maps...</div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapContainer; 