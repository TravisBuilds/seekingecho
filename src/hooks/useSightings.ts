'use client';

import { useState, useEffect } from 'react';
import { WhaleSighting, FilterOptions } from '@/types/sighting';
import { supabase } from '@/utils/supabase';
import { Database } from '@/types/supabase';
import useSWR from 'swr';

type DbSighting = Database['public']['Tables']['sightings']['Row'];
type DbWhale = Database['public']['Tables']['whales']['Row'];
type DbSightingWhale = Database['public']['Tables']['sighting_whales']['Row'];

type SightingWithWhales = DbSighting & {
  sighting_whales: Array<DbSightingWhale & {
    whales: DbWhale | null;
  }> | null;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async <T,>(
  operation: () => Promise<T>,
  retries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      // Exponential backoff
      await delay(baseDelay * Math.pow(2, i));
    }
  }
  
  throw lastError;
};

interface SightingsFilter {
  dateRange: { start: Date | null; end: Date | null };
  location: string;
  groupSize: { min: number; max: number };
  matrilines: string[];
  showPath: boolean;
}

const fetcher = async (url: string) => {
  console.log('Fetching sightings from:', url);
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch sightings:', {
      status: response.status,
      statusText: response.statusText,
      errorText
    });
    throw new Error(`Failed to fetch sightings: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Received sightings data:', {
    count: data.length,
    sample: data.slice(0, 2)
  });

  if (Array.isArray(data)) {
    return data;
  } else if (data.error) {
    console.error('API returned error:', data.error);
    throw new Error(data.error);
  } else {
    console.error('Unexpected API response format:', data);
    throw new Error('Unexpected API response format');
  }
};

export function useSightings(filters: SightingsFilter) {
  const { data, error, mutate } = useSWR<WhaleSighting[]>('/api/sightings', fetcher, {
    onError: (err) => {
      console.error('SWR error:', err);
    },
    onSuccess: (data) => {
      console.log('SWR success:', {
        count: data?.length,
        sample: data?.slice(0, 2),
        hasData: !!data,
        filters
      });
    }
  });

  const sightings = data || [];
  console.log('useSightings hook returning:', {
    hasSightings: sightings.length > 0,
    count: sightings.length,
    isLoading: !error && !data,
    hasError: !!error,
    errorMessage: error?.message
  });

  return {
    sightings,
    loading: !error && !data,
    error: error?.message || null,
    mutate
  };
}

export const useSightingsOld = (filters: FilterOptions) => {
  const [sightings, setSightings] = useState<WhaleSighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSightings = async () => {
      try {
        console.log('Fetching sightings with filters:', filters);
        const { data: sightingsData, error: fetchError } = await supabase
          .from('sightings')
          .select(`
            *,
            sighting_whales (
              whales (
                id,
                matriline_id
              )
            )
          `);

        if (fetchError) {
          console.error('Supabase fetch error:', fetchError);
          throw fetchError;
        }
        
        if (!sightingsData) {
          console.error('No sightings data returned from Supabase');
          throw new Error('No sightings data available');
        }

        console.log('Raw sightings from Supabase:', {
          count: sightingsData.length,
          firstRecord: sightingsData[0]
        });

        // Transform the data to match our WhaleSighting type
        const transformedSightings: WhaleSighting[] = (sightingsData as SightingWithWhales[])
          .map((sighting) => {
            const matrilines = sighting.sighting_whales
              ?.map(sw => {
                console.log('Processing whale:', sw);
                return sw.whales?.matriline_id;
              })
              .filter((id): id is string => id !== undefined);

            console.log('Extracted matrilines for sighting:', {
              sightingId: sighting.id,
              matrilines
            });

            return {
              id: sighting.id,
              timestamp: new Date(sighting.date + 'T' + (sighting.first_sighting_time || '12:00:00')).toISOString(),
              location: {
                lat: sighting.first_sighting_latitude || 0,
                lng: sighting.first_sighting_longitude || 0
              },
              endLocation: sighting.end_sighting_latitude && sighting.end_sighting_longitude ? {
                lat: sighting.end_sighting_latitude,
                lng: sighting.end_sighting_longitude
              } : null,
              matrilines: matrilines || [],
              groupSize: sighting.min_group_size,
              firstLocation: sighting.first_sighting_location || '',
              endLocationName: sighting.end_sighting_location || '',
              firstDirection: sighting.first_sighting_direction || '',
              endDirection: sighting.end_sighting_direction || '',
              firstTime: sighting.first_sighting_time || '',
              endTime: sighting.end_sighting_time || ''
            };
          })
          .filter(sighting => {
            const hasRelevantMatrilines = sighting.matrilines.some(m => 
              m.startsWith('T18') || m.startsWith('T19')
            );
            console.log('Filtering sighting:', {
              id: sighting.id,
              matrilines: sighting.matrilines,
              hasRelevantMatrilines
            });
            return hasRelevantMatrilines;
          });

        console.log('Final transformed sightings:', {
          count: transformedSightings.length,
          firstSighting: transformedSightings[0],
          matrilines: transformedSightings.map(s => s.matrilines)
        });

        if (isMounted) {
          setSightings(transformedSightings);
        }
      } catch (err) {
        console.error('Error fetching sightings:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSightings();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  return { sightings, loading, error };
}; 