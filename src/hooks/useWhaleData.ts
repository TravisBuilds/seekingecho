'use client';

import { WhaleSighting, FilterOptions } from '@/types/sighting';
import useSWR from 'swr';

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

export function useWhaleData(filters: SightingsFilter) {
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

  return {
    sightings: data || [],
    loading: !error && !data,
    error: error?.message || null,
    mutate
  };
} 