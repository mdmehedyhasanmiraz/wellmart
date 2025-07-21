'use client';

import { useState } from 'react';
import { Search, Package, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getItemTotal, formatCurrency } from '@/utils/priceUtils';

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  billing_name: string;
  billing_phone: string;
  cart_items: any[];
  notes?: string;
}

const orderStatuses = [
  { status: 'pending', label: 'Order Placed', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { status: 'processing', label: 'Processing', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { status: 'shipped', label: 'Shipped', icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { status: 'completed', label: 'Delivered', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
];

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(`/api/orders/${orderId.trim()}`);
      const result = await response.json();

      if (result.success) {
        setOrder(result.order);
        toast.success('Order found!');
      } else {
        setOrder(null);
        toast.error('Order not found. Please check the order ID.');
      }
    } catch (error) {
      console.error('Error searching order:', error);
      toast.error('Error searching for order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    return orderStatuses.findIndex(s => s.status === status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Track Your Order</h1>
        <p className="text-gray-600">
          Enter your order ID to track the status of your order.
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
              Order ID
            </label>
            <input
              type="text"
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter your order ID (e.g., 12345678)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Track Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Order Details */}
      {searched && !loading && order && (
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-medium text-gray-900">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-medium text-gray-900">৳{order.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium text-gray-900 capitalize">{order.payment_method}</p>
              </div>
            </div>
          </div>

          {/* Order Status Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h2>
            <div className="relative">
              {orderStatuses.map((status, index) => {
                const currentStatusIndex = getStatusIndex(order.status);
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return (
                  <div key={status.status} className="flex items-center mb-6 last:mb-0">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      isCompleted ? status.bgColor : 'bg-gray-100'
                    }`}>
                      <status.icon className={`w-5 h-5 ${
                        isCompleted ? status.color : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className={`font-medium ${
                        isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {status.label}
                      </p>
                      {isCurrent && (
                        <p className="text-sm text-gray-500">
                          {order.status === 'pending' && 'Your order has been placed and is being reviewed'}
                          {order.status === 'processing' && 'Your order is being prepared for shipment'}
                          {order.status === 'shipped' && 'Your order is on its way'}
                          {order.status === 'completed' && 'Your order has been delivered'}
                        </p>
                      )}
                    </div>
                    {index < orderStatuses.length - 1 && (
                      <div className={`w-0.5 h-8 ml-5 ${
                        isCompleted ? 'bg-lime-200' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h2>
            <div className="flex items-center gap-3">
              {order.payment_status === 'paid' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                order.payment_status === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.payment_status === 'paid' ? 'Payment Completed' : 'Payment Pending'}
              </span>
            </div>
            {order.payment_status === 'pending' && (
              <p className="text-sm text-gray-600 mt-2">
                Please complete your payment to proceed with the order.
              </p>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.cart_items.map((item: any, index: number) => (
                <div key={index} className="flex items-center border-b last:border-b-0 pb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.image_url ? (
                      <img 
                        src={item.product.image_url} 
                        alt={item.product.name} 
                        className="object-cover w-full h-full" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 ml-4">
                    <h3 className="font-medium text-gray-900">{item.product?.name || 'Product'}</h3>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lime-600">{formatCurrency(getItemTotal(item))}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{order.billing_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{order.billing_phone}</p>
              </div>
            </div>
            {order.notes && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-gray-900">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Order Found */}
      {searched && !loading && !order && (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
          <p className="text-gray-600 mb-4">
            We couldn't find an order with the ID you provided. Please check the order ID and try again.
          </p>
          <div className="text-sm text-gray-500">
            <p>• Make sure you entered the correct order ID</p>
            <p>• Order IDs are case-sensitive</p>
            <p>• If you recently placed an order, please wait a few minutes</p>
          </div>
        </div>
      )}
    </div>
  );
} 