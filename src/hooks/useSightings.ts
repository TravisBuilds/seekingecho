import { useState, useEffect } from 'react';
import { WhaleSighting } from '@/types/sighting';

interface SightingsFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  location: string;
  groupSize: {
    min: number;
    max: number;
  };
  matrilines: string[];
  showPath: boolean;
}

interface UseSightingsReturn {
  sightings: WhaleSighting[];
  loading: boolean;
  error: string | null;
  mutate: () => Promise<void>;
}

export function useSightings(filters: SightingsFilters): UseSightingsReturn {
  const [sightings, setSightings] = useState<WhaleSighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSightings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sightings');
      if (!response.ok) {
        throw new Error('Failed to fetch sightings');
      }
      const data = await response.json();
      setSightings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching sightings');
      setSightings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSightings();
  }, [
    filters.dateRange.start,
    filters.dateRange.end,
    filters.location,
    filters.groupSize.min,
    filters.groupSize.max,
    filters.matrilines.join(','),
    filters.showPath
  ]);

  const mutate = async () => {
    await fetchSightings();
  };

  return {
    sightings,
    loading,
    error,
    mutate
  };
} 