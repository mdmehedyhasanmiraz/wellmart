import { supabaseAdmin } from "@/lib/supabase/server";
import { PaymentRecord } from "@/types/payment";

type OrderUpdateFields = {
  payment_status?: string;
  bkash_payment_id?: string;
  bkash_url?: string;
  payment_amount?: number;
};

export async function createPaymentRecord(data: {
  user_id: string;
  order_id?: string;
  amount: number;
  payment_channel: 'bkash' | 'nagad' | 'bank';
  transaction_id: string;
  purpose: 'order' | 'other';
}): Promise<PaymentRecord | null> {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      return null;
    }

    // If this is for an order, update the order directly
    if (data.order_id) {
      const { data: orderRecord, error } = await supabaseAdmin
        .from('user_orders')
        .update({
          payment_status: 'pending',
          payment_transaction_id: data.transaction_id,
          payment_channel: data.payment_channel,
          payment_amount: data.amount,
          payment_date: new Date().toISOString(),
          payment_reference: data.transaction_id
        })
        .eq('id', data.order_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order payment record:', error);
        return null;
      }

      // Return a PaymentRecord format for compatibility
      return {
        id: orderRecord.id,
        user_id: orderRecord.user_id,
        order_id: orderRecord.id,
        amount: orderRecord.payment_amount || orderRecord.total,
        payment_channel: orderRecord.payment_channel as 'bkash' | 'nagad' | 'bank',
        transaction_id: orderRecord.payment_transaction_id || '',
        bkash_payment_id: orderRecord.bkash_payment_id,
        bkash_url: orderRecord.bkash_url,
        status: orderRecord.payment_status as 'pending' | 'completed' | 'failed',
        purpose: 'order',
        created_at: orderRecord.created_at,
        updated_at: orderRecord.created_at
      };
    }

    // For non-order payments, we'll create a minimal order record
    const { data: orderRecord, error } = await supabaseAdmin
      .from('user_orders')
      .insert({
        user_id: data.user_id,
        cart_items: [], // Empty cart for non-order payments
        total: data.amount,
        payment_method: data.payment_channel,
        payment_status: 'pending',
        payment_transaction_id: data.transaction_id,
        payment_channel: data.payment_channel,
        payment_amount: data.amount,
        payment_date: new Date().toISOString(),
        payment_reference: data.transaction_id,
        status: 'pending',
        // Required fields with placeholder values
        billing_name: 'Payment User',
        billing_phone: '0000000000',
        billing_address: 'Payment Address',
        billing_city: 'Payment City',
        billing_district: 'Payment District',
        billing_country: 'Bangladesh',
        shipping_name: 'Payment User',
        shipping_phone: '0000000000',
        shipping_address: 'Payment Address',
        shipping_city: 'Payment City',
        shipping_district: 'Payment District',
        shipping_country: 'Bangladesh'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment order record:', error);
      return null;
    }

    // Return a PaymentRecord format for compatibility
    return {
      id: orderRecord.id,
      user_id: orderRecord.user_id,
      order_id: orderRecord.id,
      amount: orderRecord.payment_amount || orderRecord.total,
      payment_channel: orderRecord.payment_channel as 'bkash' | 'nagad' | 'bank',
      transaction_id: orderRecord.payment_transaction_id || '',
      bkash_payment_id: orderRecord.bkash_payment_id,
      bkash_url: orderRecord.bkash_url,
      status: orderRecord.payment_status as 'pending' | 'completed' | 'failed',
      purpose: data.purpose,
      created_at: orderRecord.created_at,
      updated_at: orderRecord.created_at
    };
  } catch (error) {
    console.error('Exception creating payment record:', error);
    return null;
  }
}

export async function updatePaymentRecord(
  paymentId: string,
  updates: Partial<PaymentRecord>
): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      return false;
    }

    // Map PaymentRecord fields to user_orders fields
    const orderUpdates: OrderUpdateFields = {};
    
    if (updates.status) {
      orderUpdates.payment_status = updates.status;
    }
    if (updates.bkash_payment_id) {
      orderUpdates.bkash_payment_id = updates.bkash_payment_id;
    }
    if (updates.bkash_url) {
      orderUpdates.bkash_url = updates.bkash_url;
    }
    if (updates.amount) {
      orderUpdates.payment_amount = updates.amount;
    }

    const { error } = await supabaseAdmin
      .from('user_orders')
      .update(orderUpdates)
      .eq('id', paymentId);

    if (error) {
      console.error('Error updating payment record:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating payment record:', error);
    return false;
  }
}

export async function getPaymentRecord(
  paymentId: string
): Promise<PaymentRecord | null> {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      return null;
    }

    const { data: orderRecord, error } = await supabaseAdmin
      .from('user_orders')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      console.error('Error getting payment record:', error);
      return null;
    }

    // Convert to PaymentRecord format
    return {
      id: orderRecord.id,
      user_id: orderRecord.user_id,
      order_id: orderRecord.id,
      amount: orderRecord.payment_amount || orderRecord.total,
      payment_channel: orderRecord.payment_channel as 'bkash' | 'nagad' | 'bank',
      transaction_id: orderRecord.payment_transaction_id || '',
      bkash_payment_id: orderRecord.bkash_payment_id,
      bkash_url: orderRecord.bkash_url,
      status: orderRecord.payment_status as 'pending' | 'completed' | 'failed',
      purpose: 'order',
      created_at: orderRecord.created_at,
      updated_at: orderRecord.created_at
    };
  } catch (error) {
    console.error('Exception getting payment record:', error);
    return null;
  }
}

export async function getPaymentByTransactionId(
  transactionId: string
): Promise<PaymentRecord | null> {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      return null;
    }

    const { data: orderRecord, error } = await supabaseAdmin
      .from('user_orders')
      .select('*')
      .eq('payment_transaction_id', transactionId)
      .single();

    if (error) {
      console.error('Error getting payment by transaction ID:', error);
      return null;
    }

    // Convert to PaymentRecord format
    return {
      id: orderRecord.id,
      user_id: orderRecord.user_id,
      order_id: orderRecord.id,
      amount: orderRecord.payment_amount || orderRecord.total,
      payment_channel: orderRecord.payment_channel as 'bkash' | 'nagad' | 'bank',
      transaction_id: orderRecord.payment_transaction_id || '',
      bkash_payment_id: orderRecord.bkash_payment_id,
      bkash_url: orderRecord.bkash_url,
      status: orderRecord.payment_status as 'pending' | 'completed' | 'failed',
      purpose: 'order',
      created_at: orderRecord.created_at,
      updated_at: orderRecord.created_at
    };
  } catch (error) {
    console.error('Exception getting payment by transaction ID:', error);
    return null;
  }
} 