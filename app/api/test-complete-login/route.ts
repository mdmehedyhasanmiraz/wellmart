import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Step 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({
        success: false,
        step: 'auth_check',
        error: authError.message,
        details: authError
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        step: 'no_auth_user',
        message: 'No authenticated user found. Please log in first.',
        instructions: [
          '1. Try logging in via the login popup',
          '2. Or visit /login page',
          '3. Then test this endpoint again'
        ]
      }, { status: 401 });
    }

    // Step 2: Check if user exists in public.users
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        step: 'no_admin_client',
        message: 'Database connection not available'
      }, { status: 500 });
    }

    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError && dbError.code === 'PGRST116') {
      // User doesn't exist, create them
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email,
          role: user.user_metadata?.role || 'customer'
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({
          success: false,
          step: 'user_creation_failed',
          error: insertError.message,
          details: insertError,
          authUser: {
            id: user.id,
            email: user.email,
            hasUser: true
          }
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        step: 'user_created',
        message: 'User created successfully in database',
        authUser: {
          id: user.id,
          email: user.email,
          hasUser: true
        },
        dbUser: newUser
      });
    }

    if (dbError) {
      return NextResponse.json({
        success: false,
        step: 'database_query_failed',
        error: dbError.message,
        details: dbError,
        authUser: {
          id: user.id,
          email: user.email,
          hasUser: true
        }
      }, { status: 500 });
    }

    // Step 3: Success - user exists
    return NextResponse.json({
      success: true,
      step: 'user_exists',
      message: 'Login flow working correctly - user exists in database',
      authUser: {
        id: user.id,
        email: user.email,
        hasUser: true
      },
      dbUser: dbUser
    });

  } catch (error) {
    console.error('Complete login test error:', error);
    return NextResponse.json({
      success: false,
      step: 'exception',
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 