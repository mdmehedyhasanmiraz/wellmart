"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ProductCard from "../shop/ProductCard";
import type { Product } from "@/types/product";
import { Loader2, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function FeaturedProductsArchive() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/public/data?type=featured-products');
        const result = await response.json();
        if (result.success) {
          setProducts(result.products || []);
        } else {
          console.error("Error fetching products:", result.error);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="my-12 mx-auto max-w-full px-3">
      <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Package className="mx-auto text-gray-400" size={48} />
          <div className="mt-4 text-lg font-medium text-gray-900">No products found</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product.id, 1)} />
          ))}
        </div>
      )}
    </section>
  );
} 