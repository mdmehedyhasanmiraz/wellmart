import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get current user from Supabase Auth
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'No active session'
      });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available'
      }, { status: 500 });
    }
    // Get user details from database
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: dbUser?.role || user.user_metadata?.role || 'customer',
        name: dbUser?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      },
      dbUser: dbUser || null,
      dbError: dbError?.message || null
    });

  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 