'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ProductCard from '../shop/ProductCard';
import type { Product } from '@/types/product';

export default function TopProductsArchive() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'published')
        .order('average_rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(8);
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <section className="py-12 mx-auto max-w-7xl">
      <h2 className="text-2xl font-bold mb-6">Top Rated Products</h2>
      {loading ? (
        <div className="flex justify-center py-8">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No top products found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
} 