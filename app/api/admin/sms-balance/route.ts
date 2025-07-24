import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    // Check if user is authenticated and is admin
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userDetails } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userDetails?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // SMS balance check is deprecated/not implemented
    return NextResponse.json({
      success: false,
      message: 'SMS balance check is not implemented.'
    }, { status: 501 });
  } catch (error) {
    console.error('SMS balance check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 