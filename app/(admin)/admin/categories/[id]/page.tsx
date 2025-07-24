'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Folder, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    image_url: '',
    is_home: true,
    position: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [bucketImages, setBucketImages] = useState<Array<{url: string, name: string, path: string}>>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    if (id) fetchCategory();
    fetchCategories();
    // eslint-disable-next-line
  }, [id]);

  const fetchCategory = async () => {
    setIsFetching(true);
    const { data, error } = await supabase
      .from('categories')
      .select('name, slug, description, parent_id, image_url, is_home, position')
      .eq('id', id)
      .single();
    if (error || !data) {
      toast.error('Category not found');
      router.push('/admin/categories');
      return;
    }
    setFormData({
      name: data.name || '',
      slug: data.slug || '',
      description: data.description || '',
      parent_id: data.parent_id || '',
      image_url: data.image_url || '',
      is_home: typeof data.is_home === 'boolean' ? data.is_home : true,
      position: data.position !== null && data.position !== undefined ? String(data.position) : '',
    });
    setIsFetching(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    setCategories(data || []);
  };

  const fetchBucketImages = async () => {
    setLoadingImages(true);
    try {
      const { error: bucketError } = await supabase.storage.from('images').list('', { limit: 1 });
      if (bucketError) {
        toast.error('Cannot access images bucket. Please check storage permissions.');
        return;
      }
      const { data, error } = await supabase.storage.from('images').list('', { limit: 100, offset: 0 });
      if (error) {
        toast.error('Failed to load images from bucket');
        return;
      }
      if (!data || data.length === 0) {
        toast.success('No images found in the images bucket. Upload some images first.');
        setBucketImages([]);
        return;
      }
      const imageUrls = await Promise.all(
        data
          .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
          .map(async (file) => {
            const filePath = `${file.name}`;
            try {
              const { data: signedData, error: signedError } = await supabase.storage.from('images').createSignedUrl(filePath, 3600);
              if (signedError) {
                const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
                return { url: publicUrl, name: file.name, path: filePath };
              }
              return { url: signedData.signedUrl, name: file.name, path: filePath };
            } catch (error) {
              const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
              console.error('Error fetching signed URL:', error);
              return { url: publicUrl, name: file.name, path: filePath };
            }
          })
      );
      setBucketImages(imageUrls);
    } catch (error) {
      console.error('Error fetching images from bucket:', error);
      toast.error('Failed to load images from bucket');
    } finally {
      setLoadingImages(false);
    }
  };

  const selectImageFromBucket = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
    setShowImageSelector(false);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
    setImageFile(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' && 'checked' in e.target ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!formData.name.trim()) {
        toast.error('Category name is required');
        setIsLoading(false);
        return;
      }
      if (!formData.slug.trim()) {
        toast.error('Slug is required');
        setIsLoading(false);
        return;
      }
      let imageUrl = formData.image_url;
      if (imageFile) {
        setImageUploading(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `categories/${formData.slug}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: true,
        });
        setImageUploading(false);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
        imageUrl = publicUrlData?.publicUrl || '';
      }
      const { error } = await supabase.from('categories').update({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        parent_id: formData.parent_id || null,
        image_url: imageUrl || null,
        is_home: formData.is_home,
        position: formData.position ? parseInt(formData.position) : null,
      }).eq('id', id);
      if (error) throw error;
      toast.success('Category updated successfully');
      router.push('/admin/categories');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    } finally {
      setIsLoading(false);
      setImageUploading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex flex-col space-x-4">
        <Link
          href="/admin/categories"
          className="flex items-center text-gray-400 hover:text-lime-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Categories
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
          <p className="text-gray-600">Update category details</p>
        </div>
      </div>
    </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Folder className="w-5 h-5 mr-2" />
              Category Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="Category name"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="category-slug"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="Category description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image
                </label>
                <div className="flex items-center gap-4 mb-2">
                  {formData.image_url && (
                    <div className="relative">
                      <img
                        src={formData.image_url}
                        alt="Current"
                        className="w-32 h-32 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {imageFile && !imageUploading && (
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded border"
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="category-image-upload"
                  />
                  <label
                    htmlFor="category-image-upload"
                    className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 transition-colors cursor-pointer"
                  >
                    Upload New
                  </label>
                  <button
                    type="button"
                    onClick={() => { fetchBucketImages(); setShowImageSelector(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Select Existing
                  </button>
                </div>
                {imageUploading && <p className="text-xs text-gray-500 mt-1">Uploading image...</p>}
                {/* Image Selector Modal */}
                {showImageSelector && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">Select Image from Bucket</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Found {bucketImages.length} images • Click to select
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {bucketImages.map((image, index) => (
                            <div
                              key={index}
                              className="cursor-pointer border rounded-lg overflow-hidden hover:shadow-lg transition"
                              onClick={() => selectImageFromBucket(image.url)}
                            >
                              <img src={image.url} alt={image.name} className="w-full h-32 object-cover" />
                              <div className="p-2 text-xs text-gray-700 truncate">{image.name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Category
                </label>
                <select
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                >
                  <option value="">None</option>
                  {categories.filter(cat => cat.id !== id).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Show in Home (Hero Section)
                </label>
                <input
                  type="checkbox"
                  name="is_home"
                  checked={formData.is_home}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Display this category in the home hero section</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position (Order)
                </label>
                <input
                  type="number"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="e.g. 1 for first, 2 for second, ..."
                  min={1}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-6 py-2 bg-lime-600 text-white font-semibold rounded-lg shadow hover:bg-lime-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 