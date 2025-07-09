'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

type Category = {
  id: string;
  name: string;
  slug?: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) {
        console.error('Error fetching categories:', error);
      }
      setCategories(data || []);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Product Categories</h1>
        {loading ? (
          <div className="flex justify-center py-8">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No categories found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.id}`}
                className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-green-50 transition"
              >
                <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mb-3 text-2xl text-green-700">
                  <span role="img" aria-label="Category">📦</span>
                </div>
                <span className="font-semibold text-gray-800 text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 