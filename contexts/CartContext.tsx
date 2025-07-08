'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { CartSummary, GuestCart, CartContextType } from '@/types/cart';
import { CartService } from '@/lib/services/cart';

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
    } else {
      setCart(null);
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  const loadUserCart = async () => {
    if (!user) return;

    try {
      const userCart = await cartService.getUserCart(user.id);
      // Ensure plain object
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
            total_price: updatedItems.reduce((sum, item) => sum + (item.quantity * item.product.price), 0),
            item_count: updatedItems.length
          };
          
          saveGuestCart(newGuestCart);
        } else {
          // Add new item (you'll need to fetch product details)
          // For now, we'll create a placeholder
          const newItem = {
            product_id: productId,
            quantity,
            product: {
              id: productId,
              name: 'Product', // You'll need to fetch this
              slug: '',
              price: 0, // You'll need to fetch this
              image_url: '',
              stock_quantity: 0
            }
          };
          
          const newItems = [...guestCart.items, newItem];
          const newGuestCart = {
            items: newItems,
            total_items: newItems.reduce((sum, item) => sum + item.quantity, 0),
            total_price: newItems.reduce((sum, item) => sum + (item.quantity * item.product.price), 0),
            item_count: newItems.length
          };
          
          saveGuestCart(newGuestCart);
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
          total_price: updatedItems.reduce((sum, item) => sum + (item.quantity * item.product.price), 0),
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
          total_price: updatedItems.reduce((sum, item) => sum + (item.quantity * item.product.price), 0),
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
      await cartService.mergeGuestCart(user.id, guestCart.items);
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