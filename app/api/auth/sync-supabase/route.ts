import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'No authenticated user found'
      }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Database connection not available'
      }, { status: 500 });
    }

    // Check if user already exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists in database',
        user: existingUser
      });
    }

    // Create new user in public.users table
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
      console.error('Error creating user:', insertError);
      return NextResponse.json({
        success: false,
        message: 'Failed to create user in database',
        error: insertError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User synced successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Sync user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 