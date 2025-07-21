import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get current user from session
    const session = AuthService.getCurrentUser(request);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'No active session'
      });
    }

    // Get user details from database
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .single();

    return NextResponse.json({
      success: true,
      session: {
        userId: session.userId,
        phone: session.phone,
        role: session.role,
        expiresAt: new Date(session.exp * 1000).toISOString()
      },
      user: user || null,
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