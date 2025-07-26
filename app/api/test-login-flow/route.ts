import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Test 1: Check if we can get auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({
        success: false,
        step: 'auth_get_user',
        error: authError.message,
        details: authError
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        step: 'no_auth_user',
        message: 'No authenticated user found'
      }, { status: 401 });
    }

    // Test 2: Check if user exists in public.users table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError) {
      return NextResponse.json({
        success: false,
        step: 'database_query',
        error: dbError.message,
        details: dbError,
        authUser: {
          id: user.id,
          email: user.email,
          hasUser: true
        }
      }, { status: 500 });
    }

    if (!dbUser) {
      return NextResponse.json({
        success: false,
        step: 'user_not_in_db',
        message: 'User exists in auth but not in public.users table',
        authUser: {
          id: user.id,
          email: user.email,
          hasUser: true
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Login flow working correctly',
      authUser: {
        id: user.id,
        email: user.email,
        hasUser: true
      },
      dbUser: dbUser
    });

  } catch (error) {
    console.error('Test login flow error:', error);
    return NextResponse.json({
      success: false,
      step: 'exception',
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 