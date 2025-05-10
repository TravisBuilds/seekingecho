import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type Sighting = Database['public']['Tables']['sightings']['Row'];
export type Whale = Database['public']['Tables']['whales']['Row'];
export type SightingWhale = Database['public']['Tables']['sighting_whales']['Row']; 