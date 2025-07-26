import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Add Order type for type safety
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
  cart_items: unknown[];
  notes?: string;
  created_at: string;
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

  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 