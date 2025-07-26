'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  EyeOff
} from 'lucide-react';
import AdminImage from '@/components/admin/AdminImage';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { Banner } from '@/types/banner';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchBanners();
  }, [searchTerm, positionFilter, statusFilter, sortBy, sortOrder]);

  const fetchBanners = async () => {
    try {
      let query = supabase
        .from('banners')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      if (positionFilter !== 'all') {
        query = query.eq('position', positionFilter);
      }

      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const response = await fetch('/api/admin/mutations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          table: 'banners',
          id: bannerId
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Banner deleted successfully');
        fetchBanners();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const handleToggleStatus = async (bannerId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/mutations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          table: 'banners',
          id: bannerId,
          data: { is_active: !currentStatus }
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Banner ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchBanners();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating banner status:', error);
      toast.error('Failed to update banner status');
    }
  };

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'hero':
        return { text: 'Hero Banner', color: 'bg-blue-100 text-blue-800' };
      case 'card1':
        return { text: 'Card 1', color: 'bg-green-100 text-green-800' };
      case 'card2':
        return { text: 'Card 2', color: 'bg-purple-100 text-purple-800' };
      case 'card3':
        return { text: 'Card 3', color: 'bg-yellow-100 text-yellow-800' };
      case 'card4':
        return { text: 'Card 4', color: 'bg-red-100 text-red-800' };
      default:
        return { text: position, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-gray-600">Manage hero banners and promotional cards</p>
        </div>
        <Link
          href="/admin/banners/new"
          className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Link>
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
                placeholder="Search banners by title..."
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
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="position-asc">Position A-Z</option>
          </select>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            >
              <option value="all">All Positions</option>
              <option value="hero">Hero Banner</option>
              <option value="card1">Card 1</option>
              <option value="card2">Card 2</option>
              <option value="card3">Card 3</option>
              <option value="card4">Card 4</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner: Banner) => {
          const positionLabel = getPositionLabel(banner.position);
          const imageUrls: string[] = Array.isArray(banner.image_urls) ? banner.image_urls : (banner.image_urls ? [banner.image_urls as unknown as string] : []);
          return (
            <div key={banner.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Banner Images */}
              <div className="relative h-48 bg-gray-200 flex overflow-x-auto gap-2 p-2">
                {imageUrls.length > 0 ? (
                  imageUrls.map((img: string, idx: number) => (
                    <AdminImage
                      key={idx}
                      src={img}
                      alt={banner.title}
                      className="h-full object-cover rounded-lg"
                      style={{ minWidth: '180px', maxWidth: '240px' }}
                      fallbackIcon={<ImageIcon className="w-8 h-8 text-gray-400" />}
                    />
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                {!banner.is_active && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <EyeOff className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${positionLabel.color}`}>
                    {positionLabel.text}
                  </span>
                </div>
              </div>

              {/* Banner Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {banner.title}
                  </h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {banner.subtitle}
                </p>

                {banner.link_url && (
                  <div className="text-sm text-gray-500 mb-3">
                    <span className="font-medium">Link:</span> {banner.link_url}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Created: {formatDate(banner.created_at)}</span>
                  <span>Updated: {formatDate(banner.updated_at)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleStatus(banner.id, banner.is_active)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        banner.is_active
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {banner.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/banners/${banner.id}/edit`}
                      className="p-1 text-blue-600 hover:text-blue-900"
                      title="Edit Banner"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-1 text-red-600 hover:text-red-900"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {banners.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No banners found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || positionFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first banner'
            }
          </p>
          <Link
            href="/admin/banners/new"
            className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 transition-colors"
          >
            Add Banner
          </Link>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Total Banners:</span> {banners.length}
          </div>
          <div>
            <span className="font-medium">Active:</span> {banners.filter(b => b.is_active).length}
          </div>
          <div>
            <span className="font-medium">Hero:</span> {banners.filter(b => b.position === 'hero').length}
          </div>
          <div>
            <span className="font-medium">Cards:</span> {banners.filter(b => b.position.startsWith('card')).length}
          </div>
        </div>
      </div>
    </div>
  );
} 