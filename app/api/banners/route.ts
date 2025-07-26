import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const position = searchParams.get('position');
    const isActive = searchParams.get('is_active');
    
    let query = supabase
      .from('banners')
      .select('*')
      .order('position');

    if (position) {
      query = query.eq('position', position);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: banners, error } = await query;

    if (error) {
      console.error('Error fetching banners:', error);
      return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
    }

    return NextResponse.json({ banners: banners || [] });
  } catch (error) {
    console.error('Error in banners API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 