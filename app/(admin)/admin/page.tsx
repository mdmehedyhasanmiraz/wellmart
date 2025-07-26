'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  Star,
  TrendingUp,
  DollarSign,
  Bell
} from 'lucide-react';


interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalReviews: number;
  sales: number;
  growth: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
}
interface Notification {
  type: 'order' | 'user' | 'lowstock';
  message: string;
  time: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalReviews: 0,
    sales: 0,
    growth: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000); // Increased to 60s to reduce load
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/dashboard-stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.stats);
        setLowStockProducts(result.lowStockProducts || []);
        setNotifications(result.notifications || []);
      } else {
        console.error('Error fetching dashboard data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add formatCurrency and formatPercentage helpers from analytics page
  const formatCurrency = (amount: number) => {
    return `\u09F3${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Wellmart Admin
        </h1>
        <p className="text-gray-600">
          Manage your products, users, orders, and more from this comprehensive dashboard.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.sales)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">{formatPercentage(stats.growth)}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* After the stats grid, add a 2-column grid for Stock Alerts and Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Stock Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-yellow-700 mb-4 flex items-center">
            <Package className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="font-semibold text-gray-900">Stock Alerts</span>
          </h2>
          {lowStockProducts.length === 0 ? (
            <div className="text-gray-400 text-sm">No low stock products</div>
          ) : (
            <ul className="list-disc ml-5 text-yellow-700 text-sm">
              {lowStockProducts.map(p => (
                <li key={p.id}>{p.name} (Stock: {p.stock})</li>
              ))}
            </ul>
          )}
        </div>
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 text-lime-600 mr-2" />
            <span className="font-semibold text-gray-900">Notifications</span>
          </h2>
          <div className="space-y-4">
            {notifications.length === 0 && <div className="text-gray-400 text-sm">No new notifications</div>}
            {notifications.map((notif, i) => (
              <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mr-3 ${notif.type === 'order' ? 'bg-purple-400' : notif.type === 'user' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                <span className="text-sm text-gray-600">{notif.message}</span>
                <span className="ml-auto text-xs text-gray-400">{new Date(notif.time).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/products"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Package className="w-5 h-5 text-blue-600 mr-3" />
            <span className="font-medium">Manage Products</span>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 text-green-600 mr-3" />
            <span className="font-medium">Manage Users</span>
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-purple-600 mr-3" />
            <span className="font-medium">View Orders</span>
          </Link>
          <Link
            href="/admin/reviews"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Star className="w-5 h-5 text-yellow-600 mr-3" />
            <span className="font-medium">Manage Reviews</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Products (placeholder) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            {/* BarChart3 icon if imported */}
            Top Products
          </h3>
          <div className="space-y-3 text-gray-500 text-sm">Coming soon: Top selling and low stock products will be shown here.</div>
        </div>

        {/* Recent Orders (placeholder) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            {/* Calendar icon if imported */}
            Recent Orders
          </h3>
          <div className="space-y-3 text-gray-500 text-sm">Coming soon: Recent orders will be shown here.</div>
        </div>
      </div>
    </div>
  );
} 