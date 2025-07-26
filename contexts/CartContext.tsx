'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { CartSummary, GuestCart, CartContextType, GuestCartItem } from '@/types/cart';
import { CartService } from '@/lib/services/cart';
import { getItemTotal } from '@/utils/priceUtils';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [guestCart, setGuestCart] = useState<GuestCart>({
    items: [],
    total_items: 0,
    total_price: 0,
    item_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const cartService = new CartService();

  // Check user authentication
  useEffect(() => {
    checkUser();
    loadGuestCart();
  }, []);

  // Load user cart when user changes
  useEffect(() => {
    if (user) {
      loadUserCart();
      // Sync guest cart when user logs in
      if (guestCart.items.length > 0) {
        syncGuestCart();
      }
    } else {
      setCart(null);
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();
      
      if (result.success) {
        setUser(result.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserCart = async () => {
    if (!user) return;

    try {
      const userCart = await cartService.getUserCart(user.id);
      setCart(userCart ? JSON.parse(JSON.stringify(userCart)) : null);
    } catch (error) {
      console.error('Error loading user cart:', error);
      toast.error('Failed to load cart');
    }
  };

  const loadGuestCart = () => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('guestCart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setGuestCart(parsedCart);
        } catch (error) {
          console.error('Error parsing guest cart:', error);
          localStorage.removeItem('guestCart');
        }
      }
    }
  };

  const saveGuestCart = (newCart: GuestCart) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guestCart', JSON.stringify(newCart));
    }
    setGuestCart(newCart);
  };

  // Fetch product details for guest cart
  const fetchProductDetails = async (productId: string) => {
    try {
      const { data, error } = await supabase
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

      if (error) {
        console.error('Error fetching product details:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        price_regular: data.price_regular,
        price_offer: data.price_offer,
        image_url: data.image_urls?.[0] || '',
        stock_quantity: data.stock
      };
    } catch (error) {
      console.error('Error fetching product details:', error);
      return null;
    }
  };

  const addToCart = async (productId: string, quantity: number) => {
    try {
      if (user) {
        // Add to user cart
        await cartService.addToCart(user.id, { product_id: productId, quantity });
        await loadUserCart();
        toast.success('Added to cart');
      } else {
        // Add to guest cart
        const existingItem = guestCart.items.find(item => item.product_id === productId);
        
        if (existingItem) {
          // Update existing item
          const updatedItems = guestCart.items.map(item =>
            item.product_id === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          
          const newGuestCart = {
            items: updatedItems,
            total_items: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
            total_price: updatedItems.reduce((sum, item) => sum + getItemTotal(item), 0),
            item_count: updatedItems.length
          };
          
          saveGuestCart(newGuestCart);
        } else {
          // Fetch product details and add new item
          const productDetails = await fetchProductDetails(productId);
          
          if (productDetails) {
            const newItem: GuestCartItem = {
              product_id: productId,
              quantity,
              product: productDetails
            };
            
            const newItems = [...guestCart.items, newItem];
            const newGuestCart = {
              items: newItems,
              total_items: newItems.reduce((sum, item) => sum + item.quantity, 0),
              total_price: newItems.reduce((sum, item) => sum + getItemTotal(item), 0),
              item_count: newItems.length
            };
            
            saveGuestCart(newGuestCart);
          } else {
            toast.error('Failed to fetch product details');
            return;
          }
        }
        
        toast.success('Added to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const updateCartItem = async (cartItemId: string, quantity: number) => {
    try {
      if (user) {
        // Update user cart item
        await cartService.updateCartItem(cartItemId, quantity);
        await loadUserCart();
        toast.success('Cart updated');
      } else {
        // Update guest cart item
        const updatedItems = guestCart.items.map(item =>
          item.product_id === cartItemId
            ? { ...item, quantity }
            : item
        ).filter(item => item.quantity > 0);
        
        const newGuestCart = {
          items: updatedItems,
          total_items: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          total_price: updatedItems.reduce((sum, item) => sum + getItemTotal(item), 0),
          item_count: updatedItems.length
        };
        
        saveGuestCart(newGuestCart);
        toast.success('Cart updated');
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast.error('Failed to update cart');
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      if (user) {
        // Remove from user cart
        await cartService.removeFromCart(cartItemId);
        await loadUserCart();
        toast.success('Item removed from cart');
      } else {
        // Remove from guest cart
        const updatedItems = guestCart.items.filter(item => item.product_id !== cartItemId);
        
        const newGuestCart = {
          items: updatedItems,
          total_items: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          total_price: updatedItems.reduce((sum, item) => sum + getItemTotal(item), 0),
          item_count: updatedItems.length
        };
        
        saveGuestCart(newGuestCart);
        toast.success('Item removed from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      if (user) {
        // Clear user cart
        await cartService.clearUserCart(user.id);
        setCart(null);
        toast.success('Cart cleared');
      } else {
        // Clear guest cart
        const emptyCart = {
          items: [],
          total_items: 0,
          total_price: 0,
          item_count: 0
        };
        saveGuestCart(emptyCart);
        toast.success('Cart cleared');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const getCartCount = (): number => {
    if (user && cart) {
      return cart.total_items;
    } else {
      return guestCart.total_items;
    }
  };

  const syncGuestCart = async () => {
    if (!user || guestCart.items.length === 0) return;

    try {
      // Add each guest cart item to user cart
      for (const item of guestCart.items) {
        try {
          await cartService.addToCart(user.id, {
            product_id: item.product_id,
            quantity: item.quantity
          });
        } catch (error) {
          console.error(`Error adding item ${item.product_id} to user cart:`, error);
        }
      }
      
      // Reload user cart
      await loadUserCart();
      
      // Clear guest cart after successful sync
      const emptyCart = {
        items: [],
        total_items: 0,
        total_price: 0,
        item_count: 0
      };
      saveGuestCart(emptyCart);
      
      toast.success('Cart synced successfully');
    } catch (error) {
      console.error('Error syncing guest cart:', error);
      toast.error('Failed to sync cart');
    }
  };

  const value: CartContextType = {
    cart,
    guestCart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartCount,
    syncGuestCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 