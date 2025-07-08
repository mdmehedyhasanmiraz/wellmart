'use client';

import { notFound, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { Product } from '@/types/product';
import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'react-hot-toast';

interface ProductPageProps {
  params: { slug: string };
}

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<'description' | 'reviews'>('description');
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const fetchProduct = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select(`*, category:categories(name), manufacturer:manufacturers(name)`)
        .eq('slug', params.slug)
        .single();
      if (error || !data) {
        setProduct(null);
        setLoading(false);
      } else {
        setProduct(data);
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params.slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!product) {
    notFound();
    return null;
  }

  // Static rating/review for now
  const rating = 4;
  const reviewCount = 12;

  const handleAddToCart = async () => {
    if (product.stock === 0) return;
    setAddLoading(true);
    try {
      await addToCart(product.id, quantity);
      toast.success('Added to cart');
    } catch (e) {
      toast.error('Failed to add to cart');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 flex flex-col md:flex-row gap-8">
        {/* Product Image */}
        <div className="flex-shrink-0 flex flex-col items-center w-full md:w-1/2">
          <div className="border rounded-xl overflow-hidden bg-white w-80 h-80 flex items-center justify-center">
            {product.image_urls && product.image_urls.length > 0 ? (
              <img
                src={product.image_urls[0]}
                alt={product.name}
                className="object-contain w-full h-full"
              />
            ) : (
              <div className="text-gray-400">No Image</div>
            )}
          </div>
        </div>
        {/* Product Details */}
        <div className="flex-1 flex flex-col gap-2 justify-center">
          {/* Category Tag */}
          {product.category?.name && (
            <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">
              {product.category.name}
            </span>
          )}
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{product.name}</h1>
          {/* Star Rating */}
          <div className="flex items-center gap-2 mb-1">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-5 h-5 ${i < rating ? '' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.045 9.394c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" /></svg>
              ))}
            </div>
            <span className="text-sm text-gray-600 font-medium">{rating} ({reviewCount} reviews)</span>
          </div>
          {/* Manufacturer/Brand */}
          {product.manufacturer?.name && (
            <div className="text-sm font-semibold text-gray-700 mb-1">{product.manufacturer.name}</div>
          )}
          {/* Short Description */}
          <div className="text-gray-600 text-sm mb-2">
            {product.description?.slice(0, 120) || ''}
            {product.description && product.description.length > 120 ? '...' : ''}
          </div>
          {/* Price */}
          <div className="flex items-center gap-3 mb-2">
            {product.price_offer ? (
              <>
                <span className="text-xl font-bold text-gray-400 line-through">৳{product.price_regular.toFixed(2)}</span>
                <span className="text-2xl font-bold text-green-700">৳{product.price_offer.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-2xl font-bold text-green-700">৳{product.price_regular.toFixed(2)}</span>
            )}
          </div>
          {/* Quantity Selector and Add to Cart */}
          <div className="flex items-center gap-2 mb-4">
            <button type="button" className="px-3 py-1 text-lg font-bold text-gray-600 hover:bg-gray-100 border rounded-l" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={product.stock === 0 || quantity <= 1}>-</button>
            <input
              id="qty-input"
              type="number"
              name="quantity"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))}
              className="w-12 text-center border-t border-b focus:ring-0"
              disabled={product.stock === 0}
            />
            <button type="button" className="px-3 py-1 text-lg font-bold text-gray-600 hover:bg-gray-100 border rounded-r" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={product.stock === 0 || quantity >= product.stock}>+</button>
            <button
              type="button"
              disabled={product.stock === 0 || addLoading}
              onClick={handleAddToCart}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 ml-2"
            >
              {addLoading ? 'Adding...' : (<><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m13-9l2 9m-5-9V6a2 2 0 10-4 0v3" /></svg> Add to Cart</>)}
            </button>
          </div>
          {/* Stock Status */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
            <span className="text-xs text-gray-500">{product.stock} available</span>
          </div>
        </div>
      </div>
      {/* Tabs for Description/Reviews */}
      <div className="max-w-3xl mx-auto mt-8 bg-white rounded-xl shadow p-6">
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-t font-semibold text-sm ${tab === 'description' ? 'bg-green-100 text-green-700' : 'text-gray-600'}`}
            onClick={() => setTab('description')}
          >
            Description
          </button>
          <button
            className={`px-4 py-2 rounded-t font-semibold text-sm ${tab === 'reviews' ? 'bg-green-100 text-green-700' : 'text-gray-600'}`}
            onClick={() => setTab('reviews')}
          >
            Reviews
          </button>
        </div>
        {tab === 'description' && (
          <div className="bg-gray-50 rounded-b p-4 text-gray-700 text-sm min-h-[120px]">
            {product.description}
          </div>
        )}
        {tab === 'reviews' && (
          <div className="bg-gray-50 rounded-b p-4 text-gray-700 text-sm min-h-[120px]">
            <div>No reviews yet.</div>
          </div>
        )}
      </div>
    </div>
  );
} 