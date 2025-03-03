import { WhaleSighting } from '@/types/sighting';
import Papa from 'papaparse';

interface RawSighting {
  Date: string;
  'IDs/Matrilines': string;
  'Min. Group Size': string;
  'First Sighting Location': string;
  'First Sighting Latitude': string;
  'First Sighting Longitude': string;
  'First Sighting Time': string;
  'First Sighting Direction': string;
  'End Sighting Location': string;
  'End Sighting Latitude': string;
  'End Sighting Longitude': string;
  'End Sighting Time': string;
  'End Sighting Direction': string;
}

export async function loadYearlySightings(year: number): Promise<WhaleSighting[]> {
  try {
    const response = await fetch(`/data/sightings/yearly/${year}.csv`);
    const csvText = await response.text();
    const { data } = Papa.parse<RawSighting>(csvText, { header: true });

    return data.map((row, index) => {
      // Parse the matrilines into individual whales
      const matrilines = row['IDs/Matrilines']
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '');

      // Create a timestamp from date and time
      const date = new Date(row.Date);
      const time = row['First Sighting Time'] !== 'NTG' ? row['First Sighting Time'] : '12:00';
      const [hours, minutes] = time.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));

      return {
        id: `${year}-${index}`,
        timestamp: date.toISOString(),
        location: {
          lat: parseFloat(row['First Sighting Latitude']),
          lng: parseFloat(row['First Sighting Longitude'])
        },
        endLocation: row['End Sighting Latitude'] && row['End Sighting Longitude'] ? {
          lat: parseFloat(row['End Sighting Latitude']),
          lng: parseFloat(row['End Sighting Longitude'])
        } : null,
        groupSize: parseInt(row['Min. Group Size']),
        matrilines: matrilines,
        firstLocation: row['First Sighting Location'],
        endLocation: row['End Sighting Location'],
        firstDirection: row['First Sighting Direction'],
        endDirection: row['End Sighting Direction'],
        firstTime: row['First Sighting Time'],
        endTime: row['End Sighting Time']
      };
    });
  } catch (error) {
    console.error(`Error loading ${year} sightings data:`, error);
    return [];
  }
}

export async function loadAllSightings(): Promise<WhaleSighting[]> {
  const years = [2020, 2021, 2022, 2023, 2024];
  const allSightings = await Promise.all(
    years.map(year => loadYearlySightings(year))
  );
  return allSightings.flat();
} 