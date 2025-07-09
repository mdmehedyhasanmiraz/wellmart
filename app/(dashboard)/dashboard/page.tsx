'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  street: string;
}

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
}

export default function UserDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    division: '',
    district: '',
    upazila: '',
    street: '',
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }
      // Get user details from our users table
      const { data: userDetails } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      if (userDetails) {
        setUser(userDetails);
        setFormData({
          name: userDetails.name,
          phone: userDetails.phone,
          division: userDetails.division,
          district: userDetails.district,
          upazila: userDetails.upazila,
          street: userDetails.street,
        });
      }
      // Fetch user orders
      const { data: userOrders } = await supabase
        .from('user_orders')
        .select('id, created_at, total, status')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });
      setOrders(userOrders || []);
    } catch (error) {
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone,
          division: formData.division,
          district: formData.district,
          upazila: formData.upazila,
          street: formData.street,
        })
        .eq('id', user.id);
      if (error) {
        toast.error('Error updating profile');
      } else {
        setUser({ ...user, ...formData });
        setEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lime-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 py-6 sm:px-0">
          {/* Sidebar */}
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col gap-4">
            <button className="text-left px-4 py-2 rounded-lg hover:bg-lime-50 font-medium text-gray-800">My Orders</button>
            <button className="text-left px-4 py-2 rounded-lg hover:bg-lime-50 font-medium text-gray-800">My Profile</button>
            <button className="text-left px-4 py-2 rounded-lg hover:bg-lime-50 font-medium text-gray-800">Change Password</button>
            <button onClick={handleSignOut} className="text-left px-4 py-2 rounded-lg hover:bg-red-50 font-medium text-red-600">Sign Out</button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 flex flex-col gap-8">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
                <button
                  onClick={() => setEditing(!editing)}
                  className="bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
              {editing ? (
                <form onSubmit={e => { e.preventDefault(); handleUpdateProfile(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full border-gray-200 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 block w-full border-gray-200 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Division</label>
                      <input
                        type="text"
                        value={formData.division}
                        onChange={e => setFormData({ ...formData, division: e.target.value })}
                        className="mt-1 block w-full border-gray-200 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">District</label>
                      <input
                        type="text"
                        value={formData.district}
                        onChange={e => setFormData({ ...formData, district: e.target.value })}
                        className="mt-1 block w-full border-gray-200 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Upazila</label>
                      <input
                        type="text"
                        value={formData.upazila}
                        onChange={e => setFormData({ ...formData, upazila: e.target.value })}
                        className="mt-1 block w-full border-gray-200 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Street</label>
                      <input
                        type="text"
                        value={formData.street}
                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                        className="mt-1 block w-full border-gray-200 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      className="bg-lime-600 hover:bg-lime-700 text-white px-6 py-2 rounded-md text-sm font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-gray-500 text-sm">Name</span>
                    <span className="font-medium text-gray-900">{user?.name}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-sm">Phone</span>
                    <span className="font-medium text-gray-900">{user?.phone}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-sm">Division</span>
                    <span className="font-medium text-gray-900">{user?.division}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-sm">District</span>
                    <span className="font-medium text-gray-900">{user?.district}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-sm">Upazila</span>
                    <span className="font-medium text-gray-900">{user?.upazila}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-sm">Street</span>
                    <span className="font-medium text-gray-900">{user?.street}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Orders Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">My Orders</h3>
              </div>
              {orders.length === 0 ? (
                <div className="text-gray-500 py-8 text-center">No orders found.</div>
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
      </div>
    </div>
  );
} 