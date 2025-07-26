import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Supabase admin client not configured'
      }, { status: 500 });
    }

    // Test basic database connection
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: data
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    }, { status: 500 });
  }
} 