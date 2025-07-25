'use client';

import { useState } from 'react';
import { Product } from '@/types/product';
import { ShoppingCart, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export default function ProductCard({ 
  product, 
  onAddToCart,  
  onViewDetails 
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const hasDiscount = product.price_offer && product.price_offer < product.price_regular;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.price_regular - product.price_offer!) / product.price_regular) * 100)
    : 0;

  const currentPrice = hasDiscount ? product.price_offer! : product.price_regular;
  const isOutOfStock = product.stock <= 0;

  return (
    <div 
      className="group relative bg-white rounded-xl transition-all duration-300 overflow-hidden border border-gray-200 shadow-xs"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            -{discountPercentage}%
          </span>
        </div>
      )}

      {/* Stock Badge */}
      {isOutOfStock && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-gray-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Out of Stock
          </span>
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.image_urls && product.image_urls.length > 0 ? (
          <img
            src={product.image_urls[0]}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isHovered ? 'scale-105' : 'scale-100'
            } ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsImageLoading(false)}
            onError={() => setIsImageLoading(false)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className={`absolute inset-0 transition-all duration-300 flex items-center justify-center gap-2 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={() => onViewDetails?.(product)}
            className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-50 transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        {product.category && (
          <div className="text-xs text-green-600 font-medium mb-1">
            {product.category.name}
          </div>
        )}

        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
          <a href={`/product/${product.slug}`} className="hover:text-green-600 transition-colors cursor-pointer">
            {product.name}
          </a>
        </h3>

        {/* Generic Name */}
        {product.generic_name && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-1">
            {product.generic_name}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-gray-900">
            ৳{currentPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-500 line-through">
              ৳{product.price_regular.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart?.(product)}
          disabled={isOutOfStock}
          className={`w-full cursor-pointer flex items-center justify-center gap-2 py-1 px-4 rounded-md font-medium text-sm transition-all duration-200 ${
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-lime-100 text-green-700 hover:bg-green-700 hover:text-white active:scale-95'
          }`}
        >
          <ShoppingCart size={16} />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
} 