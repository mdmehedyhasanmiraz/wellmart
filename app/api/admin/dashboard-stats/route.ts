import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/manager
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!dbUser || !['admin', 'manager'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use optimized function if available, otherwise fall back to individual queries
    try {
      // Try to use the optimized function first
      const { data: statsData, error: statsError } = await supabaseAdmin
        .rpc('get_dashboard_stats');

      if (statsError) {
        throw statsError; // Fall back to individual queries
      }

      // Get low stock products
      const { data: lowStockData, error: lowStockError } = await supabaseAdmin
        .rpc('get_low_stock_products', { limit_count: 10 });

      // Get recent notifications
      const { data: notificationsData, error: notificationsError } = await supabaseAdmin
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
      console.log('Using fallback queries:', functionError.message);
      
      // Use Promise.all for parallel execution
      const [
        productsResult,
        usersResult,
        ordersResult,
        reviewsResult,
        salesResult,
        lowStockResult
      ] = await Promise.all([
        supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('user_orders').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('user_orders').select('total').eq('status', 'delivered'),
        supabaseAdmin.from('products').select('id, name, stock').lt('stock', 6).eq('is_active', true).order('stock').limit(10)
      ]);

      // Calculate total sales
      const totalSales = salesResult.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      // Get recent notifications
      const [recentOrders, recentUsers] = await Promise.all([
        supabaseAdmin.from('user_orders').select('created_at').order('created_at', { ascending: false }).limit(1),
        supabaseAdmin.from('users').select('created_at').order('created_at', { ascending: false }).limit(1)
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

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 