import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    console.log('[API] /api/auth/me called');
    
    // Only use Supabase Auth session (Google OAuth etc)
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();
    
    console.log('[API] Auth user:', user ? { id: user.id, email: user.email } : 'null');
    console.log('[API] Auth error:', authError);
    
    if (authError) {
      console.error('[API] Auth error:', authError);
      return NextResponse.json({
        success: false,
        message: 'Authentication error',
        error: authError.message
      }, { status: 401 });
    }
    
    if (user) {
      console.log('[API] User found, checking supabaseAdmin:', !!supabaseAdmin);
      
      // Look up user in our own users table by id or email
      let dbUser = null;
      if (supabaseAdmin) {
        try {
          // Try by id
          console.log('[API] Looking up user by ID:', user.id);
          const { data: userById, error: userByIdError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          console.log('[API] User by ID result:', userById ? 'found' : 'not found');
          console.log('[API] User by ID error:', userByIdError);
          
          dbUser = userById;
          
          // If not found by id, try by email
          if (!dbUser && user.email) {
            console.log('[API] Looking up user by email:', user.email);
            const { data: userByEmail, error: userByEmailError } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('email', user.email)
              .single();
            
            console.log('[API] User by email result:', userByEmail ? 'found' : 'not found');
            console.log('[API] User by email error:', userByEmailError);
            
            dbUser = userByEmail;
          }
        } catch (dbError) {
          console.error('[API] Database query error:', dbError);
        }
      } else {
        console.error('[API] supabaseAdmin is null - service role key may be missing');
      }
      
      const userData = {
        id: user.id,
        name: dbUser?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        phone: dbUser?.phone || user.phone || '',
        email: user.email || '',
        role: (dbUser?.role || user.user_metadata?.role || 'customer')?.toLowerCase().trim(),
        division: dbUser?.division || '',
        district: dbUser?.district || '',
        upazila: dbUser?.upazila || '',
        street: dbUser?.street || '',
      };
      
      console.log('[API] Returning user data:', { id: userData.id, name: userData.name, email: userData.email, role: userData.role });
      
      return NextResponse.json({
        success: true,
        user: userData
      });
    }

    // Not authenticated
    console.log('[API] No authenticated user found');
    return NextResponse.json({
      success: false,
      message: 'Not authenticated'
    }, { status: 401 });
  } catch (error) {
    console.error('[API] Get user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 