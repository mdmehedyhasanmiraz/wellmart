/**
 * Safely get the price from a cart item, handling different cart item structures
 */
export function getItemPrice(item: any): number {
  if (!item) return 0;
  
  // If item has a direct price property, use it
  if (typeof item.price === 'number') {
    return item.price;
  }
  
  // If item has a product with price properties
  if (item.product) {
    // Guest cart structure: product.price_offer or product.price_regular
    if (typeof item.product.price_offer === 'number' && item.product.price_offer > 0) {
      return item.product.price_offer;
    }
    
    if (typeof item.product.price_regular === 'number') {
      return item.product.price_regular;
    }
    
    // Legacy guest cart structure: product.price
    if (typeof item.product.price === 'number') {
      return item.product.price;
    }
  }
  
  return 0;
}

/**
 * Format currency with proper error handling
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '৳0.00';
  }
  return `৳${amount.toFixed(2)}`;
}

/**
 * Calculate total price for an item (price * quantity)
 */
export function getItemTotal(item: any): number {
  const price = getItemPrice(item);
  const quantity = item?.quantity || 0;
  return price * quantity;
} 