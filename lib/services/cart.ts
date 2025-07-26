import { createClient } from '@/utils/supabase/client';
import { CartItem, CartSummary, AddToCartRequest } from '@/types/cart';

export class CartService {
  private async getSupabase() {
    return await createClient();
  }

  // Get user's cart with product details
  async getUserCart(userId: string): Promise<CartSummary> {
    const supabase = await this.getSupabase();
    
    // Use explicit join instead of relying on relationship detection
    const { data: cartItems, error } = await supabase
      .from('user_carts')
      .select(`
        id,
        user_id,
        product_id,
        quantity,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user cart:', error);
      throw new Error('Failed to fetch cart');
    }

    if (!cartItems || cartItems.length === 0) {
      return {
        items: [],
        total_items: 0,
        total_price: 0,
        item_count: 0
      };
    }

    // Fetch product details for each cart item
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
      throw new Error('Failed to fetch product details');
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
    
    // First get the cart item
    const { data: cartItem, error: cartError } = await supabase
      .from('user_carts')
      .select(`
        id,
        user_id,
        product_id,
        quantity,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (cartError && cartError.code !== 'PGRST116') {
      console.error('Error getting cart item by product:', cartError);
      return null;
    }

    if (!cartItem) {
      return null;
    }

    // Then get the product details
    const { data: product, error: productError } = await supabase
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
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Error getting product details:', productError);
      return null;
    }

    return {
      ...cartItem,
      product
    };
  }

  // Merge guest cart with user cart (simplified version)
  // async mergeGuestCart(userId: string, guestCart: GuestCartItem[]): Promise<void> {
  //   // This method is now handled in the CartContext
  //   // The context will call addToCart for each item individually
  //   console.log('mergeGuestCart called - handled by context');
  // }

  // Validate cart items (check stock availability)
  async validateCart(userId: string): Promise<{ valid: boolean; errors: string[] }> {
    const supabase = await this.getSupabase();
    const errors: string[] = [];

    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('user_carts')
      .select(`
        quantity,
        product_id
      `)
      .eq('user_id', userId);

    if (cartError) {
      console.error('Error validating cart:', cartError);
      return { valid: false, errors: ['Failed to validate cart'] };
    }

    if (!cartItems || cartItems.length === 0) {
      return { valid: true, errors: [] };
    }

    // Get product details for validation
    const productIds = cartItems.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        stock
      `)
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products for validation:', productsError);
      return { valid: false, errors: ['Failed to validate products'] };
    }

    // Create a map of products by ID for quick lookup
    const productsMap = new Map(products?.map(p => [p.id, p]) || []);

    // Validate each cart item
    cartItems.forEach((item) => {
      const product = productsMap.get(item.product_id);
      if (product && item.quantity > product.stock) {
        errors.push(`${product.name} - Only ${product.stock} available`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
} 