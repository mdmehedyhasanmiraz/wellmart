import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Test auth connection
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Auth error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Auth connection successful',
      user: user ? {
        id: user.id,
        email: user.email,
        hasUser: true
      } : {
        hasUser: false
      }
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