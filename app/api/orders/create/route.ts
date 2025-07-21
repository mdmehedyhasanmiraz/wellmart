import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { AuthService } from '@/lib/services/auth';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated (optional for guest orders)
    const session = AuthService.getCurrentUser(request);
    const requestData = await request.json();

    // Validate required fields
    const requiredFields = [
      'cart_items', 'total', 'payment_method', 'payment_status',
      'billing_name', 'billing_phone', 'billing_address', 'billing_city', 
      'billing_district', 'billing_country', 'billing_postal',
      'shipping_name', 'shipping_phone', 'shipping_address', 'shipping_city',
      'shipping_district', 'shipping_country', 'shipping_postal'
    ];

    for (const field of requiredFields) {
      if (!requestData[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Create order data
    const orderData = {
      user_id: session?.userId || requestData.user_id || null,
      cart_items: requestData.cart_items,
      total: requestData.total,
      payment_method: requestData.payment_method,
      payment_status: requestData.payment_status || 'pending',
      payment_channel: requestData.payment_method,
      billing_name: requestData.billing_name,
      billing_phone: requestData.billing_phone,
      billing_email: requestData.billing_email,
      billing_address: requestData.billing_address,
      billing_city: requestData.billing_city,
      billing_district: requestData.billing_district,
      billing_country: requestData.billing_country,
      billing_postal: requestData.billing_postal,
      shipping_name: requestData.shipping_name,
      shipping_phone: requestData.shipping_phone,
      shipping_email: requestData.shipping_email,
      shipping_address: requestData.shipping_address,
      shipping_city: requestData.shipping_city,
      shipping_district: requestData.shipping_district,
      shipping_country: requestData.shipping_country,
      shipping_postal: requestData.shipping_postal,
      notes: requestData.notes,
      status: requestData.status || 'pending'
    };

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available'
      }, { status: 500 });
    }

    // Insert order into database
    const { data: order, error } = await supabaseAdmin!
      .from('user_orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create order'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: order,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Error in order creation:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 