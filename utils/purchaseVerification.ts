import { createClient } from '@/utils/supabase/client';

export interface PurchaseVerificationResult {
  hasPurchased: boolean;
  orderCount: number;
  lastOrderDate?: string;
  orderStatus?: string;
}

/**
 * Check if a user has purchased a specific product
 * @param userId - The user's ID
 * @param productId - The product ID to check
 * @returns Promise<PurchaseVerificationResult>
 */
export async function checkUserPurchase(
  userId: string, 
  productId: string
): Promise<PurchaseVerificationResult> {
  const supabase = createClient();
  
  try {
    // Get all orders for the user
    const { data: orders, error } = await supabase
      .from('user_orders')
      .select('id, cart_items, status, created_at')
      .eq('user_id', userId)
      .in('status', ['completed', 'delivered', 'shipped']) // Only count successful orders
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error checking user purchase:', error);
      return {
        hasPurchased: false,
        orderCount: 0
      };
    }

    if (!orders || orders.length === 0) {
      return {
        hasPurchased: false,
        orderCount: 0
      };
    }

    // Check if any order contains the product
    let hasPurchased = false;
    let orderCount = 0;
    let lastOrderDate: string | undefined;
    let orderStatus: string | undefined;

    for (const order of orders) {
      if (order.cart_items && Array.isArray(order.cart_items)) {
        // Check if the product exists in cart_items
        const productInOrder = order.cart_items.find((item: any) => 
          item.product_id === productId || item.id === productId
        );

        if (productInOrder) {
          hasPurchased = true;
          orderCount++;
          
          // Get the most recent order with this product
          if (!lastOrderDate || new Date(order.created_at) > new Date(lastOrderDate)) {
            lastOrderDate = order.created_at;
            orderStatus = order.status;
          }
        }
      }
    }

    return {
      hasPurchased,
      orderCount,
      lastOrderDate,
      orderStatus
    };

  } catch (error) {
    console.error('Error in purchase verification:', error);
    return {
      hasPurchased: false,
      orderCount: 0
    };
  }
}

/**
 * Check if a user has any completed orders (for general purchase verification)
 * @param userId - The user's ID
 * @returns Promise<boolean>
 */
export async function hasAnyCompletedOrders(userId: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('user_orders')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['completed', 'delivered', 'shipped'])
      .limit(1);

    if (error) {
      console.error('Error checking user orders:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error in order verification:', error);
    return false;
  }
} 