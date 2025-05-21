import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// For client-side usage
export const createBrowserSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Browser Supabase initialization:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    environment: process.env.NODE_ENV
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      url: supabaseUrl ? '[PRESENT]' : '[MISSING]',
      key: supabaseAnonKey ? '[PRESENT]' : '[MISSING]'
    });
    throw new Error('Missing required Supabase configuration');
  }

  try {
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
};

// For server-side usage (API routes)
let serverSupabase: ReturnType<typeof createClient<Database>> | null = null;

export function getServerSupabase() {
  if (!serverSupabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Server Supabase initialization:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      environment: process.env.NODE_ENV
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables:', {
        url: supabaseUrl ? '[PRESENT]' : '[MISSING]',
        key: supabaseAnonKey ? '[PRESENT]' : '[MISSING]'
      });
      throw new Error('Missing required Supabase configuration');
    }

    try {
      serverSupabase = createClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );
    } catch (error) {
      console.error('Failed to create server Supabase client:', error);
      throw error;
    }
  }
  return serverSupabase;
}

export type Sighting = Database['public']['Tables']['sightings']['Row'];
export type Whale = Database['public']['Tables']['whales']['Row'];
export type SightingWhale = Database['public']['Tables']['sighting_whales']['Row']; 