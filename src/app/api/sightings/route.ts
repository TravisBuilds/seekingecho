import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { Database } from '@/types/supabase';
import { WhaleSighting, NewSighting } from '@/types/sighting';

type SightingRow = Database['public']['Tables']['sightings']['Row'];
type WhaleRow = Database['public']['Tables']['whales']['Row'];
type SightingWhaleRow = Database['public']['Tables']['sighting_whales']['Row'];

export async function GET() {
  try {
    console.log('Fetching sightings from Supabase...', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });

    const { data: sightings, error: sightingsError } = await supabase
      .from('sightings')
      .select(`
        *,
        sighting_whales (
          whale_id,
          whales (
            matriline_id
          )
        )
      `);

    if (sightingsError) {
      console.error('Supabase query error:', sightingsError);
      throw new Error(`Error fetching sightings: ${sightingsError.message}`);
    }

    if (!sightings) {
      console.error('No sightings data returned from Supabase');
      throw new Error('No sightings data available');
    }

    console.log('Raw sightings data from Supabase:', {
      count: sightings.length,
      firstSighting: sightings[0],
      hasWhales: sightings.some(s => s.sighting_whales?.length > 0)
    });

    const transformedSightings: WhaleSighting[] = sightings.map((sighting: any) => {
      const matrilines = sighting.sighting_whales?.map((sw: any) => sw.whales?.matriline_id).filter(Boolean) || [];
      
      const transformed = {
        id: sighting.id,
        date: sighting.date,
        groupSize: sighting.min_group_size || 0,
        startLocation: (sighting.first_sighting_latitude && sighting.first_sighting_longitude) ? {
          lat: sighting.first_sighting_latitude,
          lng: sighting.first_sighting_longitude,
        } : null,
        endLocation: (sighting.end_sighting_latitude && sighting.end_sighting_longitude) ? {
          lat: sighting.end_sighting_latitude,
          lng: sighting.end_sighting_longitude,
        } : null,
        matrilines,
      };

      console.log(`Transformed sighting ${sighting.id}:`, {
        original: {
          id: sighting.id,
          date: sighting.date,
          whales: sighting.sighting_whales,
          locations: {
            start: {
              lat: sighting.first_sighting_latitude,
              lng: sighting.first_sighting_longitude,
            },
            end: {
              lat: sighting.end_sighting_latitude,
              lng: sighting.end_sighting_longitude,
            }
          }
        },
        transformed
      });

      return transformed;
    });

    console.log('Final transformed sightings:', {
      count: transformedSightings.length,
      hasData: transformedSightings.length > 0,
      sample: transformedSightings.slice(0, 2),
      matrilines: transformedSightings.map(s => s.matrilines)
    });

    return NextResponse.json(transformedSightings);
  } catch (error) {
    console.error('Error in GET /api/sightings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sightings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sighting: NewSighting = body;

    // Insert the sighting
    const { data: newSighting, error: sightingError } = await supabase
      .from('sightings')
      .insert({
        date: sighting.date,
        min_group_size: sighting.groupSize,
        first_sighting_location: sighting.startLocation ? 'Custom Location' : null,
        first_sighting_latitude: sighting.startLocation?.lat || null,
        first_sighting_longitude: sighting.startLocation?.lng || null,
        end_sighting_location: sighting.endLocation ? 'Custom Location' : null,
        end_sighting_latitude: sighting.endLocation?.lat || null,
        end_sighting_longitude: sighting.endLocation?.lng || null,
      })
      .select()
      .single();

    if (sightingError) {
      throw new Error(`Error creating sighting: ${sightingError.message}`);
    }

    // Insert whale associations if matrilines are provided
    if (sighting.matrilines.length > 0) {
      // First, ensure all whales exist
      const whalePromises = sighting.matrilines.map(async (matrilineId: string) => {
        const { data: existingWhale, error: whaleError } = await supabase
          .from('whales')
          .select()
          .eq('matriline_id', matrilineId)
          .single();

        if (whaleError) {
          // If whale doesn't exist, create it
          const { data: newWhale, error: createError } = await supabase
            .from('whales')
            .insert({ matriline_id: matrilineId })
            .select()
            .single();

          if (createError) {
            throw new Error(`Error creating whale: ${createError.message}`);
          }
          return newWhale;
        }
        return existingWhale;
      });

      const whales = await Promise.all(whalePromises);

      // Create sighting-whale associations
      const associationPromises = whales.map(whale =>
        supabase
          .from('sighting_whales')
          .insert({
            sighting_id: newSighting.id,
            whale_id: whale.id,
          })
      );

      await Promise.all(associationPromises);
    }

    return NextResponse.json(newSighting);
  } catch (error) {
    console.error('Error creating sighting:', error);
    return NextResponse.json(
      { error: 'Failed to create sighting' },
      { status: 500 }
    );
  }
} 