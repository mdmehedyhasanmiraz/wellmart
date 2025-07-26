import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search');
    
    let query = supabase
      .from('manufacturers')
      .select('*')
      .order('name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: manufacturers, error } = await query;

    if (error) {
      console.error('Error fetching manufacturers:', error);
      return NextResponse.json({ error: 'Failed to fetch manufacturers' }, { status: 500 });
    }

    return NextResponse.json({ manufacturers: manufacturers || [] });
  } catch (error) {
    console.error('Error in manufacturers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 