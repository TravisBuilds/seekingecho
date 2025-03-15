import { WhaleSighting } from '@/types/sighting';

export interface Position {
  lat: number;
  lng: number;
  family: string;
  isActualSighting: boolean;
}

// Check if a point is in water (rough Salish Sea boundaries)
export const isInWater = (lat: number, lng: number): boolean => {
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
export const interpolatePoints = (
  start: Position,
  end: Position,
  steps: number
): Position[] => {
  const points: Position[] = [];
  
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
    
    points.push({ lat, lng, family: '', isActualSighting: false });
  }
  
  return points;
};

export const findPositionsForDate = (
  date: Date,
  sightings: WhaleSighting[],
  selectedIndividuals: string[] = []
): Position[] => {
  const dateStr = date.toDateString();
  const positions = new Map<string, Position>();

  // Determine which families to process based on selection
  const familiesToProcess = selectedIndividuals.length > 0
    ? [...new Set(selectedIndividuals.map(m => 
        m.startsWith('T18') ? 'T18' : 
        m.startsWith('T19') ? 'T19' : null
      ).filter(Boolean))]
    : ['T18', 'T19'];

  // Try to find exact matches for selected families only
  familiesToProcess.forEach(family => {
    const familyExactMatch = sightings.find(s => 
      new Date(s.timestamp).toDateString() === dateStr &&
      s.matrilines.some(m => m.startsWith(family)) &&
      isInWater(s.location.lat, s.location.lng) &&
      (selectedIndividuals.length === 0 || s.matrilines.some(m => selectedIndividuals.includes(m)))
    );

    if (familyExactMatch) {
      positions.set(family, {
        lat: familyExactMatch.location.lat,
        lng: familyExactMatch.location.lng,
        family,
        isActualSighting: true
      });
    }
  });

  // For any selected family without an exact match, interpolate
  familiesToProcess.forEach(family => {
    if (positions.has(family)) return;

    const familySightings = sightings
      .filter(s => 
        s.matrilines.some(m => m.startsWith(family)) &&
        isInWater(s.location.lat, s.location.lng) &&
        (selectedIndividuals.length === 0 || s.matrilines.some(m => selectedIndividuals.includes(m)))
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
      const points = interpolatePoints(
        {
          lat: prevSighting.location.lat,
          lng: prevSighting.location.lng,
          family,
          isActualSighting: true
        },
        {
          lat: nextSighting.location.lat,
          lng: nextSighting.location.lng,
          family,
          isActualSighting: true
        },
        20
      );
      const index = Math.floor(fraction * points.length);
      
      const interpolatedPosition = points[Math.min(index, points.length - 1)];
      
      if (isInWater(interpolatedPosition.lat, interpolatedPosition.lng)) {
        positions.set(family, {
          ...interpolatedPosition,
          family,
          isActualSighting: false
        });
      }
    }
  });

  return Array.from(positions.values());
}; 