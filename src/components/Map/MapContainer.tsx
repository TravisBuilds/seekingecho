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
}

const MapContainer = ({ sightings, selectedDate, selectedIndividuals, showPaths = false }: MapContainerProps) => {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const pathsRef = useRef<google.maps.Polyline[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapDivRef.current || map) return;

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly'
    });

    loader.load().then(() => {
      const mapInstance = new google.maps.Map(mapDivRef.current!, {
        center: { lat: 49.2, lng: -123.5 },
        zoom: 8,
        mapTypeId: 'terrain',
        styles: [
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#004358' }]
          }
        ],
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        draggable: false,
        scrollwheel: false,
        keyboardShortcuts: false,
        clickableIcons: false,
        gestureHandling: 'none'
      });

      setMap(mapInstance);
    });
  }, [map]);

  // Update markers and paths
  useEffect(() => {
    if (!map) return;

    // Clear existing markers and paths
    markersRef.current.forEach(marker => marker.setMap(null));
    pathsRef.current.forEach(path => path.setMap(null));
    markersRef.current = [];
    pathsRef.current = [];

    // Filter sightings
    const filteredSightings = sightings.filter(sighting => {
      const sightingDate = new Date(sighting.timestamp);
      const dateMatches = !selectedDate || 
        sightingDate.toDateString() === selectedDate.toDateString();
      
      const individualsMatch = !selectedIndividuals?.length ||
        sighting.matrilines.some(id => selectedIndividuals.includes(id));

      return dateMatches && individualsMatch;
    });

    // Add markers and paths
    filteredSightings.forEach(sighting => {
      const lat = Number(sighting.location.lat);
      const lng = Number(sighting.location.lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: `${sighting.firstLocation}\nGroup size: ${sighting.groupSize}\nTime: ${sighting.firstTime}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FF0000',
            fillOpacity: 0.7,
            strokeWeight: 1,
            strokeColor: '#FFFFFF',
            labelOrigin: new google.maps.Point(calculateLabelOffset(sighting.matrilines), 0)
          },
          label: {
            text: sighting.matrilines.join(', '),
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: '500',
            className: 'marker-label'
          }
        });

        markersRef.current.push(marker);

        if (showPaths && sighting.endLocation) {
          const endLat = Number(sighting.endLocation.lat);
          const endLng = Number(sighting.endLocation.lng);

          if (!isNaN(endLat) && !isNaN(endLng)) {
            const path = new google.maps.Polyline({
              path: [
                { lat, lng },
                { lat: endLat, lng: endLng }
              ],
              map,
              geodesic: true,
              strokeColor: '#FF0000',
              strokeOpacity: 0.5,
              strokeWeight: 2
            });

            pathsRef.current.push(path);

            const endMarker = new google.maps.Marker({
              position: { lat: endLat, lng: endLng },
              map,
              title: `${sighting.endLocation}\nTime: ${sighting.endTime}`,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: '#800000',
                fillOpacity: 0.7,
                strokeWeight: 1,
                strokeColor: '#FFFFFF',
                labelOrigin: new google.maps.Point(calculateLabelOffset(sighting.matrilines), 0)
              },
              label: {
                text: sighting.matrilines.join(', '),
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '500',
                className: 'marker-label'
              }
            });

            markersRef.current.push(endMarker);
          }
        }
      }
    });
  }, [map, sightings, selectedDate, selectedIndividuals, showPaths]);

  return (
    <div 
      ref={mapDivRef}
      style={{ 
        width: '100%',
        height: 'calc(100vh - 12rem)',
        position: 'relative',
        backgroundColor: '#f0f0f0'
      }}
    />
  );
};

const calculateLabelOffset = (matrilines: string[]) => {
  const text = matrilines.join(', ');
  // Base offset (marker radius) + small padding + dynamic offset based on text length
  return Math.max(8, Math.min(text.length * 0.5 + 4, 15));
};

export default MapContainer; 