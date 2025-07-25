'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Package,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import AdminImage from '@/components/admin/AdminImage';
import { toast } from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';

interface Product {
  id: string;
  name: string;
  slug: string;
  price_regular: number;
  price_offer: number | null;
  stock: number;
  image_urls: string[];
  description: string;
  category_id: string | null;
  company_id: string | null;
  is_active: boolean;
  flash_sale: boolean | null;
  created_at: string;
  category_name?: string;
  company_name?: string;
}

interface Category {
  id: string;
  name: string;
}
interface Company {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCompanies();
  }, [searchTerm, selectedCategory, selectedCompany, statusFilter, sortBy, sortOrder]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      console.log('[fetchProducts] Fetching products with filters...');

      // Build the query
      let query = supabase
        .from('products')
        .select(`
          *,
          categories!inner(id, name),
          companies!inner(id, name)
        `);

      // Apply filters
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      if (selectedCompany) {
        query = query.eq('company_id', selectedCompany);
      }
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('[fetchProducts] Supabase error:', error);
        toast.error('Failed to load products');
        return;
      }

      // Transform data to include category and company names
      const transformedProducts = data?.map(product => ({
        ...product,
        category_name: product.categories?.name,
        company_name: product.companies?.name
      })) || [];

      console.log('[fetchProducts] Products loaded:', transformedProducts.length);
      setProducts(transformedProducts);
      
    } catch (error) {
      console.error('[fetchProducts] Error:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('[fetchCategories] Fetching categories...');
      
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('[fetchCategories] Supabase error:', error);
        toast.error('Failed to load categories');
        return;
      }

      console.log('[fetchCategories] Categories loaded:', data?.length || 0);
      setCategories(data || []);
      
    } catch (error) {
      console.error('[fetchCategories] Error:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchCompanies = async () => {
    try {
      console.log('[fetchCompanies] Fetching companies...');
      
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('[fetchCompanies] Supabase error:', error);
        toast.error('Failed to load companies');
        return;
      }

      console.log('[fetchCompanies] Companies loaded:', data?.length || 0);
      setCompanies(data || []);
      
    } catch (error) {
      console.error('[fetchCompanies] Error:', error);
      toast.error('Failed to load companies');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Supabase error deleting product:', error);
        toast.error('Failed to delete product');
        return;
      }

      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) {
        console.error('Supabase error updating product status:', error);
        toast.error('Failed to update product status');
        return;
      }

      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status');
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (quantity < 10) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-100' };
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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
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
                placeholder="Search products..."
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
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price_regular-asc">Price Low-High</option>
            <option value="price_regular-desc">Price High-Low</option>
            <option value="stock-asc">Stock Low-High</option>
            <option value="stock-desc">Stock High-Low</option>
          </select>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
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

      {/* Products List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flash Sale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4 flex items-center justify-center overflow-hidden">
                          {product.image_urls && product.image_urls.length > 0 ? (
                            <AdminImage 
                              src={product.image_urls[0]} 
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                              fallbackIcon={<Package className="w-6 h-6 text-gray-400" />}
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.company_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category_name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ৳{product.price_regular.toFixed(2)}
                      </div>
                      {product.price_offer && (
                        <div className="text-sm text-red-600">
                          Offer: ৳{product.price_offer.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.stock}
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        product.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        product.flash_sale === true
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.flash_sale === true ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-lime-600 hover:text-lime-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(product.id, product.is_active)}
                          className={`${
                            product.is_active 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {product.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory || selectedCompany || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first product'
              }
            </p>
            <Link
              href="/admin/products/new"
              className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 transition-colors"
            >
              Add Product
            </Link>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Total Products: {products.length}</span>
          <span>
            Active: {products.filter(p => p.is_active).length} | 
            Inactive: {products.filter(p => !p.is_active).length}
          </span>
        </div>
      </div>
    </div>
  );
} 