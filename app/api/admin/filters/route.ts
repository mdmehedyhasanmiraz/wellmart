import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Fetch categories and manufacturers in parallel
    const [categoriesResult, manufacturersResult] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name')
        .order('name'),
      supabase
        .from('manufacturers')
        .select('id, name')
        .order('name')
    ]);

    if (categoriesResult.error) {
      console.error('Error fetching categories:', categoriesResult.error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    if (manufacturersResult.error) {
      console.error('Error fetching manufacturers:', manufacturersResult.error);
      return NextResponse.json({ error: 'Failed to fetch manufacturers' }, { status: 500 });
    }

    return NextResponse.json({
      categories: categoriesResult.data || [],
      manufacturers: manufacturersResult.data || []
    });

  } catch (error) {
    console.error('Error in filters API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 