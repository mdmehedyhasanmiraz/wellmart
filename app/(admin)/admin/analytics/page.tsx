'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package,
  Star,
  Calendar,
  BarChart3
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  userGrowth: number;
  topProducts: any[];
  recentOrders: any[];
  monthlyRevenue: any[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    userGrowth: 0,
    topProducts: [],
    recentOrders: [],
    monthlyRevenue: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days
  const supabase = createClient();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Fetch basic stats
      const [
        ordersResult,
        usersResult,
        productsResult,
        revenueResult
      ] = await Promise.all([
        supabase.from('orders').select('id, total_amount, created_at'),
        supabase.from('users').select('id, created_at'),
        supabase.from('products').select('id').eq('is_active', true),
        supabase.from('orders').select('total_amount').eq('status', 'delivered')
      ]);

      const orders = ordersResult.data || [];
      const users = usersResult.data || [];
      const products = productsResult.data || [];
      const revenue = revenueResult.data || [];

      // Calculate metrics
      const totalRevenue = revenue.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalOrders = orders.length;
      const totalUsers = users.length;
      const totalProducts = products.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate growth (simplified - comparing current period vs previous period)
      const currentDate = new Date();
      const daysAgo = parseInt(timeRange);
      const previousPeriodStart = new Date(currentDate.getTime() - (daysAgo * 2 * 24 * 60 * 60 * 1000));
      const currentPeriodStart = new Date(currentDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

      const currentPeriodOrders = orders.filter(order => 
        new Date(order.created_at) >= currentPeriodStart
      );
      const previousPeriodOrders = orders.filter(order => 
        new Date(order.created_at) >= previousPeriodStart && 
        new Date(order.created_at) < currentPeriodStart
      );

      const currentPeriodRevenue = currentPeriodOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const previousPeriodRevenue = previousPeriodOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const revenueGrowth = previousPeriodRevenue > 0 ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : 0;

      const orderGrowth = previousPeriodOrders.length > 0 ? 
        ((currentPeriodOrders.length - previousPeriodOrders.length) / previousPeriodOrders.length) * 100 : 0;

      const currentPeriodUsers = users.filter(user => 
        new Date(user.created_at) >= currentPeriodStart
      );
      const previousPeriodUsers = users.filter(user => 
        new Date(user.created_at) >= previousPeriodStart && 
        new Date(user.created_at) < currentPeriodStart
      );

      const userGrowth = previousPeriodUsers.length > 0 ? 
        ((currentPeriodUsers.length - previousPeriodUsers.length) / previousPeriodUsers.length) * 100 : 0;

      // Fetch top products
      const { data: topProducts } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price_regular,
          stock_quantity,
          image_url
        `)
        .eq('is_active', true)
        .order('stock_quantity', { ascending: false })
        .limit(5);

      // Fetch recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          user:users(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setAnalytics({
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts,
        averageOrderValue,
        revenueGrowth,
        orderGrowth,
        userGrowth,
        topProducts: topProducts || [],
        recentOrders: recentOrders || [],
        monthlyRevenue: [] // Simplified for now
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your business performance</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {analytics.revenueGrowth >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${analytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(analytics.revenueGrowth)}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalOrders}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {analytics.orderGrowth >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${analytics.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(analytics.orderGrowth)}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {analytics.userGrowth >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${analytics.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(analytics.userGrowth)}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalProducts}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Avg Order: {formatCurrency(analytics.averageOrderValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Top Products
          </h3>
          <div className="space-y-3">
            {analytics.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-lime-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-lime-600">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {product.stock_quantity} | Price: {formatCurrency(product.price_regular)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Recent Orders
          </h3>
          <div className="space-y-3">
            {analytics.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Order #{order.id.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.user?.name} • {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-lime-600">{analytics.totalOrders}</p>
            <p className="text-gray-600">Total Orders</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{analytics.totalUsers}</p>
            <p className="text-gray-600">Registered Users</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{analytics.totalProducts}</p>
            <p className="text-gray-600">Active Products</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.averageOrderValue)}</p>
            <p className="text-gray-600">Avg Order Value</p>
          </div>
        </div>
      </div>
    </div>
  );
} 