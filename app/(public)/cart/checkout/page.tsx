/**
SQL for user_orders table:

CREATE TABLE IF NOT EXISTS public.user_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    cart_items JSONB NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bkash', 'nagad', 'bank')),
    billing_name TEXT NOT NULL,
    billing_phone TEXT NOT NULL,
    billing_email TEXT,
    billing_address TEXT NOT NULL,
    billing_city TEXT NOT NULL,
    billing_district TEXT NOT NULL,
    billing_country TEXT NOT NULL,
    billing_postal TEXT NOT NULL,
    shipping_name TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    shipping_email,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_district TEXT NOT NULL,
    shipping_country TEXT NOT NULL,
    shipping_postal TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
*/

'use client';

import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import type { CartItem, GuestCartItem } from '@/types/cart';

const paymentMethods = [
  { id: 'bkash', label: 'bKash Payment' },
  { id: 'nagad', label: 'Nagad Payment' },
  { id: 'bank', label: 'Bank Transfer' },
];

// Helper functions for product image and price
type ProductType = CartItem['product'] | GuestCartItem['product'];

function getProductImage(product: ProductType) {
  if (product) {
    // CartItem['product'] type
    if ('image_urls' in product && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      return product.image_urls[0];
    }
    // GuestCartItem['product'] type
    if ('image_url' in product && typeof product.image_url === 'string' && product.image_url) {
      return product.image_url;
    }
  }
  return '/images/avatar.png';
}
function getProductPrice(product: ProductType) {
  if (product) {
    // CartItem['product'] type
    if ('price_offer' in product && typeof product.price_offer !== 'undefined' && product.price_offer !== null && product.price_offer !== 0) {
      return product.price_offer;
    }
    if ('price_regular' in product && typeof product.price_regular !== 'undefined') {
      return product.price_regular;
    }
    // GuestCartItem['product'] type
    if ('price' in product && typeof product.price !== 'undefined') {
      return product.price;
    }
  }
  return 0;
}

export default function CheckoutPage() {
  const { cart, guestCart } = useCart();
  const isGuest = !cart;
  const items = isGuest ? guestCart.items : cart?.items || [];
  const total = isGuest ? guestCart.total_price : cart?.total_price || 0;
  const router = useRouter();

  const [payment, setPayment] = useState('bkash');
  const [billing, setBilling] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postal: '',
    country: '',
    district: '',
  });
  const [shipping, setShipping] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postal: '',
    country: '',
    district: '',
  });
  const [sameShipping, setSameShipping] = useState(true);
  const [notes, setNotes] = useState('');

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBilling({ ...billing, [e.target.name]: e.target.value });
  };
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, validate and save order, then redirect
    if (payment === 'bkash') router.push('/cart/payment/bkash');
    else if (payment === 'nagad') router.push('/cart/payment/nagad');
    else router.push('/cart/payment/bank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 md:mb-0 col-span-2">
            {/* Billing Address */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Billing Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label htmlFor="name" className="block text-sm text-gray-800 font-medium mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={billing.name}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-gray-800 font-medium mb-1">Phone Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="phone"
                    value={billing.phone}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-800 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={billing.email}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-gray-800 font-medium mb-1">Country <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="country"
                    value={billing.country}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="district" className="block text-gray-800 font-medium mb-1">District <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="district"
                    value={billing.district}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-gray-800 font-medium mb-1">City <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={billing.city}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="postal" className="block text-gray-800 font-medium mb-1">Postal Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="postal"
                    value={billing.postal}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="address" className="block text-gray-800 font-medium mb-1">Street Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="address"
                    value={billing.address}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mt-4">
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameShipping}
                  onChange={() => setSameShipping(!sameShipping)}
                  className="accent-lime-600 w-5 h-5"
                />
                <span className="text-gray-800 font-medium">Shipping address is same as billing</span>
              </label>
              {!sameShipping && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="col-span-2">
                    <label htmlFor="name" className="block text-gray-800 font-medium mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={shipping.name}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-gray-800 font-medium mb-1">Phone Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="phone"
                      value={shipping.phone}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-gray-800 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={shipping.email}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-gray-800 font-medium mb-1">Country <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="country"
                      value={shipping.country}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="district" className="block text-gray-800 font-medium mb-1">District <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="district"
                      value={shipping.district}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-gray-800 font-medium mb-1">City <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="city"
                      value={shipping.city}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="postal" className="block text-gray-800 font-medium mb-1">Postal Code <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="postal"
                      value={shipping.postal}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="address" className="block text-gray-800 font-medium mb-1">Street Address <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="address"
                      value={shipping.address}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="col-span-2 mt-4">
              <label htmlFor="notes" className="block text-gray-800 font-medium mb-1">Additional Notes</label>
              <textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special instructions?"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400 min-h-[80px]"
              />
            </div>
          </div>

          {/* Checkout Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-lime-600" />
              Order Summary
            </h2>
            <div className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <div className="text-gray-500 py-8 text-center">Your cart is empty</div>
              ) : (
                items.map((item: CartItem | GuestCartItem) => (
                  <div key={item.product_id} className="flex items-center py-4 gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={getProductImage(item.product)}
                        alt={item.product?.name || 'Product'}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{item.product?.name || 'Product'}</div>
                      <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-semibold text-lime-700 text-base min-w-[60px] text-right">
                      ৳{(getProductPrice(item.product) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-lime-600">৳{total.toFixed(2)}</span>
            </div>
            {/* Payment Method */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment Method</h2>
              <div className="flex flex-col gap-2">
                {paymentMethods.map((method) => (
                  <label key={method.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg border border-gray-200 hover:bg-lime-50 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={payment === method.id}
                      onChange={() => setPayment(method.id)}
                      className="accent-lime-600 w-5 h-5"
                    />
                    <span className="text-gray-800 font-medium">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-lime-600 hover:bg-lime-700 text-white font-semibold rounded-lg py-3 text-lg shadow transition-colors"
            >
              Proceed to Payment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 