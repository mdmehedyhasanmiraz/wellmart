import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }

    switch (type) {
      case 'categories':
        return await getCategories();

      case 'banners':
        return await getBanners();

      case 'flash-sale-products':
        return await getFlashSaleProducts();

      case 'featured-products':
        return await getFeaturedProducts();

      case 'top-products':
        return await getTopProducts();

      case 'recent-products':
        return await getRecentProducts();

      case 'shop-products':
        return await getShopProducts(searchParams);

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Public data API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

async function getCategories() {
  try {
    // Get all categories
    const { data: allCategories, error: categoriesError } = await supabaseAdmin!
      .from('categories')
      .select('id, name, slug, description, parent_id, image_url')
      .order('name');

    if (categoriesError) {
      throw categoriesError;
    }

    // Get all subcategories
    const { data: subcategories, error: subError } = await supabaseAdmin!
      .from('categories')
      .select('id, name, slug, description, category_id:parent_id, image_url')
      .not('parent_id', 'is', null)
      .order('name');

    if (subError) {
      throw subError;
    }

    // Group subcategories by parent
    const subcategoriesByParent = subcategories?.reduce((acc, sub) => {
      if (sub.category_id) {
        if (!acc[sub.category_id]) {
          acc[sub.category_id] = [];
        }
        acc[sub.category_id].push({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          category_id: sub.category_id
        });
      }
      return acc;
    }, {} as Record<string, any[]>) || {};

    // Build the final categories array
    const processedCategories = allCategories?.map(category => ({
      ...category,
      subcategories: subcategoriesByParent[category.id] || []
    })).filter(category => 
      // Show categories that either have subcategories OR are not subcategories themselves
      category.subcategories.length > 0 || !category.parent_id
    ) || [];

    return NextResponse.json({
      success: true,
      categories: processedCategories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

async function getBanners() {
  try {
    const { data, error } = await supabaseAdmin!
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('position');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      banners: data || []
    });

  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

async function getFlashSaleProducts() {
  try {
    const { data, error } = await supabaseAdmin!
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        company:companies!products_company_id_fkey(name)
      `)
      .eq('flash_sale', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      products: data || []
    });

  } catch (error) {
    console.error('Error fetching flash sale products:', error);
    return NextResponse.json({ error: 'Failed to fetch flash sale products' }, { status: 500 });
  }
}

async function getFeaturedProducts() {
  try {
    const { data, error } = await supabaseAdmin!
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        company:companies!products_company_id_fkey(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      products: data || []
    });

  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json({ error: 'Failed to fetch featured products' }, { status: 500 });
  }
}

async function getTopProducts() {
  try {
    const { data, error } = await supabaseAdmin!
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        company:companies!products_company_id_fkey(name)
      `)
      .eq('is_active', true)
      .order('price_regular', { ascending: false })
      .limit(8);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      products: data || []
    });

  } catch (error) {
    console.error('Error fetching top products:', error);
    return NextResponse.json({ error: 'Failed to fetch top products' }, { status: 500 });
  }
}

async function getRecentProducts() {
  try {
    const { data, error } = await supabaseAdmin!
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        company:companies!products_company_id_fkey(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      products: data || []
    });

  } catch (error) {
    console.error('Error fetching recent products:', error);
    return NextResponse.json({ error: 'Failed to fetch recent products' }, { status: 500 });
  }
}

async function getShopProducts(searchParams: URLSearchParams) {
  try {
    const search = searchParams.get('search') || '';
    const category_id = searchParams.get('category_id') || '';
    const company_id = searchParams.get('company_id') || '';
    const min_price = searchParams.get('min_price') || '';
    const max_price = searchParams.get('max_price') || '';
    const in_stock = searchParams.get('in_stock') || '';
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build the query
    let query = supabaseAdmin!
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply category filter
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    // Apply company filter
    if (company_id) {
      query = query.eq('company_id', company_id);
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

    // Apply sorting
    query = query.order(sort_by, { 
      ascending: sort_order === 'asc' 
    });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      products: data || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    console.error('Error fetching shop products:', error);
    return NextResponse.json({ error: 'Failed to fetch shop products' }, { status: 500 });
  }
} 