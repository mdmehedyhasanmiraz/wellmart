'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Globe, Building2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    website: '',
    address: '',
  });

  useEffect(() => {
    if (id) fetchCompany();
    // eslint-disable-next-line
  }, [id]);

  const fetchCompany = async () => {
    setIsFetching(true);
    const { data, error } = await supabase
      .from('companies')
      .select('name, country, website, address')
      .eq('id', id)
      .single();
    if (error || !data) {
      toast.error('Company not found');
      router.push('/admin/companies');
      return;
    }
    setFormData({
      name: data.name || '',
      country: data.country || '',
      website: data.website || '',
      address: data.address || '',
    });
    setIsFetching(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!formData.name.trim()) {
        toast.error('Company name is required');
        setIsLoading(false);
        return;
      }
      const { error } = await supabase.from('companies').update({
        name: formData.name.trim(),
        country: formData.country.trim() || null,
        website: formData.website.trim() || null,
        address: formData.address.trim() || null,
      }).eq('id', id);
      if (error) throw error;
      toast.success('Company updated successfully');
      router.push('/admin/companies');
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Failed to update company');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/companies"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Companies
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Company</h1>
            <p className="text-gray-600">Update company details</p>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Company Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufactured/Importer/Distributor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="Manufactured/Importer/Distributor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="Country of origin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md text-gray-500">
                    <Globe className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-r-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="Company address"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-6 py-2 bg-lime-600 text-white font-semibold rounded-lg shadow hover:bg-lime-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 