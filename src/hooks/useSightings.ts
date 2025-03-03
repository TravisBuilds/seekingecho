'use client';

import { useState, useEffect } from 'react';
import { WhaleSighting, FilterOptions } from '@/types/sighting';

export const useSightings = (filters: FilterOptions) => {
  const [sightings, setSightings] = useState<WhaleSighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSightings = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        const response = await fetch('/api/sightings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(filters),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sightings');
        }

        const data = await response.json();
        setSightings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSightings();
  }, [filters]);

  return { sightings, loading, error };
}; 