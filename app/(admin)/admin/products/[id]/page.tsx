"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X,
  Package,
  DollarSign,
  Hash,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import AdminImage from '@/components/admin/AdminImage';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import keyword_extractor from 'keyword-extractor';
import { Product } from '@/types/product';

interface Category {
  id: string;
  name: string;
}

interface Company {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [bucketImages, setBucketImages] = useState<Array<{url: string, name: string, path: string}>>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price_regular: '',
    price_offer: '',
    price_purchase: '',
    stock: '',
    pack_size: '',
    category_id: '',
    company_id: '',
    is_active: true,
    flash_sale: null as boolean | null,
    sku: '',
    video: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchCompanies();
    fetchUser();
    if (productId) fetchProduct();
    // eslint-disable-next-line
  }, [productId]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();
      if (result.success && result.user) {
        setUser(result.user);
      }
    } catch (error) {
      setUser(null);
      console.log(error);
    }
  };

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      console.log('[fetchProduct] Fetching product with ID:', productId);
      
      // First check if user is authenticated
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        console.error('[fetchProduct] Auth error:', authError);
        toast.error('Authentication required');
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      // Fetch product directly from Supabase
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('[fetchProduct] Supabase error:', error);
        toast.error('Failed to load product');
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      if (!data) {
        console.error('[fetchProduct] No product found');
        toast.error('Product not found');
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      console.log('[fetchProduct] Product data loaded:', data);

      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        description: data.description || '',
        price_regular: data.price_regular?.toString() || '',
        price_offer: data.price_offer?.toString() || '',
        price_purchase: data.price_purchase?.toString() || '',
        stock: data.stock?.toString() || '',
        pack_size: data.pack_size || '',
        category_id: data.category_id || '',
        company_id: data.company_id || '',
        is_active: data.is_active,
        flash_sale: data.flash_sale,
        sku: data.sku || '',
        video: data.video || '',
      });
      setImagePreviews(data.image_urls || []);
      setKeywords(data.keywords || []);
      
    } catch (error) {
      console.error('[fetchProduct] Error:', error);
      toast.error('Failed to load product details');
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!formData.name) {
      setSuggestedKeywords([]);
      return;
    }
    const extracted = keyword_extractor.extract(formData.name, {
      language: 'english',
      remove_digits: true,
      return_changed_case: true,
      remove_duplicates: true,
    });
    const suggestions = [
      ...extracted,
      ...extracted.map(word => `${word} buy`),
      ...extracted.map(word => `${word} price`),
      ...extracted.map(word => `${word} online`),
      formData.name + ' price',
      formData.name + ' online',
      formData.name + ' buy',
    ].filter((kw, i, arr) => kw.length > 2 && arr.indexOf(kw) === i && !keywords.includes(kw));
    setSuggestedKeywords(suggestions.slice(0, 8));
  }, [formData.name, keywords]);

  const fetchCategories = async () => {
    try {
      console.log('[fetchCategories] Fetching categories...');
      
      // Use direct Supabase query with proper error handling
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('[fetchCategories] Supabase error:', error);
        toast.error('Failed to load categories');
        return;
      }

      console.log('[fetchCategories] Categories loaded:', data?.length || 0);
      setCategories(data || []);
      
    } catch (error) {
      console.error('[fetchCategories] Error:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchCompanies = async () => {
    try {
      console.log('[fetchCompanies] Fetching companies...');
      
      // Use direct Supabase query with proper error handling
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('[fetchCompanies] Supabase error:', error);
        toast.error('Failed to load companies');
        return;
      }

      console.log('[fetchCompanies] Companies loaded:', data?.length || 0);
      setCompanies(data || []);
      
    } catch (error) {
      console.error('[fetchCompanies] Error:', error);
      toast.error('Failed to load companies');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFiles(prev => [...prev, file]);
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const fetchBucketImages = async () => {
    console.log('[DEBUG] fetchBucketImages called');
    setLoadingImages(true);
    try {
      const { error: bucketError } = await supabase.storage
        .from('images')
        .list('', { limit: 1 });
      if (bucketError) {
        toast.error('Cannot access images bucket. Please check storage permissions.');
        setBucketImages([]);
        setLoadingImages(false);
        return;
      }
      const { data, error } = await supabase.storage
        .from('images')
        .list('products', { limit: 100, offset: 0 });
      if (error) {
        toast.error('Failed to load images from bucket');
        setBucketImages([]);
        setLoadingImages(false);
        return;
      }
      if (!data || data.length === 0) {
        toast.success('No images found in the products folder. Upload some images first.');
        setBucketImages([]);
        setLoadingImages(false);
        return;
      }
      const imageUrls = await Promise.all(
        data
          .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
          .map(async (file) => {
            const filePath = `products/${file.name}`;
            try {
              const { data: signedData, error: signedError } = await supabase.storage
                .from('images')
                .createSignedUrl(filePath, 3600);
              if (signedError || !signedData?.signedUrl) {
                if (signedError) {
                  console.error(`Signed URL error for ${file.name}:`, signedError);
                }
                const { data: publicData } = supabase.storage
                  .from('images')
                  .getPublicUrl(filePath);
                if (publicData?.publicUrl) {
                  return { url: publicData.publicUrl, name: file.name, path: filePath };
                } else {
                  console.error(`No valid URL for file: ${file.name}`);
                  return null;
                }
              }
              return { url: signedData.signedUrl, name: file.name, path: filePath };
            } catch (error) {
              console.error(`Error generating URL for ${file.name}:`, error);
              const { data: publicData } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);
              if (publicData?.publicUrl) {
                return { url: publicData.publicUrl, name: file.name, path: filePath };
              } else {
                console.error(`No valid URL for file: ${file.name}`);
                return null;
              }
            }
          })
      );
      const validImages = imageUrls.filter(Boolean) as { url: string; name: string; path: string }[];
      setBucketImages(validImages);
      if (validImages.length === 0) {
        toast.error('No valid images found in the products folder.');
      }
    } catch (error) {
      toast.error('Failed to load images from bucket');
      setBucketImages([]);
      console.error(error);
    } finally {
      setLoadingImages(false);
    }
  };

  const selectImageFromBucket = (imageUrl: string) => {
    setImagePreviews(prev => [...prev, imageUrl]);
    setShowImageSelector(false);
  };

  const testImageUrl = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  function addKeyword(kw: string) {
    if (!keywords.includes(kw)) setKeywords([...keywords, kw]);
  }
  function removeKeyword(kw: string) {
    setKeywords(keywords.filter(k => k !== kw));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('[handleSubmit] Starting product update for ID:', productId);
      console.log('[handleSubmit] Form data:', formData);
      
      // Upload all image files
      const uploadedImageUrls: string[] = [];
      for (const file of imageFiles) {
        console.log('[handleSubmit] Uploading image:', file.name);
        const imageUrl = await uploadImage(file);
        if (imageUrl) {
          uploadedImageUrls.push(imageUrl);
          console.log('[handleSubmit] Image uploaded successfully:', imageUrl);
        } else {
          console.error('[handleSubmit] Failed to upload image:', file.name);
          toast.error(`Failed to upload image: ${file.name}`);
          setIsLoading(false);
          return;
        }
      }
      
      // Combine uploaded images with selected bucket images
      const allImageUrls = [...uploadedImageUrls, ...imagePreviews.filter(url => !url.startsWith('data:'))];
      console.log('[handleSubmit] All image URLs:', allImageUrls);
      
      const productData: Partial<Product> = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price_regular: parseFloat(formData.price_regular),
        price_offer: formData.price_offer ? parseFloat(formData.price_offer) : null,
        stock: parseInt(formData.stock),
        pack_size: formData.pack_size,
        category_id: formData.category_id || null,
        company_id: formData.company_id || null,
        is_active: formData.is_active,
        flash_sale: formData.flash_sale,
        sku: formData.sku || "",
        image_urls: allImageUrls,
        video: formData.video,
        keywords: keywords,
      };
      
      if (user?.role === 'admin') {
        productData.price_purchase = formData.price_purchase ? parseFloat(formData.price_purchase) : null;
      }
      
      console.log('[handleSubmit] Product data to update:', productData);
      
      // Update product directly using Supabase
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
        .select()
        .single();

      if (updateError) {
        console.error('[handleSubmit] Supabase update error:', updateError);
        toast.error(updateError.message || 'Failed to update product');
        setIsLoading(false);
        return;
      }

      console.log('[handleSubmit] Product updated successfully:', updatedProduct);
      toast.success('Product updated successfully');
      router.push('/admin/products');
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('[handleSubmit] Error:', error);
        toast.error(error.message || 'Failed to update product');
      } else {
        console.error('[handleSubmit] Unknown error:', error);
        toast.error('Failed to update product');
      }
    } finally {
      console.log('[handleSubmit] Setting loading to false');
      setIsLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-6">The product you are trying to edit does not exist.</p>
        <Link href="/admin/products" className="text-lime-600 hover:underline">Back to Products</Link>
      </div>
    );
  }

  if (isLoading && !formData.name) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold mb-4">Loading Product</h2>
        <p className="text-gray-600">Please wait while we load the product details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-x-4">
          <Link
            href="/admin/products"
            className="flex items-center text-gray-400 hover:text-lime-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600">Update product details</p>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    placeholder="Enter product slug (e.g. product-name)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    name="pack_size"
                    value={formData.pack_size}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    placeholder="e.g. 500g, 1L, 10pcs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    placeholder="Enter SKU"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  placeholder="Enter product description"
                />
              </div>
            </div>
            {/* Pricing */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Pricing & Stock
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Regular Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                    <input
                      type="number"
                      name="price_regular"
                      value={formData.price_regular}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                    <input
                      type="number"
                      name="price_offer"
                      value={formData.price_offer}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase Price (Admin Only)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                      <input
                        type="number"
                        name="price_purchase"
                        value={formData.price_purchase}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            {/* Category & Company */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Hash className="w-5 h-5 mr-2" />
                Category & Company
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category ({categories.length} available)
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.length === 0 ? (
                      <option value="" disabled>No categories available</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      No categories found. Please add categories first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company ({companies.length} available)
                  </label>
                  <select
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  >
                    <option value="">Select company</option>
                    {companies.length === 0 ? (
                      <option value="" disabled>No companies available</option>
                    ) : (
                      companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))
                    )}
                  </select>
                  {companies.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      No companies found. Please add companies first.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Product Images ({imagePreviews.length})
              </h2>
              {imagePreviews.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <AdminImage
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                          fallbackIcon={<ImageIcon className="w-8 h-8 text-gray-400" />}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Upload/Select buttons */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Add more product images</p>
                <div className="flex gap-2 justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 transition-colors cursor-pointer"
                  >
                    Upload New
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      fetchBucketImages();
                      setShowImageSelector(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Select Existing
                  </button>
                </div>
              </div>
              {/* Image Selector Modal */}
              {showImageSelector && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">Select Images from Bucket</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Found {bucketImages.length} images • Click to select
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Debug: {bucketImages.length > 0 ? `First image: ${bucketImages[0].name}` : 'No images'}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowImageSelector(false)}
                        className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    {loadingImages ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 text-lg">Loading images from bucket...</p>
                      </div>
                    ) : bucketImages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">📁</div>
                        <p className="text-gray-500 text-lg">No images found in bucket</p>
                        <p className="text-gray-400 text-sm mt-2">Upload some images first to see them here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {bucketImages.map((image, index) => (
                          <div
                            key={index}
                            className="group flex items-center border-2 border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-lime-500 hover:shadow-lg transition-all duration-200 bg-white"
                            onClick={() => selectImageFromBucket(image.url)}
                          >
                            {/* Image */}
                            <div className="relative w-24 h-24 flex-shrink-0">
                              <AdminImage
                                src={image.url}
                                alt={`Image ${index + 1}`}
                                className="w-full h-full object-cover"
                                fallbackIcon={<ImageIcon className="w-6 h-6 text-gray-400" />}
                                onError={() => testImageUrl(image.url)}
                              />
                              <div className="hidden absolute inset-0 bg-gray-200 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-gray-400 text-2xl">🖼️</div>
                                </div>
                              </div>
                            </div>
                            {/* Image info */}
                            <div className="flex-1 p-4">
                              <p className="text-sm font-medium text-gray-800 truncate">{image.name}</p>
                              <p className="text-xs text-gray-500 mt-1">Click to select this image</p>
                            </div>
                            {/* Selection indicator */}
                            <div className="p-4 flex items-center">
                              <div className="w-6 h-6 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-3 h-3 bg-lime-500 rounded-full"></div>
                              </div>
                              <span className="ml-3 text-gray-400 group-hover:text-lime-600 transition-colors">
                                Select
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                          Selected images will be added to your product
                        </p>
                        <button
                          onClick={() => setShowImageSelector(false)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* YouTube Video */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                YouTube Video
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube Video URL
                </label>
                <input
                  type="url"
                  name="video"
                  value={formData.video}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste a YouTube video URL to embed it on the product page
                </p>
              </div>
            </div>
            {/* Status */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Status
              </h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-lime-600 focus:ring-lime-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Active (visible to customers)
                </label>
              </div>

              <div className="flex items-center mt-3">
                <input
                  type="checkbox"
                  name="flash_sale"
                  checked={formData.flash_sale === true}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      flash_sale: e.target.checked ? true : null
                    }));
                  }}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Flash Sale (show in flash sale section)
                </label>
              </div>
            </div>
            {/* Keywords */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Hash className="w-5 h-5 mr-2" />
                Keywords
              </h2>
              <div className="mt-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {suggestedKeywords.map(kw => (
                    <button type="button" key={kw} onClick={() => addKeyword(kw)} className="px-3 py-1 bg-lime-100 text-lime-700 rounded-full text-xs hover:bg-lime-200 transition">
                      {kw}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map(kw => (
                    <span key={kw} className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {kw}
                      <button type="button" onClick={() => removeKeyword(kw)} className="ml-1 text-gray-400 hover:text-red-500">&times;</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-lime-600 text-white py-2 px-4 rounded-lg hover:bg-lime-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Product
                    </>
                  )}
                </button>
                <Link
                  href="/admin/products"
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 