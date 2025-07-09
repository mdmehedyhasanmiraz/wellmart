'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
}

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: userOrders } = await supabase
          .from('user_orders')
          .select('id, created_at, total, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setOrders(userOrders || []);
      } catch (error) {
        toast.error('Error loading orders');
        console.error('Orders fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{order.id.slice(0, 8)}...</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm text-lime-700 font-semibold">৳{order.total.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 