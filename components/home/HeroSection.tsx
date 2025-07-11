'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ChevronRight, Package } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  subcategories?: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
}

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  position: 'main' | 'card1' | 'card2' | 'card3' | 'card4';
}

export default function HeroSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchCategories();
    fetchBanners();
  }, []);

  const fetchCategories = async () => {
    try {
      // First, get all categories
      const { data: allCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, slug, description, parent_id')
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      // Get all subcategories (categories with parent_id)
      const { data: subcategories, error: subError } = await supabase
        .from('categories')
        .select('id, name, slug, description, category_id:parent_id')
        .not('parent_id', 'is', null)
        .order('name');

      if (subError) {
        console.error('Error fetching subcategories:', subError);
        return;
      }

      // Group subcategories by parent
      const subcategoriesByParent = subcategories?.reduce((acc, sub) => {
        if (sub.category_id) {
          if (!acc[sub.category_id]) {
            acc[sub.category_id] = [];
          }
          acc[sub.category_id].push({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            category_id: sub.category_id
          });
        }
        return acc;
      }, {} as Record<string, SubCategory[]>) || {};

      // Build the final categories array
      const processedCategories = allCategories?.map(category => ({
        ...category,
        subcategories: subcategoriesByParent[category.id] || []
      })).filter(category => 
        // Show categories that either have subcategories OR are not subcategories themselves
        category.subcategories.length > 0 || !category.parent_id
      ) || [];

      setCategories(processedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBanners = async () => {
    try {
      const { data: bannersData, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('position');

      if (error) {
        console.error('Error fetching banners:', error);
        return;
      }

      setBanners(bannersData || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getMainBanner = () => banners.find(b => b.position === 'main');
  const getCardBanners = () => banners.filter(b => b.position.startsWith('card'));

  if (isLoading) {
    return (
      <div className="min-h-[600px] bg-gray-100 animate-pulse">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="lg:col-span-3">
              <div className="h-96 bg-gray-200 rounded-lg mb-4"></div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gray-50 py-8 mx-auto max-w-7xl px-3">
      <div className="mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sticky Category Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                {categories.map((category) => (
                  <div key={category.id} className="border-b border-gray-100 last:border-b-0">
                    {category.subcategories && category.subcategories.length > 0 ? (
                      // Collapsible category with subcategories
                      <>
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="flex items-center">
                            <Package className="w-4 h-4 text-gray-500 mr-3" />
                            <span className="text-gray-700 font-medium">{category.name}</span>
                          </div>
                          <ChevronDown 
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                              expandedCategories.includes(category.id) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        
                        {/* Subcategories */}
                        {expandedCategories.includes(category.id) && (
                          <div className="bg-gray-50 border-t border-gray-100">
                            {category.subcategories.map((subcategory) => (
                              <Link
                                key={subcategory.id}
                                href={`/shop?category=${subcategory.slug}`}
                                className="block px-6 py-3 text-sm text-gray-600 hover:text-lime-600 hover:bg-lime-50 transition-colors duration-200"
                              >
                                <div className="flex items-center">
                                  <ChevronRight className="w-3 h-3 text-gray-400 mr-2" />
                                  {subcategory.name}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      // Direct link category without subcategories
                      <Link
                        href={`/shop?category=${category.slug}`}
                        className="w-full flex items-center px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-gray-500 mr-3" />
                          <span className="text-gray-700 font-medium">{category.name}</span>
                        </div>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Banner and Cards Section */}
          <div className="lg:col-span-3">
            {/* Main Banner */}
            <div className="mb-6">
              {getMainBanner() ? (
                <Link href={getMainBanner()?.link_url || '#'}>
                  <div className="relative h-80 lg:h-96 rounded-xl overflow-hidden shadow-lg group">
                    <Image
                      src={getMainBanner()?.image_url || ''}
                      alt={getMainBanner()?.title || 'Banner'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent">
                      <div className="absolute bottom-6 left-6 text-white">
                        <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                          {getMainBanner()?.title}
                        </h2>
                        {getMainBanner()?.subtitle && (
                          <p className="text-lg opacity-90">
                            {getMainBanner()?.subtitle}
                          </p>
                        )}
                      </div>
                    </div> */}
                  </div>
                </Link>
              ) : (
                <div className="h-80 lg:h-96 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center">
                  <div className="text-white text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h2 className="text-2xl font-bold mb-2">Welcome to Wellmart</h2>
                    <p className="text-lg opacity-90">Your trusted health partner</p>
                  </div>
                </div>
              )}
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {getCardBanners().map((banner) => (
                <Link key={banner.id} href={banner.link_url || '#'}>
                  <div className="relative h-32 rounded-xl overflow-hidden shadow-md group cursor-pointer">
                    <Image
                      src={banner.image_url}
                      alt={banner.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300">
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white text-sm font-semibold truncate">
                          {banner.title}
                        </h3>
                        {banner.subtitle && (
                          <p className="text-white/80 text-xs truncate">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              
              {/* Fallback cards if no banners */}
              {getCardBanners().length < 4 && 
                Array.from({ length: 4 - getCardBanners().length }).map((_, index) => (
                  <div key={`fallback-${index}`} className="h-32 bg-gradient-to-br from-lime-400 to-lime-600 rounded-xl flex items-center justify-center">
                    <div className="text-white text-center">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-medium">Coming Soon</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 