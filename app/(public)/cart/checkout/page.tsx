'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
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
interface District { id: string; name: string; division_id: string; }
interface Upazila { id: string; name: string; district_id: string; }

// Types for form data
interface BillingData {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postal: string;
  country: string;
  district: string;
  division: string;
  upazila: string;
}

export default function CheckoutPage() {
  const { cart, guestCart } = useCart();
  const { user, requireAuth } = useAuth();
  const isGuest = !cart;
  const items = isGuest ? guestCart.items : cart?.items || [];
  const total = isGuest ? guestCart.total_price : cart?.total_price || 0;
  const router = useRouter();

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
          // setUser(result.user); // This line is removed as per the new_code
        } else {
          // setUser(null); // This line is removed as per the new_code
        }
      } catch (error) {
        console.error('Error checking user:', error);
        // setUser(null); // This line is removed as per the new_code
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

  const createOrder = async (paymentMethod: string, status: string) => {
    setIsSubmitting(true);
    try {
      const orderData = {
        user_id: user?.id || null,
        items: items.map((item: CartItem | GuestCartItem) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        total_amount: total,
        payment_method: paymentMethod,
        status: status,
        billing_address: {
          name: billing.name,
          phone: billing.phone,
          email: billing.email,
          address: billing.address,
          city: billing.city,
          postal: billing.postal,
          country: billing.country,
          district: billing.district,
          division: billing.division,
          upazila: billing.upazila,
        },
        shipping_address: sameShipping ? {
          name: billing.name,
          phone: billing.phone,
          email: billing.email,
          address: billing.address,
          city: billing.city,
          postal: billing.postal,
          country: billing.country,
          district: billing.district,
          division: billing.division,
          upazila: billing.upazila,
        } : {
          name: shipping.name,
          phone: shipping.phone,
          email: shipping.email,
          address: shipping.address,
          city: shipping.city,
          postal: shipping.postal,
          country: shipping.country,
          district: shipping.district,
          division: shipping.division,
          upazila: shipping.upazila,
        },
        notes: notes,
        guest_cart: isGuest ? guestCart : null
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
        router.push(`/orders/${result.order.id}`);
      } else {
        toast.error(result.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2">
              {items.map((item: CartItem | GuestCartItem) => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.product_name} × {item.quantity}</span>
                  <span className="font-medium">৳{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>৳{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Billing Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="billing-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="billing-name"
                      name="name"
                      value={billing.name}
                      onChange={handleBillingChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="billing-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="billing-phone"
                      name="phone"
                      value={billing.phone}
                      onChange={handleBillingChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="billing-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="billing-email"
                      name="email"
                      value={billing.email}
                      onChange={handleBillingChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="billing-country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      id="billing-country"
                      name="country"
                      value={billing.country}
                      onChange={handleBillingChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="billing-division" className="block text-sm font-medium text-gray-700 mb-1">
                      Division *
                    </label>
                    <select
                      id="billing-division"
                      name="division"
                      value={billing.division}
                      onChange={handleBillingChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    >
                      <option value="">Select Division</option>
                      {divisions.map((division) => (
                        <option key={division.id} value={division.id}>
                          {division.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="billing-district" className="block text-sm font-medium text-gray-700 mb-1">
                      District *
                    </label>
                    <select
                      id="billing-district"
                      name="district"
                      value={billing.district}
                      onChange={handleBillingChange}
                      required
                      disabled={!billing.division}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 disabled:bg-gray-100"
                    >
                      <option value="">Select District</option>
                      {billingDistricts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="billing-upazila" className="block text-sm font-medium text-gray-700 mb-1">
                      Upazila
                    </label>
                    <select
                      id="billing-upazila"
                      name="upazila"
                      value={billing.upazila}
                      onChange={handleBillingChange}
                      disabled={!billing.district}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 disabled:bg-gray-100"
                    >
                      <option value="">Select Upazila</option>
                      {billingUpazilas.map((upazila) => (
                        <option key={upazila.id} value={upazila.id}>
                          {upazila.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="billing-city" className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      id="billing-city"
                      name="city"
                      value={billing.city}
                      onChange={handleBillingChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="billing-postal" className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      id="billing-postal"
                      name="postal"
                      value={billing.postal}
                      onChange={handleBillingChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="billing-address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <textarea
                      id="billing-address"
                      name="address"
                      value={billing.address}
                      onChange={handleBillingChange}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Shipping Information</h2>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sameShipping}
                      onChange={(e) => setSameShipping(e.target.checked)}
                      className="rounded border-gray-300 text-lime-600 focus:ring-lime-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Same as billing address</span>
                  </label>
                </div>
                
                {!sameShipping && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="shipping-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="shipping-name"
                        name="name"
                        value={shipping.name}
                        onChange={handleShippingChange}
                        required={!sameShipping}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="shipping-phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="shipping-phone"
                        name="phone"
                        value={shipping.phone}
                        onChange={handleShippingChange}
                        required={!sameShipping}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="shipping-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="shipping-email"
                        name="email"
                        value={shipping.email}
                        onChange={handleShippingChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="shipping-country" className="block text-sm font-medium text-gray-700 mb-1">
                        Country *
                      </label>
                      <input
                        type="text"
                        id="shipping-country"
                        name="country"
                        value={shipping.country}
                        onChange={handleShippingChange}
                        required={!sameShipping}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="shipping-division" className="block text-sm font-medium text-gray-700 mb-1">
                        Division *
                      </label>
                      <select
                        id="shipping-division"
                        name="division"
                        value={shipping.division}
                        onChange={handleShippingChange}
                        required={!sameShipping}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      >
                        <option value="">Select Division</option>
                        {divisions.map((division) => (
                          <option key={division.id} value={division.id}>
                            {division.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="shipping-district" className="block text-sm font-medium text-gray-700 mb-1">
                        District *
                      </label>
                      <select
                        id="shipping-district"
                        name="district"
                        value={shipping.district}
                        onChange={handleShippingChange}
                        required={!sameShipping}
                        disabled={!shipping.division}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 disabled:bg-gray-100"
                      >
                        <option value="">Select District</option>
                        {shippingDistricts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="shipping-upazila" className="block text-sm font-medium text-gray-700 mb-1">
                        Upazila
                      </label>
                      <select
                        id="shipping-upazila"
                        name="upazila"
                        value={shipping.upazila}
                        onChange={handleShippingChange}
                        disabled={!shipping.district}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Upazila</option>
                        {shippingUpazilas.map((upazila) => (
                          <option key={upazila.id} value={upazila.id}>
                            {upazila.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="shipping-city" className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        id="shipping-city"
                        name="city"
                        value={shipping.city}
                        onChange={handleShippingChange}
                        required={!sameShipping}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="shipping-postal" className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        id="shipping-postal"
                        name="postal"
                        value={shipping.postal}
                        onChange={handleShippingChange}
                        required={!sameShipping}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="shipping-address" className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <textarea
                        id="shipping-address"
                        name="address"
                        value={shipping.address}
                        onChange={handleShippingChange}
                        required={!sameShipping}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="bkash"
                      checked={payment === 'bkash'}
                      onChange={(e) => setPayment(e.target.value)}
                      className="text-lime-600 focus:ring-lime-500"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <img src="/logos/logo-bkash-round.svg" alt="bKash" className="w-6 h-6 mr-2" />
                        <span className="font-medium">bKash</span>
                      </div>
                      <p className="text-sm text-gray-500">Pay with bKash mobile banking</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="nagad"
                      checked={payment === 'nagad'}
                      onChange={(e) => setPayment(e.target.value)}
                      className="text-lime-600 focus:ring-lime-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium">Nagad</span>
                      <p className="text-sm text-gray-500">Pay with Nagad mobile banking</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="bank"
                      checked={payment === 'bank'}
                      onChange={(e) => setPayment(e.target.value)}
                      className="text-lime-600 focus:ring-lime-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium">Bank Transfer</span>
                      <p className="text-sm text-gray-500">Pay via bank transfer</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={payment === 'cod'}
                      onChange={(e) => setPayment(e.target.value)}
                      className="text-lime-600 focus:ring-lime-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium">Cash on Delivery</span>
                      <p className="text-sm text-gray-500">Pay when you receive your order</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Notes (Optional)</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special instructions for your order..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                />
              </div>

              {/* Payment Button */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {payment === 'bkash' ? (
                  <div>
                    {!user ? (
                      <div className="p-4 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-700 rounded-lg">
                        <p className="text-center text-sm">Please log in to proceed with bKash payment.</p>
                        <button
                          type="button"
                          onClick={() => requireAuth()}
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
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !isFormValid}
                    className="w-full bg-lime-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Processing...' : `Place Order - ৳${total.toFixed(2)}`}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Order Summary - Desktop */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                {items.map((item: CartItem | GuestCartItem) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.product_name} × {item.quantity}</span>
                    <span className="font-medium">৳{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>৳{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>{total >= freeDeliveryMin ? 'Free' : '৳60.00'}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>৳{(total >= freeDeliveryMin ? total : total + 60).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 