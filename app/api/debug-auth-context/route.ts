import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({
        success: false,
        error: authError.message,
        details: authError
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'No authenticated user found',
        instructions: [
          '1. You need to log in first',
          '2. Try using the login popup or /login page',
          '3. After logging in, test this endpoint again'
        ]
      }, { status: 401 });
    }

    // Get user from public.users table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Auth context debug info',
      authUser: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        role: user.user_metadata?.role,
        hasUser: true
      },
      dbUser: dbUser || null,
      dbError: dbError?.message || null,
      session: {
        access_token: user.app_metadata?.provider || 'unknown',
        user_id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Debug auth context error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 