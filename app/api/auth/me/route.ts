import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Only use Supabase Auth session (Google OAuth etc)
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) {
      // Look up user in our own users table by id or email
      let dbUser = null;
      if (supabaseAdmin) {
        // Try by id
        const { data: userById } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        dbUser = userById;
        // If not found by id, try by email
        if (!dbUser && user.email) {
          const { data: userByEmail } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();
          dbUser = userByEmail;
        }
      }
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          phone: user.phone || '',
          email: user.email || '',
          role: dbUser?.role || user.user_metadata?.role || 'customer',
          division: dbUser?.division || '',
          district: dbUser?.district || '',
          upazila: dbUser?.upazila || '',
          street: dbUser?.street || '',
        }
      });
    }

    // Not authenticated
    return NextResponse.json({
      success: false,
      message: 'Not authenticated'
    }, { status: 401 });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
} 