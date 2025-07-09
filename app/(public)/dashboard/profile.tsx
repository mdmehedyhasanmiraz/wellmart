import { useEffect, useState } from 'react';
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

export default function UserProfilePage() {
  const [user, setUser] = useState<User | null>(null);
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
  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
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
      } catch (error) {
        toast.error('Error loading profile');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [supabase]);

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
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
      </div>
    </div>
  );
} 