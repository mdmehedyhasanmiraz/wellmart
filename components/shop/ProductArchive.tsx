'use client';

import { useState, useEffect } from 'react';
import type { Product, ProductFilters, Category, Company } from '@/types/product';
import ProductCard from './ProductCard';
import ProductFiltersComponent from './ProductFilters';
import { Grid, List, Loader2, Package } from 'lucide-react';

interface ProductArchiveProps {
  initialFilters?: ProductFilters;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export default function ProductArchive({
  initialFilters = {},
  onAddToCart,
  onViewDetails
}: ProductArchiveProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 12;

  // Fetch categories and companies
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [categoriesResponse, companiesResponse] = await Promise.all([
          fetch('/api/public/data?type=categories'),
          fetch('/api/public/data?type=companies')
        ]);

        const categoriesResult = await categoriesResponse.json();
        const companiesResult = await companiesResponse.json();

        if (categoriesResult.success) setCategories(categoriesResult.categories || []);
        if (companiesResult.success) setCompanies(companiesResult.companies || []);
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };

    fetchMetadata();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append('type', 'shop-products');
        if (filters.search) params.append('search', filters.search);
        if (filters.category_id) params.append('category_id', filters.category_id);
        if (filters.company_id) params.append('company_id', filters.company_id);
        if (filters.min_price) params.append('min_price', filters.min_price.toString());
        if (filters.max_price) params.append('max_price', filters.max_price.toString());
        if (filters.in_stock) params.append('in_stock', filters.in_stock.toString());
        if (filters.sort_by) params.append('sort_by', filters.sort_by);
        if (filters.sort_order) params.append('sort_order', filters.sort_order);
        params.append('page', currentPage.toString());
        params.append('limit', ITEMS_PER_PAGE.toString());

        const response = await fetch(`/api/public/data?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
          setProducts(result.products || []);
          setTotalCount(result.totalCount || 0);
        } else {
          console.error('Error fetching products:', result.error);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [filters, currentPage]);

  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop</h1>
          <p className="text-gray-600">
            Discover our wide range of pharmaceutical products
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <ProductFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                categories={categories}
                companies={companies}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Products Section */}
          <div className="lg:col-span-3">
            {/* Products Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {isLoading ? 'Loading...' : `${totalCount} products found`}
                </span>
                {Object.keys(filters).length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {Object.keys(filters).length} filter(s) active
                  </span>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Products Grid/List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto text-gray-400" size={48} />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
                <p className="mt-2 text-gray-600">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <>
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                    : 'grid-cols-2'
                }`}>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={onAddToCart}
                      onViewDetails={onViewDetails}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center">
                    <nav className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 