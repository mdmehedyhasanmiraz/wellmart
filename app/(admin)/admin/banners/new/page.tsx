'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  MapPin,
  Eye
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function NewBannerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [bucketImages, setBucketImages] = useState<Array<{url: string, name: string, path: string}>>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    position: 'main', // default to 'main' as per DB constraint
    link_url: '',
    is_active: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    const previews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === files.length) {
          setImagePreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (files.length === 0) setImagePreviews([]);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // Fetch images from bucket
  const fetchBucketImages = async () => {
    setLoadingImages(true);
    try {
      const { error: bucketError } = await supabase.storage
        .from('images')
        .list('banners', { limit: 100, offset: 0 });
      if (bucketError) {
        toast.error('Cannot access banners bucket.');
        setLoadingImages(false);
        return;
      }
      const { data, error } = await supabase.storage
        .from('images')
        .list('banners', { limit: 100, offset: 0 });
      if (error) {
        toast.error('Failed to load images from bucket');
        setLoadingImages(false);
        return;
      }
      if (!data || data.length === 0) {
        toast.success('No images found in the banners folder.');
        setBucketImages([]);
        setLoadingImages(false);
        return;
      }
      const imageUrls = await Promise.all(
        data
          .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
          .map(async (file) => {
            const filePath = `banners/${file.name}`;
            const { data: { publicUrl } } = supabase.storage
              .from('images')
              .getPublicUrl(filePath);
            return { url: publicUrl, name: file.name, path: filePath };
          })
      );
      setBucketImages(imageUrls);
    } catch (error) {
      toast.error('Failed to load images from bucket');
      console.error('Failed to load images from bucket', error);
    } finally {
      setLoadingImages(false);
    }
  };
  // Change selectImageFromBucket to allow multiple selection
  const selectImageFromBucket = (imageUrl: string) => {
    setImagePreviews(prev => [...prev, imageUrl]);
    setImageFiles([]);
    setShowImageSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let allImageUrls: string[] = [];
      // Upload all image files if any
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const imageUrl = await uploadImage(file);
          if (!imageUrl) {
            toast.error('Failed to upload image');
            setIsLoading(false);
            return;
          }
          allImageUrls.push(imageUrl);
        }
      }
      // Add selected previews that are URLs (not data:)
      allImageUrls = [
        ...allImageUrls,
        ...imagePreviews.filter(url => !url.startsWith('data:'))
      ];
      if (allImageUrls.length === 0) {
        toast.error('Please select or upload at least one image');
        setIsLoading(false);
        return;
      }
      const bannerData = {
        title: formData.title,
        subtitle: formData.subtitle,
        position: formData.position,
        link_url: formData.link_url || null,
        is_active: formData.is_active,
        image_urls: allImageUrls
      };
      const { error } = await supabase
        .from('banners')
        .insert([bannerData]);
      if (error) throw error;
      toast.success('Banner created successfully');
      router.push('/admin/banners');
    } catch (error) {
      console.error('Error creating banner:', error);
      toast.error('Failed to create banner');
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionDescription = (position: string) => {
    switch (position) {
      case 'hero':
        return 'Large banner displayed at the top of the homepage';
      case 'card1':
        return 'First promotional card in the hero section';
      case 'card2':
        return 'Second promotional card in the hero section';
      case 'card3':
        return 'Third promotional card in the hero section';
      case 'card4':
        return 'Fourth promotional card in the hero section';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-x-4">
          <Link
            href="/admin/banners"
            className="flex items-center text-gray-400 hover:text-lime-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Banners
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Banner</h1>
            <p className="text-gray-600">Create a new banner for your homepage</p>
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
                <ImageIcon className="w-5 h-5 mr-2" />
                Banner Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    placeholder="Enter banner title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    placeholder="Enter banner description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position *
                  </label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  >
                    <option value="main">Main Banner</option>
                    <option value="card1">Card 1</option>
                    <option value="card2">Card 2</option>
                    <option value="card3">Card 3</option>
                    <option value="card4">Card 4</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    {getPositionDescription(formData.position)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link URL
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="url"
                      name="link_url"
                      value={formData.link_url}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Optional: URL to redirect when banner is clicked
                  </p>
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
                Banner Image
              </h2>
              {/* Upload/Select buttons */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload or select a banner image</p>
                <div className="flex gap-2 justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    multiple={formData.position === 'hero'}
                  />
                  <label
                    htmlFor="image-upload"
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
              </div>
              {/* Image Selector Modal */}
              {showImageSelector && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">Select Images from Bucket</h3>
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
                            className="group border-2 border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-lime-500 hover:shadow-lg transition-all duration-200 bg-white"
                            onClick={() => selectImageFromBucket(image.url)}
                          >
                            <img
                              src={image.url}
                              alt={`Image ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="p-2 text-xs text-gray-700 truncate">{image.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                      <button
                        onClick={() => setShowImageSelector(false)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Previews remain unchanged */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-sm text-gray-600">
                <p><strong>Recommended size:</strong> 1200×400px</p>
              </div>
            </div>

            {/* Position Preview */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Position Preview
              </h2>
              
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p><strong>Current Position:</strong> {formData.position}</p>
                  <p className="mt-2">{getPositionDescription(formData.position)}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-2">Layout Preview:</div>
                  {formData.position === 'hero' ? (
                    <div className="space-y-2">
                      <div className="h-8 bg-lime-200 rounded flex items-center justify-center text-xs">
                        Hero Banner
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-6 bg-gray-200 rounded text-xs flex items-center justify-center">Card 1</div>
                        <div className="h-6 bg-gray-200 rounded text-xs flex items-center justify-center">Card 2</div>
                        <div className="h-6 bg-gray-200 rounded text-xs flex items-center justify-center">Card 3</div>
                        <div className="h-6 bg-gray-200 rounded text-xs flex items-center justify-center">Card 4</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-8 bg-gray-200 rounded flex items-center justify-center text-xs">
                        Hero Banner
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`h-6 rounded text-xs flex items-center justify-center ${
                          formData.position === 'card1' ? 'bg-lime-200' : 'bg-gray-200'
                        }`}>
                          Card 1
                        </div>
                        <div className={`h-6 rounded text-xs flex items-center justify-center ${
                          formData.position === 'card2' ? 'bg-lime-200' : 'bg-gray-200'
                        }`}>
                          Card 2
                        </div>
                        <div className={`h-6 rounded text-xs flex items-center justify-center ${
                          formData.position === 'card3' ? 'bg-lime-200' : 'bg-gray-200'
                        }`}>
                          Card 3
                        </div>
                        <div className={`h-6 rounded text-xs flex items-center justify-center ${
                          formData.position === 'card4' ? 'bg-lime-200' : 'bg-gray-200'
                        }`}>
                          Card 4
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2" />
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
                      Create Banner
                    </>
                  )}
                </button>
                
                <Link
                  href="/admin/banners"
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