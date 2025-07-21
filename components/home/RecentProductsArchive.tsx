'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ProductCard from '../shop/ProductCard';
import type { Product } from '@/types/product';

export default function RecentProductsArchive() {
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
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) {
        console.error('Error fetching products:', error);
      }
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <section className="py-12 mx-auto max-w-7xl px-3">
      <h2 className="text-2xl font-bold mb-6">Recently Added Products</h2>
      {loading ? (
        <div className="flex justify-center py-8">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No recent products found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
} 