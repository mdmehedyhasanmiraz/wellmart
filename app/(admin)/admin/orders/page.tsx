'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Package,
  Truck,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { getItemPrice, getItemTotal, formatCurrency as formatCurrencyUtil } from '@/utils/priceUtils';

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'paid';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'bkash' | 'nagad' | 'bank';
  payment_channel?: 'bkash' | 'nagad' | 'bank';
  payment_transaction_id?: string;
  payment_amount?: number;
  payment_date?: string;
  payment_currency?: string;
  payment_reference?: string;
  payment_notes?: string;
  billing_name: string;
  billing_phone: string;
  billing_email?: string;
  billing_address: string;
  billing_city: string;
  billing_district: string;
  billing_country: string;
  billing_postal?: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_email?: string;
  shipping_address: string;
  shipping_city: string;
  shipping_district: string;
  shipping_country: string;
  shipping_postal?: string;
  cart_items: any[];
  notes?: string;
  created_at: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
}

interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image_url?: string;
    sku?: string;
  };
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image_url: string | null;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, statusFilter, paymentFilter, sortBy, sortOrder]);

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('user_orders')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (searchTerm) {
        query = query.or(`id.ilike.%${searchTerm}%,billing_name.ilike.%${searchTerm}%,billing_email.ilike.%${searchTerm}%,billing_phone.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (paymentFilter !== 'all') {
        // Handle case where payment_status column might not exist yet
        if (paymentFilter === 'pending') {
          query = query.or('payment_status.is.null,payment_status.eq.pending');
        } else {
          query = query.eq('payment_status', paymentFilter);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Transform the data to match our interface
      const transformedOrders = (data || []).map((order: any) => ({
        ...order,
        user: {
          name: order.billing_name,
          email: order.billing_email || '',
          phone: order.billing_phone
        }
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('user_orders')
        .update({ 
          status: newStatus
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
      case 'processing':
        return { text: 'Processing', color: 'bg-blue-100 text-blue-800' };
      case 'shipped':
        return { text: 'Shipped', color: 'bg-purple-100 text-purple-800' };
      case 'delivered':
        return { text: 'Delivered', color: 'bg-green-100 text-green-800' };
      case 'cancelled':
        return { text: 'Cancelled', color: 'bg-red-100 text-red-800' };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getPaymentBadge = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
      case 'paid':
        return { text: 'Paid', color: 'bg-green-100 text-green-800' };
      case 'failed':
        return { text: 'Failed', color: 'bg-red-100 text-red-800' };
      default:
        return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    return formatCurrencyUtil(amount);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bkash':
        return '💙';
      case 'nagad':
        return '🟢';
      case 'bank':
        return '🏦';
      default:
        return '💳';
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders and track fulfillment</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders by ID, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </button>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
                          <option value="total-desc">Amount High-Low</option>
              <option value="total-asc">Amount Low-High</option>
          </select>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            >
              <option value="all">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const statusBadge = getStatusBadge(order.status);
                const paymentBadge = getPaymentBadge(order.payment_status || 'pending');
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-lime-100 rounded-lg mr-4 flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-lime-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.id.slice(0, 8)}...
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.cart_items?.length || 0} items
                          </div>
                          <div className="text-xs text-gray-400">
                            {getPaymentMethodIcon(order.payment_method)} {order.payment_method.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.billing_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.billing_phone}
                      </div>
                      <div className="text-xs text-gray-400">
                        {order.billing_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </div>
                      {order.payment_amount && order.payment_amount !== order.total && (
                        <div className="text-xs text-gray-500">
                          Paid: {formatCurrency(order.payment_amount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-lime-500 ${statusBadge.color}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${paymentBadge.color}`}>
                        {paymentBadge.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-lime-600 hover:text-lime-900 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No orders have been placed yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Total Orders:</span> {orders.length}
          </div>
          <div>
            <span className="font-medium">Total Revenue:</span> {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}
          </div>
          <div>
            <span className="font-medium">Pending:</span> {orders.filter(o => o.status === 'pending').length}
          </div>
          <div>
            <span className="font-medium">Paid:</span> {orders.filter(o => o.payment_status === 'paid').length}
          </div>
          <div>
            <span className="font-medium">Delivered:</span> {orders.filter(o => o.status === 'delivered').length}
          </div>
          <div>
            <span className="font-medium">Failed Payments:</span> {orders.filter(o => o.payment_status === 'failed').length}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Details #{selectedOrder.id.slice(0, 8)}...
                </h2>
                <p className="text-sm text-gray-500">
                  {formatDate(selectedOrder.created_at)}
                </p>
              </div>
              <button
                onClick={closeOrderDetails}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Status and Payment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Order Status
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => {
                          handleStatusChange(selectedOrder.id, e.target.value);
                          setSelectedOrder({ ...selectedOrder, status: e.target.value as any });
                        }}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-lime-500 ${getStatusBadge(selectedOrder.status).color}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Payment Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentBadge(selectedOrder.payment_status || 'pending').color}`}>
                        {getPaymentBadge(selectedOrder.payment_status || 'pending').text}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Payment Method:</span>
                      <span className="text-sm font-medium">
                        {getPaymentMethodIcon(selectedOrder.payment_method)} {selectedOrder.payment_method.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payment Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Amount:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                    {selectedOrder.payment_amount && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Paid Amount:</span>
                        <span className="text-sm font-medium">{formatCurrency(selectedOrder.payment_amount)}</span>
                      </div>
                    )}
                    {selectedOrder.payment_transaction_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Transaction ID:</span>
                        <span className="text-sm font-mono text-gray-500">{selectedOrder.payment_transaction_id}</span>
                      </div>
                    )}
                    {selectedOrder.payment_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Payment Date:</span>
                        <span className="text-sm text-gray-500">{formatDate(selectedOrder.payment_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Billing Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium">{selectedOrder.billing_name}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{selectedOrder.billing_phone}</span>
                    </div>
                    {selectedOrder.billing_email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{selectedOrder.billing_email}</span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                      <div className="text-sm text-gray-600">
                        <div>{selectedOrder.billing_address}</div>
                        <div>{selectedOrder.billing_city}, {selectedOrder.billing_district}</div>
                        <div>{selectedOrder.billing_country}</div>
                        {selectedOrder.billing_postal && <div>Postal: {selectedOrder.billing_postal}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Truck className="w-4 h-4 mr-2" />
                    Shipping Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium">{selectedOrder.shipping_name}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{selectedOrder.shipping_phone}</span>
                    </div>
                    {selectedOrder.shipping_email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{selectedOrder.shipping_email}</span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                      <div className="text-sm text-gray-600">
                        <div>{selectedOrder.shipping_address}</div>
                        <div>{selectedOrder.shipping_city}, {selectedOrder.shipping_district}</div>
                        <div>{selectedOrder.shipping_country}</div>
                        {selectedOrder.shipping_postal && <div>Postal: {selectedOrder.shipping_postal}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Order Items ({selectedOrder.cart_items?.length || 0})
                </h3>
                {selectedOrder.cart_items && selectedOrder.cart_items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.cart_items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {item.product?.image_url && (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{item.product?.name || 'Product'}</div>
                            <div className="text-sm text-gray-500">
                              SKU: {item.product?.sku || 'N/A'} | Qty: {item.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{formatCurrency(getItemPrice(item))}</div>
                          <div className="text-sm text-gray-500">Total: {formatCurrency(getItemTotal(item))}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No items found in this order
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Order Notes</h3>
                  <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Payment Notes */}
              {selectedOrder.payment_notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Payment Notes</h3>
                  <p className="text-sm text-gray-600">{selectedOrder.payment_notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={closeOrderDetails}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 