import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '8');

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, price_regular, price_offer, image_urls')
      .ilike('name', `%${query.trim()}%`)
      .eq('is_active', true)
      .eq('status', 'published')
      .limit(limit);

    if (error) {
      console.error('Error searching products:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to search products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: data || []
    });

  } catch (error) {
    console.error('Products search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 