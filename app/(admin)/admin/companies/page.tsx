'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

interface Manufacturer {
  id: string;
  name: string;
  country: string | null;
  website: string | null;
  created_at: string;
}

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchManufacturers();
  }, [searchTerm]);

  const fetchManufacturers = async () => {
    try {
      let query = supabase
        .from('manufacturers')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setManufacturers(data || []);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      toast.error('Failed to load manufacturers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteManufacturer = async (manufacturerId: string) => {
    if (!confirm('Are you sure you want to delete this manufacturer? Products from this manufacturer will be unassigned.')) return;

    try {
      const { error } = await supabase
        .from('manufacturers')
        .delete()
        .eq('id', manufacturerId);

      if (error) throw error;

      toast.success('Manufacturer deleted successfully');
      fetchManufacturers();
    } catch (error) {
      console.error('Error deleting manufacturer:', error);
      toast.error('Failed to delete manufacturer');
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Manufacturers</h1>
          <p className="text-gray-600">Manage product manufacturers</p>
        </div>
        <Link
          href="/admin/manufacturers/new"
          className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Manufacturer
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search manufacturers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Manufacturers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {manufacturers.map((manufacturer) => (
          <div key={manufacturer.id} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Manufacturer Logo */}
            <div className="h-32 bg-gray-200 flex items-center justify-center">
              {/* Removed logo_url as per new interface */}
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>

            {/* Manufacturer Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {manufacturer.name}
                </h3>
                {/* Removed is_active status as per new interface */}
              </div>
              
              {/* Removed description as per new interface */}

              {manufacturer.website && (
                <div className="mb-3">
                  <a
                    href={manufacturer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {manufacturer.website}
                  </a>
                </div>
              )}

              {/* Removed product_count as per new interface */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>Created: {new Date(manufacturer.created_at).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                {/* Removed toggle status button as per new interface */}

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/admin/manufacturers/${manufacturer.id}`}
                    className="p-1 text-blue-600 hover:text-blue-900"
                    title="Edit Manufacturer"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteManufacturer(manufacturer.id)}
                    className="p-1 text-red-600 hover:text-red-900"
                    title="Delete Manufacturer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {manufacturers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No manufacturers found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? 'Try adjusting your search'
              : 'Get started by adding your first manufacturer'
            }
          </p>
          <Link
            href="/admin/manufacturers/new"
            className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 transition-colors"
          >
            Add Manufacturer
          </Link>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Total Manufacturers:</span> {manufacturers.length}
          </div>
          {/* Removed Active count as per new interface */}
          {/* Removed Total Products count as per new interface */}
        </div>
      </div>
    </div>
  );
} 