import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Type definitions for better type safety
interface Order {
  id: string;
  user_id: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'paid';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'bkash' | 'nagad' | 'bank';
  payment_channel?: 'bkash' | 'nagad' | 'bank';
  payment_transaction_id?: string;
  payment_amount?: number;
  payment_date?: string;
  payment_currency?: string;
  payment_reference?: string;
  payment_notes?: string;
  billing_name: string;
  billing_phone: string;
  billing_email?: string;
  billing_address: string;
  billing_city: string;
  billing_district: string;
  billing_country: string;
  billing_postal?: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_email?: string;
  shipping_address: string;
  shipping_city: string;
  shipping_district: string;
  shipping_country: string;
  shipping_postal?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/manager
    const { data: dbUser } = await supabaseAdmin!
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!dbUser || !['admin', 'manager'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }

    switch (type) {
      case 'dashboard-stats':
        return await getDashboardStats();
      
      case 'products':
        return await getProducts(searchParams);
      
      case 'users':
        return await getUsers(searchParams);
      
      case 'orders':
        return await getOrders(searchParams);
      
      case 'categories':
        return await getCategories(searchParams);
      
      case 'companies':
        return await getCompanies(searchParams);
      
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin data API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

async function getDashboardStats() {
  try {
    // Try to use the optimized function first
    const { data: statsData, error: statsError } = await supabaseAdmin!
      .rpc('get_dashboard_stats');

    if (statsError) {
      throw statsError; // Fall back to individual queries
    }

    // Get low stock products
    const { data: lowStockData } = await supabaseAdmin!
      .rpc('get_low_stock_products', { limit_count: 10 });

    // Get recent notifications
    const { data: notificationsData } = await supabaseAdmin!
      .rpc('get_recent_notifications', { limit_count: 5 });

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts: statsData[0]?.total_products || 0,
        totalUsers: statsData[0]?.total_users || 0,
        totalOrders: statsData[0]?.total_orders || 0,
        totalReviews: statsData[0]?.total_reviews || 0,
        sales: parseFloat(statsData[0]?.total_sales || '0'),
        growth: 12.5 // Mock growth percentage
      },
      lowStockProducts: lowStockData || [],
      notifications: notificationsData || []
    });

  } catch (functionError) {
    // Fall back to individual optimized queries
    console.log('Using fallback queries:', functionError);

    // Use Promise.all for parallel execution
    const [
      productsResult,
      usersResult,
      ordersResult,
      reviewsResult,
      salesResult,
      lowStockResult
    ] = await Promise.all([
      supabaseAdmin!.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin!.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin!.from('user_orders').select('*', { count: 'exact', head: true }),
      supabaseAdmin!.from('reviews').select('*', { count: 'exact', head: true }),
      supabaseAdmin!.from('user_orders').select('total').eq('status', 'delivered'),
      supabaseAdmin!.from('products').select('id, name, stock').lt('stock', 6).eq('is_active', true).order('stock').limit(10)
    ]);

    // Calculate total sales
    const totalSales = salesResult.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    // Get recent notifications
    const [recentOrders, recentUsers] = await Promise.all([
      supabaseAdmin!.from('user_orders').select('created_at').order('created_at', { ascending: false }).limit(1),
      supabaseAdmin!.from('users').select('created_at').order('created_at', { ascending: false }).limit(1)
    ]);

    const notifications = [];
    if (recentOrders.data?.[0]) {
      notifications.push({
        type: 'order',
        message: 'New order received',
        time: recentOrders.data[0].created_at
      });
    }
    if (recentUsers.data?.[0]) {
      notifications.push({
        type: 'user',
        message: 'New user registered',
        time: recentUsers.data[0].created_at
      });
    }
    if (lowStockResult.data?.[0]) {
      notifications.push({
        type: 'lowstock',
        message: `Low stock: ${lowStockResult.data[0].name}`,
        time: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts: productsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalOrders: ordersResult.count || 0,
        totalReviews: reviewsResult.count || 0,
        sales: totalSales,
        growth: 12.5
      },
      lowStockProducts: lowStockResult.data || [],
      notifications
    });
  }
}

async function getProducts(searchParams: URLSearchParams) {
  const searchTerm = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const companyId = searchParams.get('company') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Build the query
  let query = supabaseAdmin!
    .from('products')
    .select(`
      *,
      categories!inner(id, name),
      companies!inner(id, name)
    `);

  // Apply filters
  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  if (companyId) {
    query = query.eq('company_id', companyId);
  }
  if (statusFilter === 'active') {
    query = query.eq('is_active', true);
  } else if (statusFilter === 'inactive') {
    query = query.eq('is_active', false);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }

  // Transform the data to match the expected format
  const transformedData = data?.map(product => ({
    ...product,
    category_name: product.categories?.name,
    company_name: product.companies?.name
  })) || [];

  return NextResponse.json({
    success: true,
    products: transformedData
  });
}

async function getUsers(searchParams: URLSearchParams) {
  const searchTerm = searchParams.get('search') || '';
  const roleFilter = searchParams.get('role') || 'all';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Build the query
  let query = supabaseAdmin!
    .from('users')
    .select('*');

  // Apply search filter
  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
  }

  // Apply role filter
  if (roleFilter !== 'all') {
    query = query.eq('role', roleFilter);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    users: data || []
  });
}

async function getOrders(searchParams: URLSearchParams) {
  const searchTerm = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const paymentFilter = searchParams.get('payment') || 'all';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Build the query
  let query = supabaseAdmin!
    .from('user_orders')
    .select('*');

  // Apply search filter
  if (searchTerm) {
    query = query.or(`id.ilike.%${searchTerm}%,billing_name.ilike.%${searchTerm}%,billing_email.ilike.%${searchTerm}%,billing_phone.ilike.%${searchTerm}%`);
  }

  // Apply status filter
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  // Apply payment filter
  if (paymentFilter !== 'all') {
    if (paymentFilter === 'pending') {
      query = query.or('payment_status.is.null,payment_status.eq.pending');
    } else {
      query = query.eq('payment_status', paymentFilter);
    }
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  // Transform the data to match the expected format
  const transformedOrders = (data || []).map((order: Order) => ({
    ...order,
    user: {
      name: order.billing_name,
      email: order.billing_email || '',
      phone: order.billing_phone
    }
  }));

  return NextResponse.json({
    success: true,
    orders: transformedOrders
  });
}

async function getCategories(searchParams: URLSearchParams) {
  const searchTerm = searchParams.get('search') || '';

  // Build the query with product count
  let query = supabaseAdmin!
    .from('categories')
    .select(`
      *,
      product_count:products(count)
    `)
    .order('name');

  // Apply search filter
  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }

  // Transform the data to handle the count properly
  const transformedData = data?.map(category => ({
    ...category,
    product_count: category.product_count?.[0]?.count || 0
  })) || [];

  return NextResponse.json({
    success: true,
    categories: transformedData
  });
}

async function getCompanies(searchParams: URLSearchParams) {
  const searchTerm = searchParams.get('search') || '';

  // Build the query
  let query = supabaseAdmin!
    .from('companies')
    .select('*')
    .order('name');

  // Apply search filter
  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    companies: data || []
  });
} 