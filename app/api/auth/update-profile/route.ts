import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest) {
  try {
    // Get current user from Supabase Auth
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }

    const { name, phone, division, district, upazila, street } = await request.json();

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Database connection not available'
      }, { status: 500 });
    }
    // Update user in database
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        name,
        phone,
        division,
        district,
        upazila,
        street,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Update profile error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to update profile'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
} 