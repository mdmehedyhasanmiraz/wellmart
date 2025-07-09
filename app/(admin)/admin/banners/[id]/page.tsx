'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
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

export default function EditBannerPage() {
  const router = useRouter();
  const supabase = createClient();
  const params = useParams();
  const bannerId = params?.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [initialImageUrl, setInitialImageUrl] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    position: 'hero',
    link_url: '',
    is_active: true
  });

  // Fetch banner data on mount
  useEffect(() => {
    const fetchBanner = async () => {
      if (!bannerId) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('id', bannerId)
        .single();
      if (error || !data) {
        toast.error('Failed to load banner');
        router.push('/admin/banners');
        return;
      }
      setFormData({
        title: data.title || '',
        subtitle: data.subtitle || '',
        position: data.position || 'hero',
        link_url: data.link_url || '',
        is_active: data.is_active ?? true
      });
      setImagePreview(data.image_url || '');
      setInitialImageUrl(data.image_url || '');
      setIsLoading(false);
    };
    fetchBanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerId]);

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
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let imageUrl = initialImageUrl;
      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        if (!uploaded) {
          toast.error('Failed to upload image');
          setIsLoading(false);
          return;
        }
        imageUrl = uploaded;
      }
      const bannerData = {
        title: formData.title,
        subtitle: formData.subtitle,
        position: formData.position,
        link_url: formData.link_url || null,
        is_active: formData.is_active,
        image_url: imageUrl
      };
      const { error } = await supabase
        .from('banners')
        .update(bannerData)
        .eq('id', bannerId);
      if (error) throw error;
      toast.success('Banner updated successfully');
      router.push('/admin/banners');
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error('Failed to update banner');
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
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/banners"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Banners
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Update Banner</h1>
            <p className="text-gray-600">Edit your banner details</p>
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
                    <option value="hero">Hero Banner</option>
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
              
              {imagePreview ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Recommended sizes:</strong></p>
                    <p>Hero: 1200×400px</p>
                    <p>Cards: 300×200px</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload banner image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                      required
                    />
                    <label
                      htmlFor="image-upload"
                      className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 transition-colors cursor-pointer"
                    >
                      Choose File
                    </label>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Recommended sizes:</strong></p>
                    <p>Hero: 1200×400px</p>
                    <p>Cards: 300×200px</p>
                  </div>
                </div>
              )}
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
                      Update Banner
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