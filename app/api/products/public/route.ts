import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search');
    const category_id = searchParams.get('category_id');
    const manufacturer_id = searchParams.get('manufacturer_id');
    const min_price = searchParams.get('min_price');
    const max_price = searchParams.get('max_price');
    const in_stock = searchParams.get('in_stock');
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const flash_sale = searchParams.get('flash_sale');
    const featured = searchParams.get('featured');
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        company:companies!products_company_id_fkey(name)
      `, { count: 'exact' })
      .eq('is_active', true);

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply category filter
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    // Apply manufacturer filter
    if (manufacturer_id) {
      query = query.eq('manufacturer_id', manufacturer_id);
    }

    // Apply price filters
    if (min_price) {
      query = query.gte('price_regular', parseFloat(min_price));
    }
    if (max_price) {
      query = query.lte('price_regular', parseFloat(max_price));
    }

    // Apply stock filter
    if (in_stock === 'true') {
      query = query.gt('stock', 0);
    }

    // Apply flash sale filter
    if (flash_sale === 'true') {
      query = query.eq('flash_sale', true);
    }

    // Apply featured filter
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // Transform the data to flatten nested objects
    const transformedProducts = products?.map(product => ({
      ...product,
      category_name: product.category?.name,
      category_slug: product.category?.slug,
      company_name: product.company?.name
    })) || [];

    return NextResponse.json({ 
      products: transformedProducts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 