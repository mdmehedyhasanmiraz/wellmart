import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('supabaseAdmin is not available - service role key may be missing');
      return NextResponse.json({ 
        success: false, 
        error: 'Database service not available',
        timing: Date.now() - startTime
      }, { status: 500 });
    }

    let result;
    switch (type) {
      case 'categories':
        result = await getCategories();
        break;
      case 'banners':
        result = await getBanners();
        break;
      case 'flash-sale-products':
        result = await getFlashSaleProducts();
        break;
      case 'featured-products':
        result = await getFeaturedProducts();
        break;
      case 'top-products':
        result = await getTopProducts();
        break;
      case 'recent-products':
        result = await getRecentProducts();
        break;
      case 'shop-products':
        result = await getShopProducts(searchParams);
        break;
      case 'product-details':
        const slug = searchParams.get('slug');
        if (!slug) {
          return NextResponse.json({ success: false, error: 'Product slug is required' }, { status: 400 });
        }
        result = await getProductDetails(slug);
        break;
      case 'cart':
        result = getCartData();
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid type parameter' }, { status: 400 });
    }

    // Add timing information to the response
    const totalTiming = Date.now() - startTime;
    
    // Handle both Promise and direct NextResponse returns
    if (result instanceof Promise) {
      const resolvedResult = await result;
      if (resolvedResult && resolvedResult.body) {
        const responseData = JSON.parse(await resolvedResult.text());
        responseData.timing = totalTiming;
        return NextResponse.json(responseData, { status: resolvedResult.status });
      }
      return resolvedResult;
    } else if (result && result.body) {
      const responseData = JSON.parse(await result.text());
      responseData.timing = totalTiming;
      return NextResponse.json(responseData, { status: result.status });
    }

    return result;
  } catch (error) {
    console.error('API error:', error);
    const totalTiming = Date.now() - startTime;
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      timing: totalTiming
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
    }, {} as Record<string, Array<{ id: string; name: string; slug: string; category_id: string }>>) || {};

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
  const startTime = Date.now();
  try {
    if (!supabaseAdmin) {
      console.error('supabaseAdmin is not available in getFeaturedProducts');
      return NextResponse.json({ 
        success: false, 
        error: 'Database service not available',
        timing: Date.now() - startTime
      }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
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
      console.error('Supabase error in getFeaturedProducts:', error);
      throw error;
    }

    const timing = Date.now() - startTime;
    console.log(`getFeaturedProducts completed in ${timing}ms, returned ${data?.length || 0} products`);

    return NextResponse.json({
      success: true,
      products: data || [],
      timing
    });

  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch featured products',
      timing: Date.now() - startTime
    }, { status: 500 });
  }
}

async function getTopProducts() {
  const startTime = Date.now();
  try {
    if (!supabaseAdmin) {
      console.error('supabaseAdmin is not available in getTopProducts');
      return NextResponse.json({ 
        success: false, 
        error: 'Database service not available',
        timing: Date.now() - startTime
      }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
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
      console.error('Supabase error in getTopProducts:', error);
      throw error;
    }

    const timing = Date.now() - startTime;
    console.log(`getTopProducts completed in ${timing}ms, returned ${data?.length || 0} products`);

    return NextResponse.json({
      success: true,
      products: data || [],
      timing
    });

  } catch (error) {
    console.error('Error fetching top products:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch top products',
      timing: Date.now() - startTime
    }, { status: 500 });
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

async function getProductDetails(slug: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the authenticated user first (if any)
    let currentUser = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/me`);
        if (response.ok) {
          const result = await response.json();
          currentUser = result.user;
        }
      }
    } catch (error) {
      console.log('No authenticated user or auth error:', error);
    }

    // Fetch product with all related data in a single query
    let { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        company:companies!products_company_id_fkey(name)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      // Try without is_active filter as fallback
      const { data: fallbackProduct, error: fallbackError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name, slug),
          company:companies!products_company_id_fkey(name)
        `)
        .eq('slug', slug)
        .single();

      if (fallbackError || !fallbackProduct) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }
      
      product = fallbackProduct;
      productError = fallbackError;
    }

    // Fetch approved reviews for this product
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', product.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    // Fetch user's review if authenticated
    let userReview = null;
    if (currentUser) {
      const { data: userReviewData } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .eq('user_id', currentUser.id)
        .single();
      
      userReview = userReviewData;
    }

    const response = NextResponse.json({
      success: true,
      product,
      reviews: reviews || [],
      userReview,
      currentUser
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600'); // 5 minutes cache, 10 minutes stale-while-revalidate
    
    return response;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch product details' }, { status: 500 });
  }
} 

async function getCartData() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the authenticated user first
    let currentUser = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/me`);
        if (response.ok) {
          const result = await response.json();
          currentUser = result.user;
        }
      }
    } catch (error) {
      console.log('No authenticated user or auth error:', error);
    }

    if (!currentUser) {
      return NextResponse.json({
        success: true,
        cart: null,
        message: 'No authenticated user'
      });
    }

    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('user_carts')
      .select(`
        id,
        user_id,
        product_id,
        quantity,
        created_at,
        updated_at
      `)
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (cartError) {
      console.error('Error fetching cart items:', cartError);
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({
        success: true,
        cart: {
          items: [],
          total_items: 0,
          total_price: 0,
          item_count: 0
        }
      });
    }

    // Get product details for cart items
    const productIds = cartItems.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price_regular,
        price_offer,
        image_urls,
        stock
      `)
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products for cart:', productsError);
      return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 });
    }

    // Create a map of products by ID for quick lookup
    const productsMap = new Map(products?.map(p => [p.id, p]) || []);

    // Combine cart items with product details
    const items = cartItems.map(item => ({
      ...item,
      product: productsMap.get(item.product_id)
    }));

    const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
    const total_price = items.reduce((sum, item) => {
      const price = item.product?.price_offer != null && item.product?.price_offer !== 0
        ? item.product.price_offer
        : item.product?.price_regular || 0;
      return sum + (item.quantity * price);
    }, 0);

    const cart = {
      items,
      total_items,
      total_price,
      item_count: items.length
    };

    return NextResponse.json({
      success: true,
      cart
    });
  } catch (error) {
    console.error('Error fetching cart data:', error);
    return NextResponse.json({ error: 'Failed to fetch cart data' }, { status: 500 });
  }
} 