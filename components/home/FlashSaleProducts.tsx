'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Clock, Zap } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { Product } from '@/types/product';

export default function FlashSaleProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    fetchFlashSaleProducts();
  }, []);

  const fetchFlashSaleProducts = async () => {
    try {
      const response = await fetch('/api/public/data?type=flash-sale-products');
      const result = await response.json();
      if (result.success) {
        setProducts(result.products || []);
      } else {
        console.error('Error fetching flash sale products:', result.error);
      }
    } catch (error) {
      console.error('Error fetching flash sale products:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, products.length - getVisibleCount());
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, products.length - getVisibleCount());
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  const getVisibleCount = () => {
    if (typeof window === 'undefined') return 5;
    return window.innerWidth >= 1024 ? 5 : 2;
  };

  const getProductPrice = (product: Product) => {
    return product.price_offer && product.price_offer !== 0 
      ? product.price_offer 
      : product.price_regular;
  };

  const getDiscountPercentage = (product: Product) => {
    if (!product.price_offer || product.price_offer === 0) return 0;
    return Math.round(((product.price_regular - product.price_offer) / product.price_regular) * 100);
  };

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null; // Don't show section if no flash sale products
  }

  return (
    <section className="py-12 bg-gradient-to-r from-red-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 text-white p-2 rounded-lg">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Flash Sale</h2>
              <p className="text-gray-600">Limited time offers - Don&apos;t miss out!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer placeholder - you can add real countdown later */}
            <div className="hidden md:flex items-center gap-2 text-red-600">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Ends Soon</span>
            </div>
            
            {/* View All Link */}
            <Link 
              href="/flash-sale"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
            >
              View All
            </Link>
          </div>
        </div>

        {/* Products Slider */}
        <div className="relative">
          {/* Navigation Buttons */}
          {products.length > getVisibleCount() && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg border border-gray-200 transition-all duration-200 hover:scale-110"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg border border-gray-200 transition-all duration-200 hover:scale-110"
                aria-label="Next products"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Products Container */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / getVisibleCount())}%)`,
                width: `${(products.length / getVisibleCount()) * 100}%`
              }}
            >
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="flex-shrink-0 px-2"
                  style={{ width: `${100 / products.length}%` }}
                >
                  <Link href={`/product/${product.slug}`}>
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                      {/* Product Image */}
                      <div className="relative aspect-square overflow-hidden">
                        <Image
                          src={product.image_urls?.[0] || '/images/avatar.png'}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Flash Sale Badge */}
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {getDiscountPercentage(product)}% OFF
                        </div>
                        
                        {/* Stock Badge */}
                        {product.stock === 0 && (
                          <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full">
                            Out of Stock
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        {/* Product Name */}
                        <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                          {product.name}
                        </h3>

                        {/* Price */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-bold text-red-600">
                            ৳{getProductPrice(product).toFixed(2)}
                          </span>
                          {product.price_offer && product.price_offer !== 0 && (
                            <span className="text-sm text-gray-500 line-through">
                              ৳{product.price_regular.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Company */}
                        {product.company?.name && (
                          <p className="text-xs text-gray-500 mb-2">
                            {product.company.name}
                          </p>
                        )}

                        {/* Stock Status */}
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            product.stock > 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {products.length > getVisibleCount() && (
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: Math.ceil(products.length / getVisibleCount()) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index * getVisibleCount())}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    Math.floor(currentIndex / getVisibleCount()) === index
                      ? 'bg-red-500'
                      : 'bg-gray-300'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
} 