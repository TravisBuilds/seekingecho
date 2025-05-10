import { WhaleSighting } from '@/types/sighting';

export interface Position {
  position: {
    lat: number;
    lng: number;
  };
  matrilines: string[];
  isActualSighting: boolean;
}

type Family = 'T18' | 'T19';

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

// Helper function to get all matrilines for a family
const getMatrilinesForFamily = (sighting: WhaleSighting, family: Family): string[] => {
  return sighting.matrilines.filter(m => m.startsWith(family));
};

// Helper function to determine family from matriline
const getFamilyFromMatriline = (matriline: string): Family | null => {
  if (matriline.startsWith('T18')) return 'T18';
  if (matriline.startsWith('T19')) return 'T19';
  return null;
};

export const findPositionsForDate = (
  date: Date,
  sightings: WhaleSighting[],
  selectedIndividuals: string[] = []
): Position[] => {
  const dateStr = date.toDateString();
  const positions = new Map<Family, Position>();

  // Determine which families to process based on selection
  const familiesToProcess: Family[] = selectedIndividuals.length > 0
    ? Array.from(new Set(
        selectedIndividuals
          .map(getFamilyFromMatriline)
          .filter((f): f is Family => f !== null)
      ))
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
        position: {
          lat: familyExactMatch.location.lat,
          lng: familyExactMatch.location.lng
        },
        matrilines: getMatrilinesForFamily(familyExactMatch, family),
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
      
      // Calculate interpolated position
      const lat = prevSighting.location.lat + (nextSighting.location.lat - prevSighting.location.lat) * fraction;
      const lng = prevSighting.location.lng + (nextSighting.location.lng - prevSighting.location.lng) * fraction;
      
      if (isInWater(lat, lng)) {
        positions.set(family, {
          position: { lat, lng },
          matrilines: getMatrilinesForFamily(prevSighting, family),
          isActualSighting: false
        });
      }
    }
  });

  return Array.from(positions.values());
}; 