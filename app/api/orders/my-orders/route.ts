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
        message: 'Not authenticated'
      }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Database connection not available'
      }, { status: 500 });
    }
    // Get user orders from database
    const { data: orders, error } = await supabaseAdmin
      .from('user_orders')
      .select('id, created_at, total, status')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get orders error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch orders'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orders: orders || []
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
} 