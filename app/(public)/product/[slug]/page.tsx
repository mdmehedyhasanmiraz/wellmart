'use client';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { Product } from '@/types/product';
import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'react-hot-toast';
import { Star, Package, ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import ReviewForm from '@/components/reviews/ReviewForm';
import type { Review } from '@/types/reviews';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = React.use(params);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tab, setTab] = useState<'description' | 'reviews' | 'details'>('description');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const { addToCart } = useCart();
  const supabase = createClient();

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        let finalProduct = null;

        // Fetch product with more flexible filtering - try different status combinations
        let productData = null;
        let productError = null;

        // First try: active and published
        const { data: publishedProduct, error: publishedError } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(name, slug),
            manufacturer:manufacturers!products_manufacturer_id_fkey(name)
          `)
          .eq('slug', resolvedParams.slug)
          .eq('is_active', true)
          .eq('status', 'published')
          .single();

        if (publishedProduct) {
          productData = publishedProduct;
        } else {
          // Second try: active products regardless of status
          const { data: activeProduct, error: activeError } = await supabase
            .from('products')
            .select(`
              *,
              category:categories(name, slug),
              manufacturer:manufacturers!products_manufacturer_id_fkey(name)
            `)
            .eq('slug', resolvedParams.slug)
            .eq('is_active', true)
            .single();

          if (activeProduct) {
            productData = activeProduct;
          } else {
            // Third try: any product with this slug
            const { data: anyProduct, error: anyError } = await supabase
              .from('products')
              .select(`
                *,
                category:categories(name, slug),
                manufacturer:manufacturers!products_manufacturer_id_fkey(name)
              `)
              .eq('slug', resolvedParams.slug)
              .single();

            if (anyProduct) {
              productData = anyProduct;
            } else {
              productError = anyError || activeError || publishedError;
            }
          }
        }

        if (productError || !productData) {
          console.error('Product fetch error:', productError);
          setProduct(null);
          setLoading(false);
          return;
        }

        finalProduct = productData;

        setProduct(finalProduct as unknown as Product);

        // Fetch approved reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', finalProduct.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (!reviewsError && reviewsData) {
          setReviews(reviewsData as unknown as Review[]);
        }

        // Check if user has already reviewed this product
        try {
          const response = await fetch('/api/auth/me');
          const result = await response.json();
          
          if (result.success) {
            const { data: userReviewData } = await supabase
              .from('reviews')
              .select('*')
              .eq('product_id', finalProduct.id)
              .eq('user_id', result.user.id)
              .single();
            
            if (userReviewData) {
              setUserReview(userReviewData as unknown as Review);
            }
          }
        } catch (error) {
          console.error('Error checking user review:', error);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [resolvedParams.slug, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lime-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product: {resolvedParams.slug}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
    return null;
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const handleAddToCart = async () => {
    if (product.stock === 0) return;
    setAddLoading(true);
    try {
      await addToCart(product.id, quantity);
      toast.success('Added to cart');
    } catch (e) {
      toast.error('Failed to add to cart');
      console.error('Failed to add to cart:', e);
    } finally {
      setAddLoading(false);
    }
  };

  const nextImage = () => {
    if (product.image_urls && product.image_urls.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === product.image_urls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product.image_urls && product.image_urls.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.image_urls.length - 1 : prev - 1
      );
    }
  };

  // Function to convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    // Handle different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    return url; // Return original URL if no match
  };

  // Define a type for tab values
  type TabType = 'description' | 'reviews' | 'details';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-lime-600">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/shop" className="hover:text-lime-600">Shop</Link>
            </li>
            {product.category && (
              <>
                <li>/</li>
                <li>
                  <Link href={`/shop?category=${product.category.slug}`} className="hover:text-lime-600">
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <li>/</li>
            <li className="text-gray-900 font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Product Images and Video */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative">
                {/* Main Image */}
                <div className="relative h-96 bg-gray-100 overflow-hidden group">
                  {product.image_urls && product.image_urls.length > 0 ? (
                    <img
                      src={product.image_urls[currentImageIndex]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-16 h-16" />
                    </div>
                  )}
                  
                  {/* Navigation Arrows */}
                  {product.image_urls && product.image_urls.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg z-10"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg z-10"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Images */}
                {product.image_urls && product.image_urls.length > 1 && (
                  <div className="flex space-x-2 p-4">
                    {product.image_urls.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                          index === currentImageIndex ? 'border-lime-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* YouTube Video */}
            {product.video && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Product Video</h3>
                </div>
                <div className="relative pb-[56.25%] h-0">
                  <iframe
                    src={getYouTubeEmbedUrl(product.video)}
                    title={`${product.name} Video`}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-4">
            {/* Product Info Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Category Tag */}
              {product.category?.name && (
                <Link
                  href={`/shop?category=${product.category.slug}`}
                  className="inline-block bg-lime-100 text-lime-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 hover:bg-lime-200 transition-colors"
                >
                  {product.category.name}
                </Link>
              )}

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {averageRating.toFixed(1)} ({reviews.length} reviews)
                </span>
              </div>

              {/* Company and Pack Size Info */}
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                {product.manufacturer?.name && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Company:</span>
                    <span>{product.manufacturer.name}</span>
                  </div>
                )}
                {product.pack_size && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Pack Size:</span>
                    <span>{product.pack_size}</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                {product.price_offer && product.price_offer !== product.price_regular ? (
                  <>
                    <span className="text-3xl font-bold text-lime-600">
                      ৳{(product.price_offer * quantity).toFixed(2)}
                    </span>
                    <span className="text-xl font-bold text-gray-400 line-through">
                      ৳{(product.price_regular * quantity).toFixed(2)}
                    </span>
                    <span className="bg-red-100 text-red-700 text-sm font-semibold px-2 py-1 rounded">
                      {Math.round(((product.price_regular - product.price_offer) / product.price_regular) * 100)}% OFF
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-lime-600">
                    ৳{product.price_regular.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
                <span className="text-sm text-gray-500">
                  {product.stock} available
                </span>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Quantity:</label>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      className="p-3 text-gray-600 hover:bg-gray-100 hover:text-lime-600 disabled:opacity-50 disabled:hover:bg-gray-50 disabled:hover:text-gray-600 transition-all duration-200"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={product.stock === 0 || quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={product.stock}
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))}
                      className="w-16 text-center bg-white border-x border-gray-200 py-3 focus:ring-0 focus:border-lime-500 text-gray-900 font-medium"
                      disabled={product.stock === 0}
                    />
                    <button
                      type="button"
                      className="p-3 text-gray-600 hover:bg-gray-100 hover:text-lime-600 disabled:opacity-50 disabled:hover:bg-gray-50 disabled:hover:text-gray-600 transition-all duration-200"
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      disabled={product.stock === 0 || quantity >= product.stock}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={product.stock === 0 || addLoading}
                    onClick={handleAddToCart}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-lime-600 text-white rounded-lg font-semibold hover:bg-lime-700 disabled:opacity-50 transition-colors"
                  >
                    {addLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart
                      </>
                    )}
                  </button>
                  <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Heart className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Details Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.sku && (
                  <div>
                    <span className="font-medium text-gray-600">SKU:</span>
                    <span className="ml-2 text-gray-900">{product.sku}</span>
                  </div>
                )}
                {product.generic_name && (
                  <div>
                    <span className="font-medium text-gray-600">Generic Name:</span>
                    <span className="ml-2 text-gray-900">{product.generic_name}</span>
                  </div>
                )}
                {product.dosage_form && (
                  <div>
                    <span className="font-medium text-gray-600">Dosage Form:</span>
                    <span className="ml-2 text-gray-900">{product.dosage_form}</span>
                  </div>
                )}
                {product.pack_size && (
                  <div>
                    <span className="font-medium text-gray-600">Pack Size:</span>
                    <span className="ml-2 text-gray-900">{product.pack_size}</span>
                  </div>
                )}
                {product.manufacturer?.name && (
                  <div>
                    <span className="font-medium text-gray-600">Company:</span>
                    <span className="ml-2 text-gray-900">{product.manufacturer.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'description' as TabType, label: 'Description' },
                { id: 'details' as TabType, label: 'Product Details' },
                { id: 'reviews' as TabType, label: `Reviews (${reviews.length})` }
              ].map((tabItem) => (
                <button
                  key={tabItem.id}
                  onClick={() => setTab(tabItem.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    tab === tabItem.id
                      ? 'border-lime-500 text-lime-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tabItem.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {tab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {tab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Product Information</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">SKU</dt>
                      <dd className="text-gray-900">{product.sku}</dd>
                    </div>
                    {product.generic_name && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Generic Name</dt>
                        <dd className="text-gray-900">{product.generic_name}</dd>
                      </div>
                    )}
                    {product.dosage_form && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Dosage Form</dt>
                        <dd className="text-gray-900">{product.dosage_form}</dd>
                      </div>
                    )}
                    {product.pack_size && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Pack Size</dt>
                        <dd className="text-gray-900">{product.pack_size}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Company Information</h3>
                  <dl className="space-y-2">
                    {product.manufacturer?.name && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Company</dt>
                        <dd className="text-gray-900">{product.manufacturer.name}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Stock</dt>
                      <dd className="text-gray-900">{product.stock} units</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {tab === 'reviews' && (
              <div className="space-y-6">
                {/* Review Form Section */}
                <div className="border-b border-gray-200 pb-6">
                  {userReview ? (
                    <div className="bg-lime-50 border border-lime-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-lime-800">Your Review</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < userReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-lime-700">
                              {userReview.status === 'pending' ? '(Pending Approval)' : 
                               userReview.status === 'approved' ? '(Approved)' : '(Rejected)'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="text-sm text-lime-600 hover:text-lime-700 font-medium"
                        >
                          Edit Review
                        </button>
                      </div>
                      <p className="text-gray-700 mt-2">{userReview.comment}</p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Star className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Share Your Experience</h4>
                      <p className="text-gray-600 mb-4">Help other customers by writing a review</p>
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-lime-600 hover:bg-lime-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Write a Review
                      </button>
                    </div>
                  )}

                  {/* Review Form */}
                  {showReviewForm && (
                    <div className="mt-6">
                      <ReviewForm
                        productId={product.id}
                        existingReview={userReview}
                        onReviewSubmitted={(review) => {
                          setUserReview(review);
                          setShowReviewForm(false);
                          // Refresh reviews list
                          window.location.reload();
                        }}
                        onCancel={() => setShowReviewForm(false)}
                      />
                    </div>
                  )}
                </div>

                {/* Existing Reviews */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Customer Reviews ({reviews.length})
                  </h4>
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                      <p className="text-gray-600">Be the first to review this product!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">
                              by Anonymous
                            </span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 