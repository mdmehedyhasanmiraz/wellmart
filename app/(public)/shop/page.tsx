'use client';

import { useRouter } from 'next/navigation';
import ProductArchive from '@/components/shop/ProductArchive';
import type { Product } from '@/types/product';
import { toast } from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';

export default function ShopPage() {
  const router = useRouter();
  const { addToCart } = useCart();

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product.id, 1);
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error('Failed to add to cart:', error);
    }
  };

  const handleAddToWishlist = (product: Product) => {
    // TODO: Implement wishlist functionality
    toast.success(`${product.name} added to wishlist`);
  };

  const handleViewDetails = (product: Product) => {
    router.push(`/product/${product.slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      {/* <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Shop</h1>
          <p className="text-gray-600 mt-2">Discover our amazing products</p>
        </div>
      </div> */}

      {/* Shop Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductArchive
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
          onViewDetails={handleViewDetails}
        />
      </div>
    </div>
  );
} 