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

  console.log('findPositionsForDate called with:', {
    date: date.toISOString(),
    dateStr,
    sightingsCount: sightings.length,
    selectedIndividuals,
    sightingDates: sightings.slice(0, 5).map(s => new Date(s.date).toISOString())
  });

  // Determine which families to process based on selection
  const familiesToProcess: Family[] = selectedIndividuals.length > 0
    ? Array.from(new Set(
        selectedIndividuals
          .map(getFamilyFromMatriline)
          .filter((f): f is Family => f !== null)
      ))
    : ['T18', 'T19'];

  console.log('Processing families:', {
    familiesToProcess,
    selectedIndividuals
  });

  // Try to find exact matches for selected families only
  familiesToProcess.forEach(family => {
    const familyExactMatch = sightings.find(s => {
      const sightingDate = new Date(s.date).toDateString();
      const hasMatchingMatriline = s.matrilines.some(m => m.startsWith(family));
      const hasValidLocation = s.startLocation && isInWater(s.startLocation.lat, s.startLocation.lng);
      const matchesSelection = selectedIndividuals.length === 0 || s.matrilines.some(m => selectedIndividuals.includes(m));
      
      console.log('Checking sighting for exact match:', {
        family,
        sightingDate,
        dateMatches: sightingDate === dateStr,
        hasMatchingMatriline,
        hasValidLocation,
        matchesSelection,
        matrilines: s.matrilines
      });

      return sightingDate === dateStr &&
        hasMatchingMatriline &&
        hasValidLocation &&
        matchesSelection;
    });

    if (familyExactMatch && familyExactMatch.startLocation) {
      console.log('Found exact match for family:', {
        family,
        location: familyExactMatch.startLocation,
        matrilines: familyExactMatch.matrilines
      });

      positions.set(family, {
        position: {
          lat: familyExactMatch.startLocation.lat,
          lng: familyExactMatch.startLocation.lng
        },
        matrilines: getMatrilinesForFamily(familyExactMatch, family),
        isActualSighting: true
      });
    } else {
      console.log('No exact match found for family:', family);
    }
  });

  // For any selected family without an exact match, interpolate
  familiesToProcess.forEach(family => {
    if (positions.has(family)) {
      console.log('Skipping interpolation for family with exact match:', family);
      return;
    }

    const familySightings = sightings
      .filter(s => 
        s.matrilines.some(m => m.startsWith(family)) &&
        s.startLocation && isInWater(s.startLocation.lat, s.startLocation.lng) &&
        (selectedIndividuals.length === 0 || s.matrilines.some(m => selectedIndividuals.includes(m)))
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log('Found family sightings for interpolation:', {
      family,
      count: familySightings.length,
      dates: familySightings.map(s => new Date(s.date).toISOString())
    });

    const prevSighting = familySightings
      .filter(s => new Date(s.date) <= date)
      .pop();
    const nextSighting = familySightings
      .find(s => new Date(s.date) > date);

    console.log('Found surrounding sightings:', {
      family,
      hasPrevSighting: !!prevSighting,
      prevDate: prevSighting ? new Date(prevSighting.date).toISOString() : null,
      hasNextSighting: !!nextSighting,
      nextDate: nextSighting ? new Date(nextSighting.date).toISOString() : null
    });

    if (prevSighting && nextSighting && prevSighting.startLocation && nextSighting.startLocation) {
      const prevTime = new Date(prevSighting.date).getTime();
      const nextTime = new Date(nextSighting.date).getTime();
      const currentTime = date.getTime();
      
      const fraction = (currentTime - prevTime) / (nextTime - prevTime);
      
      // Calculate interpolated position
      const lat = prevSighting.startLocation.lat + 
        (nextSighting.startLocation.lat - prevSighting.startLocation.lat) * fraction;
      const lng = prevSighting.startLocation.lng + 
        (nextSighting.startLocation.lng - prevSighting.startLocation.lng) * fraction;
      
      console.log('Calculated interpolated position:', {
        family,
        lat,
        lng,
        isInWater: isInWater(lat, lng),
        fraction
      });

      if (isInWater(lat, lng)) {
        positions.set(family, {
          position: { lat, lng },
          matrilines: getMatrilinesForFamily(prevSighting, family),
          isActualSighting: false
        });
      }
    }
  });

  const result = Array.from(positions.values());
  console.log('Final positions:', {
    count: result.length,
    positions: result
  });

  return result;
}; 