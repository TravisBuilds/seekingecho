import { NextResponse } from 'next/server';

export async function GET() {
  const envInfo = {
    nodeEnv: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // Include masked versions of the values for verification
    supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 8) + '...',
    supabaseKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 8) + '...',
  };

  console.log('Debug endpoint environment check:', envInfo);

  return NextResponse.json({
    message: 'Environment check',
    environment: envInfo,
    timestamp: new Date().toISOString()
  });
} 