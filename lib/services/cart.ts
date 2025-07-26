import { createClient } from '@/utils/supabase/client';
import { CartItem, CartSummary, AddToCartRequest, GuestCartItem } from '@/types/cart';

export class CartService {
  private async getSupabase() {
    return await createClient();
  }

  // Get user's cart with product details
  async getUserCart(userId: string): Promise<CartSummary> {
    const supabase = await this.getSupabase();
    
    const { data: cartItems, error } = await supabase
      .from('user_carts')
      .select(`
        *,
        product:products(
          id,
          name,
          slug,
          price_regular,
          price_offer,
          image_urls,
          stock
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user cart:', error);
      throw new Error('Failed to fetch cart');
    }

    const items = cartItems || [];
    const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
    const total_price = items.reduce((sum, item) => {
      const price = item.product?.price_offer != null && item.product?.price_offer !== 0
        ? item.product.price_offer
        : item.product?.price_regular || 0;
      return sum + (item.quantity * price);
    }, 0);

    // Ensure a plain object is returned
    return JSON.parse(JSON.stringify({
      items,
      total_items,
      total_price,
      item_count: items.length
    }));
  }

  // Add item to cart
  async addToCart(userId: string, request: AddToCartRequest): Promise<CartItem> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('user_carts')
      .upsert([{
        user_id: userId,
        product_id: request.product_id,
        quantity: request.quantity
      }], {
        onConflict: 'user_id,product_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding to cart:', error);
      throw new Error('Failed to add item to cart');
    }

    return data;
  }

  // Update cart item quantity
  async updateCartItem(cartItemId: string, quantity: number): Promise<CartItem> {
    const supabase = await this.getSupabase();
    
    if (quantity <= 0) {
      // If quantity is 0 or negative, remove the item
      await this.removeFromCart(cartItemId);
      throw new Error('Item removed from cart');
    }

    const { data, error } = await supabase
      .from('user_carts')
      .update({ quantity })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating cart item:', error);
      throw new Error('Failed to update cart item');
    }

    return data;
  }

  // Remove item from cart
  async removeFromCart(cartItemId: string): Promise<void> {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase
      .from('user_carts')
      .delete()
      .eq('id', cartItemId);

    if (error) {
      console.error('Error removing from cart:', error);
      throw new Error('Failed to remove item from cart');
    }
  }

  // Clear user's entire cart
  async clearUserCart(userId: string): Promise<void> {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase
      .from('user_carts')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing cart:', error);
      throw new Error('Failed to clear cart');
    }
  }

  // Get cart count for user
  async getCartCount(userId: string): Promise<number> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .rpc('get_user_cart_count', { user_uuid: userId });

    if (error) {
      console.error('Error getting cart count:', error);
      return 0;
    }

    return data || 0;
  }

  // Get cart total for user
  async getCartTotal(userId: string): Promise<number> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .rpc('get_user_cart_total', { user_uuid: userId });

    if (error) {
      console.error('Error getting cart total:', error);
      return 0;
    }

    return data || 0;
  }

  // Check if product is in user's cart
  async isProductInCart(userId: string, productId: string): Promise<boolean> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('user_carts')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking if product in cart:', error);
      return false;
    }

    return !!data;
  }

  // Get cart item by product ID
  async getCartItemByProduct(userId: string, productId: string): Promise<CartItem | null> {
    const supabase = await this.getSupabase();
    
    const { data, error } = await supabase
      .from('user_carts')
      .select(`
        *,
        product:products(
          id,
          name,
          slug,
          price,
          image_url,
          stock_quantity
        )
      `)
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting cart item by product:', error);
      return null;
    }

    return data;
  }

  // Merge guest cart with user cart (simplified version)
  async mergeGuestCart(userId: string, guestCart: GuestCartItem[]): Promise<void> {
    // This method is now handled in the CartContext
    // The context will call addToCart for each item individually
    console.log('mergeGuestCart called - handled by context');
  }

  // Validate cart items (check stock availability)
  async validateCart(userId: string): Promise<{ valid: boolean; errors: string[] }> {
    const supabase = await this.getSupabase();
    const errors: string[] = [];

    const { data: cartItems, error } = await supabase
      .from('user_carts')
      .select(`
        quantity,
        product:products(
          name,
          stock_quantity
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error validating cart:', error);
      return { valid: false, errors: ['Failed to validate cart'] };
    }

    (cartItems as unknown as CartItem[])?.forEach((item) => {
      if (item.quantity > (item.product?.stock || 0)) {
        errors.push(`${item.product?.name} - Only ${item.product?.stock} available`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
} 