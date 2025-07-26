'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Zap, ShoppingCart, Star, Truck, Tag } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import type { Product } from '@/types/product';

export default function FlashSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const { addToCart } = useCart();
  const supabase = createClient();

  // Set end time to 24 hours from now (you can customize this)
  const [endTime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    return now;
  });

  useEffect(() => {
    fetchFlashSaleProducts();
    startCountdown();
  }, []);

  const fetchFlashSaleProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name, slug),
          company:companies!products_company_id_fkey(name)
        `)
        .eq('flash_sale', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching flash sale products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching flash sale products:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
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

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Flash Sale...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">FLASH SALE</h1>
              <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300" />
            </div>
            <p className="text-xl sm:text-2xl mb-8 text-yellow-100">
              Limited Time Offers - Don't Miss Out!
            </p>
            
            {/* Countdown Timer */}
            <div className="flex justify-center gap-4 sm:gap-6 mb-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center min-w-[80px] sm:min-w-[100px]">
                <div className="text-2xl sm:text-3xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</div>
                <div className="text-sm sm:text-base text-yellow-100">Hours</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center min-w-[80px] sm:min-w-[100px]">
                <div className="text-2xl sm:text-3xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                <div className="text-sm sm:text-base text-yellow-100">Minutes</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center min-w-[80px] sm:min-w-[100px]">
                <div className="text-2xl sm:text-3xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                <div className="text-sm sm:text-base text-yellow-100">Seconds</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <span>Free Delivery on Orders Above ৳799</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                <span>Up to 70% Off</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Flash Sale Products</h2>
            <p className="text-gray-600 mb-6">Check back later for amazing deals!</p>
            <Link 
              href="/shop" 
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-8 text-center">
              <p className="text-lg text-gray-700">
                <span className="font-bold text-red-600">{products.length}</span> products on flash sale
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={product.image_urls?.[0] || '/images/avatar.png'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Flash Sale Badge */}
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {getDiscountPercentage(product)}% OFF
                    </div>
                    
                    {/* Stock Badge */}
                    {product.stock === 0 && (
                      <div className="absolute top-3 right-3 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Out of Stock
                      </div>
                    )}

                    {/* Quick Add Button */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={product.stock === 0}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Product Name */}
                    <Link href={`/product/${product.slug}`}>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 line-clamp-2 group-hover:text-red-600 transition-colors cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Company */}
                    {product.company?.name && (
                      <p className="text-xs text-gray-500 mb-2">
                        {product.company.name}
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg sm:text-xl font-bold text-red-600">
                        ৳{getProductPrice(product).toFixed(2)}
                      </span>
                      {product.price_offer && product.price_offer !== 0 && (
                        <span className="text-sm text-gray-500 line-through">
                          ৳{product.price_regular.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.stock > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {product.stock} available
                      </span>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.stock === 0}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-12">
              <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Don't Miss These Amazing Deals!</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  These flash sale products are available for a limited time only. 
                  Add them to your cart now before they're gone!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/cart" 
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    View Cart
                  </Link>
                  <Link 
                    href="/shop" 
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 