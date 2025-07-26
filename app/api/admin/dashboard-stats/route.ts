import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available'
      }, { status: 500 });
    }

    // Use the optimized database function
    const { data: stats, error } = await supabaseAdmin
      .rpc('get_dashboard_stats');

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    // Get low stock products
    const { data: lowStockProducts, error: lowStockError } = await supabaseAdmin
      .rpc('get_low_stock_products', { limit_count: 10 });

    if (lowStockError) {
      console.error('Error fetching low stock products:', lowStockError);
    }

    // Get recent notifications
    const { data: notifications, error: notificationsError } = await supabaseAdmin
      .rpc('get_recent_notifications', { limit_count: 5 });

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
    }

    return NextResponse.json({
      success: true,
      stats: stats?.[0] || {
        total_products: 0,
        total_users: 0,
        total_orders: 0,
        total_reviews: 0,
        total_sales: 0,
        low_stock_count: 0
      },
      lowStockProducts: lowStockProducts || [],
      notifications: notifications || [],
      growth: 12.5 // Mock growth percentage
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 