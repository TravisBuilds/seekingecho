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

  return {
    sightings: data || [],
    loading: !error && !data,
    error: error?.message || null,
    mutate
  };
} 