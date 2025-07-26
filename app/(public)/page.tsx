'use client';

import { useEffect, useState } from 'react';
import HeroSection from "@/components/home/HeroSection";
import FlashSaleProducts from "@/components/home/FlashSaleProducts";
import FeaturedProductsArchive from '@/components/home/FeaturedProductsArchive';
import TopProductsArchive from '@/components/home/TopProductsArchive';
import RecentProductsArchive from '@/components/home/RecentProductsArchive';
import { Loader2 } from 'lucide-react';
import type { Product, Category, Banner } from '@/types/product';

interface HomeData {
  categories: Category[];
  banners: Banner[];
  flashSaleProducts: Product[];
  featuredProducts: Product[];
  topProducts: Product[];
  recentProducts: Product[];
}

export default function HomePage() {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/public/data?type=home-data');
        const result = await response.json();
        
        if (result.success) {
          setHomeData(result.data);
          console.log(`Home page loaded in ${result.timing}ms`);
        } else {
          setError(result.error || 'Failed to load home data');
          console.error('Home data fetch error:', result.error);
        }
      } catch (error) {
        setError('Failed to load home data');
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading Wellmart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!homeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection 
        categories={homeData.categories} 
        banners={homeData.banners} 
      />

      {/* Flash Sale Products */}
      <FlashSaleProducts products={homeData.flashSaleProducts} />

      {/* Featured Products */}
      <FeaturedProductsArchive products={homeData.featuredProducts} />
      
      {/* Top Products */}
      <TopProductsArchive products={homeData.topProducts} />
      
      {/* Recent Products */}
      <RecentProductsArchive products={homeData.recentProducts} />
    </div>
  );
}
