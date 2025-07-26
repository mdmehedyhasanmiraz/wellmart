import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Type definitions for better type safety
interface StorageFile {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: {
    size?: number;
    mimetype?: string;
    cacheControl?: string;
    lastModified?: string;
    contentLength?: number;
    httpStatusCode?: number;
  };
}

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    switch (type) {
      case 'dashboard-stats':
        return await getDashboardStats();
      case 'products':
        return await getProducts(searchParams);
      case 'categories':
        return await getCategories(searchParams);
      case 'companies':
        return await getCompanies(searchParams);
      case 'users':
        return await getUsers(searchParams);
      case 'orders':
        return await getOrders(searchParams);
      case 'media-files':
        return await getMediaFiles();
      case 'reviews':
        return await getReviews(searchParams);
      case 'coupons':
        return await getCoupons(searchParams);
      case 'analytics':
        return await getAnalytics(searchParams);
      default:
        return NextResponse.json({ success: false, error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin data API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
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

async function getMediaFiles() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if bucket exists and is accessible
    const { error: bucketError } = await supabase.storage
      .from('images')
      .list('', { limit: 1 });

    if (bucketError) {
      console.error('Bucket access error:', bucketError);
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot access media bucket. Please check storage permissions.' 
      }, { status: 500 });
    }

    // Get all files from all folders in parallel
    const folders = ['', 'products', 'banners'];
    const folderPromises = folders.map(async (folder) => {
      try {
        const { data, error } = await supabase.storage
          .from('images')
          .list(folder, {
            limit: 1000,
            offset: 0,
          });

        if (error) {
          console.error(`Error fetching ${folder} folder:`, error);
          return [];
        }

        // Add folder path to each file
        return (data || []).map((file: StorageFile) => ({
          ...file,
          folder: folder || 'root',
          fullPath: folder ? `${folder}/${file.name}` : file.name
        }));
      } catch (error) {
        console.error(`Error processing ${folder} folder:`, error);
        return [];
      }
    });

    const folderResults = await Promise.all(folderPromises);
    const allFiles = folderResults.flat();

    console.log('All files found:', allFiles.length);

    if (allFiles.length === 0) {
      return NextResponse.json({
        success: true,
        files: []
      });
    }

    // Filter for image files and generate URLs in batches
    const imageFiles = allFiles.filter(file => 
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i)
    );

    // Generate URLs in batches to avoid overwhelming the API
    const batchSize = 10;
    const mediaUrls = [];

    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      
      const batchUrls = await Promise.all(
        batch.map(async (file: StorageFile & { folder: string; fullPath: string }) => {
          const filePath = file.fullPath || file.name;
          
          try {
            // Try signed URL first
            const { data: signedData, error: signedError } = await supabase.storage
              .from('images')
              .createSignedUrl(filePath, 3600);
            
            if (signedError) {
              console.error(`Signed URL error for ${filePath}:`, signedError);
              // Fallback to public URL
              const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);
              return {
                url: publicUrl,
                name: file.name,
                path: filePath,
                folder: file.folder,
                size: file.metadata?.size,
                created_at: file.created_at
              };
            }
            
            return {
              url: signedData.signedUrl,
              name: file.name,
              path: filePath,
              folder: file.folder,
              size: file.metadata?.size,
              created_at: file.created_at
            };
          } catch (error) {
            console.error(`Error generating URL for ${filePath}:`, error);
            // Final fallback to public URL
            const { data: { publicUrl } } = supabase.storage
              .from('images')
              .getPublicUrl(filePath);
            return {
              url: publicUrl,
              name: file.name,
              path: filePath,
              folder: file.folder,
              size: file.metadata?.size,
              created_at: file.created_at
            };
          }
        })
      );

      mediaUrls.push(...batchUrls);
    }

    console.log('Generated media URLs:', mediaUrls.length);

    const response = NextResponse.json({
      success: true,
      files: mediaUrls
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Error fetching media files:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch media files' 
    }, { status: 500 });
  }
}

async function getReviews(searchParams: URLSearchParams) {
  const searchTerm = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const ratingFilter = searchParams.get('rating') || 'all';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Build the query
  let query = supabaseAdmin!
    .from('reviews')
    .select(`
      *,
      product:products(name, image_urls),
      user:users(name, email)
    `);

  // Apply search filter
  if (searchTerm) {
    query = query.or(`comment.ilike.%${searchTerm}%,product.name.ilike.%${searchTerm}%`);
  }

  // Apply status filter
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  // Apply rating filter
  if (ratingFilter !== 'all') {
    query = query.eq('rating', parseInt(ratingFilter));
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }

  // Transform the data to include user details
  const transformedReviews = (data || []).map(review => ({
    ...review,
    user: {
      name: review.user?.name || `User ${review.user_id.slice(0, 8)}...`,
      email: review.user?.email || `user-${review.user_id.slice(0, 8)}@example.com`
    }
  }));

  return NextResponse.json({
    success: true,
    reviews: transformedReviews
  });
}

async function getCoupons(searchParams: URLSearchParams) {
  const searchTerm = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Build the query
  let query = supabaseAdmin!
    .from('coupons')
    .select('*');

  // Apply search filter
  if (searchTerm) {
    query = query.ilike('code', `%${searchTerm}%`);
  }

  // Apply status filter
  if (statusFilter === 'active') {
    query = query.eq('is_active', true);
  } else if (statusFilter === 'inactive') {
    query = query.eq('is_active', false);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    coupons: data || []
  });
}

async function getAnalytics(searchParams: URLSearchParams) {
  const timeRange = searchParams.get('timeRange') || '30';

  try {
    // Fetch basic stats from correct tables
    const [
      ordersResult,
      usersResult,
      productsResult,
      salesResult
    ] = await Promise.all([
      supabaseAdmin!.from('user_orders').select('id, total, created_at'),
      supabaseAdmin!.from('users').select('id, created_at'),
      supabaseAdmin!.from('products').select('id').eq('is_active', true),
      supabaseAdmin!.from('user_orders').select('total').eq('status', 'delivered')
    ]);

    const orders = ordersResult.data || [];
    const users = usersResult.data || [];
    const products = productsResult.data || [];
    const sales = salesResult.data || [];

    // Calculate metrics
    const totalSales = sales.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const totalUsers = users.length;
    const totalProducts = products.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Calculate growth (simplified - comparing current period vs previous period)
    const currentDate = new Date();
    const daysAgo = parseInt(timeRange);
    // const previousPeriodStart = new Date(currentDate.getTime() - (daysAgo * 2 * 24 * 60 * 60 * 1000));
    // const currentPeriodStart = new Date(currentDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Get recent orders for display
    const { data: recentOrdersData } = await supabaseAdmin!
      .from('user_orders')
      .select('id, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get top products (simplified - could be enhanced with actual sales data)
    const { data: topProductsData } = await supabaseAdmin!
      .from('products')
      .select('id, name, price, stock, image_urls')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    // Calculate growth percentages (simplified)
    const salesGrowth = 12.5; // Mock growth percentage
    const orderGrowth = 8.3; // Mock growth percentage
    const userGrowth = 15.7; // Mock growth percentage

    // Generate monthly sales data (simplified)
    const monthlySales = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      sales: Math.floor(Math.random() * 10000) + 5000
    }));

    return NextResponse.json({
      success: true,
      analytics: {
        totalSales,
        totalOrders,
        totalUsers,
        totalProducts,
        averageOrderValue,
        salesGrowth,
        orderGrowth,
        userGrowth,
        topProducts: topProductsData || [],
        recentOrders: recentOrdersData || [],
        monthlySales
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}