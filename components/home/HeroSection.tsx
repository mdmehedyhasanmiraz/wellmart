'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ChevronRight, Package } from 'lucide-react';


interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  subcategories?: SubCategory[];
  image_url?: string | null;
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
  image_urls: string[];
  link_url?: string;
  is_active: boolean;
  position: 'main' | 'card1' | 'card2' | 'card3' | 'card4' | 'hero';
}

interface HeroSectionProps {
  categories: Category[];
  banners: Banner[];
}

export default function HeroSection({ categories, banners }: HeroSectionProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getCardBanners = () => banners.filter(b => b.position.startsWith('card'));

  if (isLoading) {
    return (
      <div className="min-h-[600px] bg-gray-100 animate-pulse">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    <section className="bg-gray-50 py-8 mx-auto max-w-full px-3">
      <div className="mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sticky Category Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                            {category.image_url ? (
                              <img
                                src={category.image_url}
                                alt={category.name}
                                className="w-6 h-6 object-cover rounded-full mr-3 border"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-gray-500 mr-3" />
                            )}
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
                          {category.image_url ? (
                            <img
                              src={category.image_url}
                              alt={category.name}
                              className="w-6 h-6 object-cover rounded-full mr-3 border"
                            />
                          ) : (
                            <Package className="w-4 h-4 text-gray-500 mr-3" />
                          )}
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
            {/* Hero Slider */}
            <HeroSlider banners={banners.filter(b => b.position === 'main' && b.is_active)} />
            {/* Feature Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {getCardBanners().map((banner) => (
                <Link key={banner.id} href={banner.link_url || '#'}>
                  <div className="relative h-32 rounded-xl overflow-hidden group cursor-pointer">
                    <Image
                      src={Array.isArray(banner.image_urls) && banner.image_urls.length > 0 ? banner.image_urls[0] : ''}
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

// --- HeroSlider component ---
type HeroSliderProps = { banners: Banner[] };
function HeroSlider({ banners }: HeroSliderProps) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);
  const count = banners.length;
  if (count === 0) {
    return (
      <div className="h-[200px] md:h-[320px] lg:h-[384px] bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center mb-6">
        <div className="text-white text-center">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Welcome to Wellmart</h2>
          <p className="text-lg opacity-90">Your trusted health partner</p>
        </div>
      </div>
    );
  }
  const goToBanner = (idx: number) => {
    setCurrentBanner((idx + count) % count);
    setCurrentImage(0);
  };
  const banner = banners[currentBanner];
  const images = Array.isArray(banner.image_urls) ? banner.image_urls : [];
  return (
    <div className="relative mb-6 w-full aspect-[3/1] rounded-xl overflow-hidden">
      {images.length > 0 ? (
        images.map((img, idx) => (
          <a
            key={idx}
            href={banner.link_url || '#'}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === currentImage ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            tabIndex={idx === currentImage ? 0 : -1}
          >
            <img
              src={img}
              alt={banner.title}
              className="w-full h-full object-cover"
              style={{ aspectRatio: '3/1', width: '100%', height: '100%' }}
            />
            <div className="absolute bottom-6 left-6 text-white drop-shadow-lg">
              <h2 className="text-2xl lg:text-3xl font-bold mb-2">{banner.title}</h2>
              {banner.subtitle && <p className="text-lg opacity-90">{banner.subtitle}</p>}
            </div>
          </a>
        ))
      ) : null}
      {/* Arrows for banners */}
      {count > 1 && (
        <>
          <button
            onClick={() => goToBanner(currentBanner - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 z-20"
            aria-label="Previous banner"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={() => goToBanner(currentBanner + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 z-20"
            aria-label="Next banner"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
      {/* Dots for banners */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToBanner(idx)}
              className={`w-3 h-3 rounded-full ${idx === currentBanner ? 'bg-lime-500' : 'bg-white/60'} border border-white`}
              aria-label={`Go to banner ${idx + 1}`}
            />
          ))}
        </div>
      )}
      {/* Dots for images in current banner */}
      {images.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImage(idx)}
              className={`w-2.5 h-2.5 rounded-full ${idx === currentImage ? 'bg-lime-500' : 'bg-white/60'} border border-white`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 