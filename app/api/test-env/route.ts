import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const envCheck = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
      nodeEnv: process.env.NODE_ENV || 'Not set',
    };

    // Test if supabaseAdmin is working
    let adminTest = 'Not tested';
    if (supabaseAdmin) {
      try {
        // Try a simple query to test the connection
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('count')
          .limit(1);
        
        if (error) {
          adminTest = `Error: ${error.message}`;
        } else {
          adminTest = 'Working - Database connection successful';
        }
      } catch (testError) {
        adminTest = `Test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`;
      }
    } else {
      adminTest = 'supabaseAdmin is null - service role key may be missing or invalid';
    }

    return NextResponse.json({
      success: true,
      message: 'Environment variables check',
      env: envCheck,
      adminTest,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Environment test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    }, { status: 500 });
  }
} 