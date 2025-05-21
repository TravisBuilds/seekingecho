import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/utils/supabase';
import { Database } from '@/types/supabase';
import { WhaleSighting, NewSighting } from '@/types/sighting';

type SightingRow = Database['public']['Tables']['sightings']['Row'];
type WhaleRow = Database['public']['Tables']['whales']['Row'];
type SightingWhaleRow = Database['public']['Tables']['sighting_whales']['Row'];

export async function GET() {
  try {
    // Log environment and request info
    console.log('API Route Environment:', {
      nodeEnv: process.env.NODE_ENV,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });

    let supabase;
    try {
      supabase = getServerSupabase();
      console.log('Supabase client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      return NextResponse.json(
        { error: 'Database connection failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    console.log('Fetching sightings from Supabase...');

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
      console.error('Supabase query error:', {
        message: sightingsError.message,
        details: sightingsError.details,
        hint: sightingsError.hint
      });
      return NextResponse.json(
        { 
          error: 'Database query failed',
          details: sightingsError.message,
          hint: sightingsError.hint
        },
        { status: 500 }
      );
    }

    if (!sightings) {
      console.log('No sightings found in database');
      return NextResponse.json([], { status: 200 });
    }

    console.log('Successfully fetched sightings:', {
      count: sightings.length,
      hasWhales: sightings.some(s => s.sighting_whales?.length > 0)
    });

    const transformedSightings: WhaleSighting[] = sightings.map((sighting: any) => {
      const matrilines = sighting.sighting_whales?.map((sw: any) => sw.whales?.matriline_id).filter(Boolean) || [];
      
      return {
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
    });

    return NextResponse.json(transformedSightings);
  } catch (error) {
    console.error('Unhandled error in GET /api/sightings:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getServerSupabase();
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
      console.error('Error creating sighting:', sightingError);
      return NextResponse.json(
        { error: `Error creating sighting: ${sightingError.message}` },
        { status: 500 }
      );
    }

    // Insert whale associations if matrilines are provided
    if (sighting.matrilines.length > 0) {
      try {
        // First, ensure all whales exist
        const whalePromises = sighting.matrilines.map(async (matrilineId: string) => {
          const { data: existingWhale, error: whaleError } = await supabase
            .from('whales')
            .select()
            .eq('matriline_id', matrilineId)
            .single();

          if (whaleError && whaleError.code !== 'PGRST116') { // Not found error
            throw new Error(`Error checking whale: ${whaleError.message}`);
          }

          if (existingWhale) return existingWhale;

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
        });

        const whales = await Promise.all(whalePromises);

        // Create sighting-whale associations
        await Promise.all(
          whales.map(whale =>
            supabase
              .from('sighting_whales')
              .insert({
                sighting_id: newSighting.id,
                whale_id: whale.id,
              })
          )
        );
      } catch (whaleError) {
        console.error('Error handling whales:', whaleError);
        // We still return success since the sighting was created
        return NextResponse.json({
          ...newSighting,
          warning: 'Sighting created but there was an error associating whales'
        });
      }
    }

    return NextResponse.json(newSighting);
  } catch (error) {
    console.error('Error in POST /api/sightings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create sighting' },
      { status: 500 }
    );
  }
} 