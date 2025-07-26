export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  // Joined fields from products table
  product?: {
    id: string;
    name: string;
    slug: string;
    price_regular: number;
    price_offer: number | null;
    image_urls: string[];
    stock: number;
  };
}

export interface CartSummary {
  items: CartItem[];
  total_items: number;
  total_price: number;
  item_count: number;
}

export interface AddToCartRequest {
  product_id: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  cart_item_id: string;
  quantity: number;
}

export interface RemoveFromCartRequest {
  cart_item_id: string;
}

export interface CartFilters {
  user_id?: string;
  product_id?: string;
}

export interface GuestCartItem {
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price_regular: number;
    price_offer: number | null;
    image_url?: string;
    stock_quantity: number;
  };
}

export interface GuestCart {
  items: GuestCartItem[];
  total_items: number;
  total_price: number;
  item_count: number;
}

export interface CartContextType {
  cart: CartSummary | null;
  guestCart: GuestCart;
  loading: boolean;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateCartItem: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartCount: () => number;
  syncGuestCart: () => Promise<void>;
} 