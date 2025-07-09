"use client";

import { useCart } from '@/contexts/CartContext';
import type { CartItem, GuestCartItem } from '@/types/cart';
import Link from 'next/link';
import React from 'react'; // Added missing import for React

function getItemId(item: CartItem | GuestCartItem) {
  return 'id' in item && item.id ? item.id : item.product_id;
}
function getProductImage(item: CartItem | GuestCartItem) {
  const product = item.product;
  if (product && 'image_urls' in product && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    return product.image_urls[0];
  }
  if (product && 'image_url' in product && typeof product.image_url === 'string' && product.image_url) {
    return product.image_url;
  }
  return undefined;
}
function getProductName(item: CartItem | GuestCartItem) {
  return item.product?.name || 'Product';
}
function getProductPrice(item: CartItem | GuestCartItem) {
  const product = item.product;
  if (product && 'price_offer' in product && typeof product.price_offer !== 'undefined') {
    return product.price_offer != null && product.price_offer !== 0
      ? product.price_offer
      : (product as { price_regular?: number }).price_regular || 0;
  } else if (product && 'price' in product && typeof product.price !== 'undefined') {
    return product.price || 0;
  }
  return 0;
}
function getProductTotal(item: CartItem | GuestCartItem) {
  return item.quantity * getProductPrice(item);
}

export default function CartPage() {
  const { cart, guestCart, loading, updateCartItem, removeFromCart } = useCart();
  const isGuest = !cart;
  const items = isGuest ? guestCart.items : cart?.items || [];
  const total = isGuest ? guestCart.total_price : cart?.total_price || 0;

  // Coupon state (UI only for now)
  const [coupon, setCoupon] = React.useState('');
  const [couponApplied, setCouponApplied] = React.useState(false);
  const [couponError, setCouponError] = React.useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading cart...</div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="mb-4 text-gray-600">Looks like you haven't added any items yet.</p>
        <Link href="/shop" className="px-6 py-2 bg-lime-600 text-white rounded hover:bg-lime-700">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Cart Items */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow p-6">
              {items.map((item) => (
                <div key={getItemId(item)} className="flex items-center border-b last:border-b-0 pb-4 mb-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {getProductImage(item) ? (
                      <img src={getProductImage(item)} alt={getProductName(item)} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 ml-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{getProductName(item)}</h3>
                    <p className="text-sm text-gray-500 mb-2">Price: ৳{getProductPrice(item).toFixed(2)}</p>
                <div className="flex items-center space-x-2">
                  <button
                        onClick={() => updateCartItem(getItemId(item), item.quantity - 1)}
                    className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                        disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                        onClick={() => updateCartItem(getItemId(item), item.quantity + 1)}
                    className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    +
                  </button>
                  <button
                        onClick={() => removeFromCart(getItemId(item))}
                    className="ml-4 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right font-semibold text-lg min-w-[80px]">৳{getProductTotal(item).toFixed(2)}</div>
            </div>
          ))}
        </div>
          </div>
          {/* Right: Summary & Coupon */}
          <div>
            <div className="bg-white rounded-xl shadow p-6 mb-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>৳{total.toFixed(2)}</span>
              </div>
              {/* Coupon UI */}
              <div className="my-4">
                <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <div className="flex">
                  <input
                    id="coupon"
                    type="text"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                    placeholder="Enter coupon code"
                    disabled={couponApplied}
                  />
                  <button
                    className="px-4 py-2 bg-lime-600 text-white rounded-r-md hover:bg-lime-700 disabled:opacity-50"
                    disabled={couponApplied || !coupon}
                    onClick={() => setCouponApplied(true)}
                  >
                    Apply
                  </button>
                </div>
                {couponError && <div className="text-red-500 text-sm mt-1">{couponError}</div>}
                {couponApplied && !couponError && <div className="text-green-600 text-sm mt-1">Coupon applied!</div>}
              </div>
              <div className="flex justify-between font-bold text-lg mt-6">
                <span>Total</span>
                <span className="font-bold text-lg mt-6">৳{total.toFixed(2)}</span>
              </div>
          <Link href="/cart/checkout" className="w-full mt-6 px-6 py-3 bg-lime-600 text-white rounded hover:bg-lime-700 text-lg font-semibold text-center block">Proceed to Checkout</Link>
        </div>
        <div className="mt-6 text-center">
              <Link href="/shop" className="text-lime-600 hover:underline">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 