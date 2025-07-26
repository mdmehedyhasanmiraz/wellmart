'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import BkashPaymentButton from '@/components/payment/BkashPaymentButton';
import type { CartItem, GuestCartItem } from '@/types/cart';
import { bankDetails } from '@/lib/config/bankDetails';
import { CartService } from '@/lib/services/cart';
import { Product } from '@/types/product';
import { createClient } from '@/utils/supabase/client';
// Use require for JSON imports to avoid type errors
import divisionsData from '@/data/bd-geo/bd-divisions.json';
import districtsData from '@/data/bd-geo/bd-districts.json';
import upazilasData from '@/data/bd-geo/bd-upazilas.json';

// Types for geo data
interface Division { id: string; name: string; }
interface District { id: string; division_id: string; name: string; }
interface Upazila { id: string; district_id: string; name: string; }

const paymentMethods = [
  { id: 'bkash', label: 'bKash Payment' },
  { id: 'nagad', label: 'Nagad Payment' },
  { id: 'bank', label: 'Bank Transfer' },
  { id: 'cod', label: 'Cash on Delivery' },
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

  interface User {
    id: string;
    name: string;
    phone: string;
    email: string;
  }

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
    division: '',
    upazila: '',
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
    division: '',
    upazila: '',
  });
  const [sameShipping, setSameShipping] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [freeDeliveryMin, setFreeDeliveryMin] = useState<number>(799);

  // Geo data state
  const [divisions] = useState<Division[]>(divisionsData.divisions);
  const [districts] = useState<District[]>(districtsData.districts);
  const [upazilas] = useState<Upazila[]>(upazilasData.upazilas);

  // Filtered options
  const billingDistricts = districts.filter((d: District) => d.division_id === billing.division);
  const billingUpazilas = upazilas.filter((u: Upazila) => u.district_id === billing.district);
  const shippingDistricts = districts.filter((d: District) => d.division_id === shipping.division);
  const shippingUpazilas = upazilas.filter((u: Upazila) => u.district_id === shipping.district);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      
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
    }

    loadUser();
  }, []);

  useEffect(() => {
    async function fetchFreeDeliveryMin() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('site_settings').select('free_delivery_min').order('updated_at', { ascending: false }).limit(1).single();
        if (data && data.free_delivery_min !== undefined && data.free_delivery_min !== null) {
          setFreeDeliveryMin(Number(data.free_delivery_min));
        }
      } catch (error) {
        console.error('Error fetching free delivery minimum:', error);
        // fallback to default
      }
    }
    fetchFreeDeliveryMin();
  }, []);

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBilling(prev => {
      const updated = { ...prev, [name]: value };
      // Reset dependent fields
      if (name === 'division') {
        updated.district = '';
        updated.upazila = '';
      } else if (name === 'district') {
        updated.upazila = '';
      }
      return updated;
    });
  };
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShipping(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'division') {
        updated.district = '';
        updated.upazila = '';
      } else if (name === 'district') {
        updated.upazila = '';
      }
      return updated;
    });
  };

  const createOrder = async (paymentMethod: string, paymentStatus: string = 'pending') => {
    setIsSubmitting(true);
    
    try {
      // Process cart items to include proper price information
      const processedCartItems = items.map((item: CartItem | GuestCartItem) => {
        let price = 0;
        const product = item.product as Product;
        
        if (cart) {
          // User cart - use price_offer if available, otherwise price_regular
          price = product?.price_offer || product?.price_regular || 0;
        } else {
          // Guest cart - use price
          price = product?.price_offer || product?.price_regular || 0;
        }
        
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          price: price,
          product: {
            id: product?.id,
            name: product?.name,
            image_url: product?.image_urls?.[0],
            sku: product?.sku,
            price_offer: product?.price_offer,
            price_regular: product?.price_regular,
            price: product?.price_offer || product?.price_regular || 0,
            stock: product?.stock || 0,
            description: product?.description || '',
            category_id: product?.category_id || '',
            manufacturer_id: product?.manufacturer_id || '',
            is_active: product?.is_active || false,
            created_at: product?.created_at || '',
            updated_at: product?.updated_at || '',
            category: product?.category || null,
            manufacturer: product?.manufacturer || null,
          }
        };
      });

      const orderData = {
        user_id: user?.id || null,
        cart_items: processedCartItems,
        total: total,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        billing_name: billing.name,
        billing_phone: billing.phone,
        billing_email: billing.email,
        billing_address: billing.address,
        billing_city: billing.city,
        billing_district: billing.district,
        billing_country: billing.country,
        billing_postal: billing.postal,
        shipping_name: sameShipping ? billing.name : shipping.name,
        shipping_phone: sameShipping ? billing.phone : shipping.phone,
        shipping_email: sameShipping ? billing.email : shipping.email,
        shipping_address: sameShipping ? billing.address : shipping.address,
        shipping_city: sameShipping ? billing.city : shipping.city,
        shipping_district: sameShipping ? billing.district : shipping.district,
        shipping_country: sameShipping ? billing.country : shipping.country,
        shipping_postal: sameShipping ? billing.postal : shipping.postal,
        notes: notes,
        status: 'pending'
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Order placed successfully!');
        // Clear cart after successful order
        if (cart) {
          // Clear user cart
          const cartService = new CartService();
          await cartService.clearUserCart(user!.id);
        } else {
          // Clear guest cart
          localStorage.removeItem('guestCart');
        }
        
        // Redirect to order confirmation page
        router.push(`/orders/${result.order.id}`);
      } else {
        toast.error(result.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!billing.name || !billing.phone || !billing.address || !billing.city || !billing.country || !billing.district || !billing.postal) {
      toast.error('Please fill in all required billing fields');
      return;
    }

    if (!sameShipping && (!shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.country || !shipping.district || !shipping.postal)) {
      toast.error('Please fill in all required shipping fields');
      return;
    }

    // Handle different payment methods
    if (payment === 'bank') {
      await createOrder('bank', 'pending');
    } else if (payment === 'nagad') {
      // Call Nagad payment API and redirect
      try {
        setIsSubmitting(true);
        const response = await fetch('/api/nagad/make-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.id || null,
            amount: total,
            email: billing.email || user?.email || '',
            name: billing.name,
            phone: billing.phone,
            purpose: 'order',
          }),
        });
        const result = await response.json();
        if (result.statusCode === 200 && result.data?.nagadURL) {
          window.location.href = result.data.nagadURL;
        } else {
          toast.error(result.statusMessage || 'Failed to initiate Nagad payment');
        }
      } catch (error) {
        toast.error('Failed to initiate Nagad payment');
        console.error('Error initiating Nagad payment:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else if (payment === 'cod') {
      await createOrder('cod', 'pending');
    } else {
      // For other payment methods, redirect to payment pages
      router.push(`/cart/payment/${payment}`);
    }
  };

  // Check if form is valid for bKash payment
  const isFormValid = billing.name && billing.phone && billing.address && billing.city && billing.country && billing.district && billing.postal &&
    (sameShipping || (shipping.name && shipping.phone && shipping.address && shipping.city && shipping.country && shipping.district && shipping.postal));

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Checkout</h1>
        
        {/* Mobile Order Summary - Show at top on mobile */}
        <div className="lg:hidden mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-lime-600" />
              Order Summary
            </h2>
            {/* Free Delivery Message */}
            {total >= freeDeliveryMin ? (
              <div className="mb-3 p-2 rounded bg-green-50 text-green-700 text-center text-sm font-medium border border-green-200">
                🎉 You qualify for <b>Free Delivery</b>!
              </div>
            ) : (
              <div className="mb-3 p-2 rounded bg-yellow-50 text-yellow-700 text-center text-sm font-medium border border-yellow-200">
                Add <b>৳{(freeDeliveryMin - total).toFixed(2)}</b> more for <b>Free Delivery</b>!
              </div>
            )}
            <div className="divide-y divide-gray-100 mb-4">
              {(items.length || 0) === 0 ? (
                <div className="text-gray-500 py-4 text-center">Your cart is empty</div>
              ) : (
                items.slice(0, 3).map((item: CartItem | GuestCartItem) => (
                  <div key={item.product_id} className="flex items-center py-3 gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={getProductImage(item.product)}
                        alt={item.product?.name || 'Product'}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">{item.product?.name || 'Product'}</div>
                      <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-semibold text-lime-700 text-sm min-w-[50px] text-right">
                      ৳{(getProductPrice(item.product) as number * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
              {(items.length || 0) > 3 && (
                <div className="py-2 text-center text-sm text-gray-500">
                  +{(items.length || 0) - 3} more items
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-lime-600">৳{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Billing & Shipping Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing Address */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm text-gray-800 font-medium mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={billing.name}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
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
                    className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
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
                    className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                  />
                </div>
                <div>
                  <label htmlFor="division" className="block text-gray-800 font-medium mb-1">Division <span className="text-red-500">*</span></label>
                  <select
                    name="division"
                    value={billing.division || ''}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    required
                  >
                    <option value="">Select Division</option>
                    {divisions.map((div: Division) => (
                      <option key={div.id} value={div.id}>{div.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="district" className="block text-gray-800 font-medium mb-1">District <span className="text-red-500">*</span></label>
                  <select
                    name="district"
                    value={billing.district || ''}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    required
                    disabled={!billing.division}
                  >
                    <option value="">Select District</option>
                    {billingDistricts.map((dist: District) => (
                      <option key={dist.id} value={dist.id}>{dist.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="upazila" className="block text-gray-800 font-medium mb-1">Upazila/Thana <span className="text-red-500">*</span></label>
                  <select
                    name="upazila"
                    value={billing.upazila || ''}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    required
                    disabled={!billing.district}
                  >
                    <option value="">Select Upazila/Thana</option>
                    {billingUpazilas.map((upz: Upazila) => (
                      <option key={upz.id} value={upz.id}>{upz.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="city" className="block text-gray-800 font-medium mb-1">City <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={billing.city}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
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
                    className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-gray-800 font-medium mb-1">Street Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="address"
                    value={billing.address}
                    onChange={handleBillingChange}
                    className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameShipping}
                  onChange={() => setSameShipping(!sameShipping)}
                  className="accent-lime-600 w-5 h-5"
                />
                <span className="text-gray-800 font-medium">Shipping address is same as billing</span>
              </label>
              {!sameShipping && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="shipping-name" className="block text-gray-800 font-medium mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={shipping.name}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="shipping-phone" className="block text-gray-800 font-medium mb-1">Phone Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="phone"
                      value={shipping.phone}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="shipping-email" className="block text-gray-800 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={shipping.email}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="shipping-division" className="block text-gray-800 font-medium mb-1">Division <span className="text-red-500">*</span></label>
                    <select
                      name="division"
                      value={shipping.division || ''}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                    >
                      <option value="">Select Division</option>
                      {divisions.map((div: Division) => (
                        <option key={div.id} value={div.id}>{div.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="shipping-district" className="block text-gray-800 font-medium mb-1">District <span className="text-red-500">*</span></label>
                    <select
                      name="district"
                      value={shipping.district || ''}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                      disabled={!shipping.division}
                    >
                      <option value="">Select District</option>
                      {shippingDistricts.map((dist: District) => (
                        <option key={dist.id} value={dist.id}>{dist.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="shipping-upazila" className="block text-gray-800 font-medium mb-1">Upazila/Thana <span className="text-red-500">*</span></label>
                    <select
                      name="upazila"
                      value={shipping.upazila || ''}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                      disabled={!shipping.district}
                    >
                      <option value="">Select Upazila/Thana</option>
                      {shippingUpazilas.map((upz: Upazila) => (
                        <option key={upz.id} value={upz.id}>{upz.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="shipping-city" className="block text-gray-800 font-medium mb-1">City <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="city"
                      value={shipping.city}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="shipping-postal" className="block text-gray-800 font-medium mb-1">Postal Code <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="postal"
                      value={shipping.postal}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="shipping-address" className="block text-gray-800 font-medium mb-1">Street Address <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="address"
                      value={shipping.address}
                      onChange={handleShippingChange}
                      className="border border-gray-200 rounded-lg w-full px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <label htmlFor="notes" className="block text-gray-800 font-medium mb-2">Additional Notes</label>
              <textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special instructions?"
                className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 focus:ring-2 focus:ring-lime-200 focus:border-lime-400 min-h-[80px]"
              />
            </div>
          </div>

          {/* Desktop Order Summary & Payment */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-6 sticky top-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-lime-600" />
                Order Summary
              </h2>
              
              {/* Free Delivery Message */}
              {total >= freeDeliveryMin ? (
                <div className="mb-4 p-3 rounded bg-green-50 text-green-700 text-center text-sm font-medium border border-green-200">
                  🎉 You qualify for <b>Free Delivery</b>!
                </div>
              ) : (
                <div className="mb-4 p-3 rounded bg-yellow-50 text-yellow-700 text-center text-sm font-medium border border-yellow-200">
                  Add <b>৳{(freeDeliveryMin - total).toFixed(2)}</b> more for <b>Free Delivery</b>!
                </div>
              )}
              
              {/* Desktop Order Items */}
              <div className="hidden lg:block divide-y divide-gray-100">
                {(items.length || 0) === 0 ? (
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
                        ৳{(getProductPrice(item.product) as number * item.quantity).toFixed(2)}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Method</h3>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <label key={method.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-lime-50 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={payment === method.id}
                        onChange={() => setPayment(method.id)}
                        className="accent-lime-600 w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <span className="text-gray-800 font-medium text-sm sm:text-base">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Method Specific Content */}
              {payment === 'bkash' ? (
                <div>
                  {!user ? (
                    <div className="p-4 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-700 rounded-lg">
                      <p className="text-center text-sm">Please log in to proceed with bKash payment.</p>
                      <button
                        type="button"
                        onClick={() => router.push('/login?next=' + encodeURIComponent(window.location.pathname))}
                        className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg py-2 transition-colors text-sm"
                      >
                        Log In
                      </button>
                    </div>
                  ) : (
                    <BkashPaymentButton
                      amount={total}
                      user_id={user.id}
                      email={billing.email || user.email || ''}
                      name={billing.name}
                      phone={billing.phone}
                      purpose="order"
                      disabled={!isFormValid}
                    />
                  )}
                </div>
              ) : payment === 'bank' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Bank Transfer Details
                    </h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Bank Name:</span>
                        <span className="text-gray-900">{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Account Name:</span>
                        <span className="text-gray-900">{bankDetails.accountName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Account Number:</span>
                        <span className="text-gray-900 font-mono">{bankDetails.accountNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Branch:</span>
                        <span className="text-gray-900">{bankDetails.branch}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Routing Number:</span>
                        <span className="text-gray-900 font-mono">{bankDetails.routingNumber}</span>
                      </div>
                      {bankDetails.swiftCode && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">SWIFT Code:</span>
                          <span className="text-gray-900 font-mono">{bankDetails.swiftCode}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Amount to Transfer:</span>
                        <span className="text-base sm:text-lg font-bold text-lime-600">৳{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center text-sm sm:text-base">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Important Instructions
                    </h4>
                    <ul className="text-xs sm:text-sm text-yellow-700 space-y-1">
                      {bankDetails.instructions.map((instruction, index) => (
                        <li key={index}>• {instruction.replace('{amount}', `৳${total.toFixed(2)}`)}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg py-3 text-base sm:text-lg shadow transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-5 border-b-2 border-white mr-2"></div>
                        Placing Order...
                      </>
                    ) : (
                      'Place Order with Bank Transfer'
                    )}
                  </button>
                </div>
              ) : payment === 'nagad' ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-3 flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Nagad Payment
                  </h3>
                  <p className="text-green-700 mb-4 text-sm">Nagad payment integration coming soon. Please select another payment method.</p>
                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg py-3 text-base sm:text-lg shadow transition-colors"
                  >
                    Proceed to Payment
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-lime-600 hover:bg-lime-700 text-white font-semibold rounded-lg py-3 text-base sm:text-lg shadow transition-colors"
                >
                  Proceed to Payment
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 