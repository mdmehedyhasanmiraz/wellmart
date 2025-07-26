'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  Search, 
  Trash2, 
  Download, 
  Copy, 
  Filter,
  Grid3X3,
  List,
  FolderOpen,
  Image as ImageIcon
} from 'lucide-react';
import type { FileObject as SupabaseFileObject } from '@supabase/storage-js';

// Extend FileObject to include folder and fullPath for local use
interface FileObjectWithExtras extends SupabaseFileObject {
  folder?: string;
  fullPath?: string;
}

interface MediaFile {
  url: string;
  name: string;
  path: string;
  folder: string;
  size?: number;
  created_at?: string;
}

export default function MediaPage() {
  const supabase = createClient();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const fetchMediaFiles = async () => {
    setLoading(true);
    try {
      // Use the optimized API endpoint
      const response = await fetch('/api/admin/data?type=media-files');
      const result = await response.json();
      
      if (!result.success) {
        console.error('Media fetch error:', result.error);
        toast.error(result.error || 'Failed to load media files');
        return;
      }

      setMediaFiles(result.files || []);
    } catch (error) {
      console.error('Error fetching media files:', error);
      toast.error('Failed to load media files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, file);
        
        if (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      
      toast.success('Files uploaded successfully');
      fetchMediaFiles(); // Refresh the list
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (filePath: string) => {
    try {
      const { error } = await supabase.storage
        .from('images')
        .remove([filePath]);
      if (error) {
        console.error('Error deleting file:', error, 'File path:', filePath);
        toast.error(`Failed to delete file: ${filePath} (${error.message})`);
        return;
      }
      toast.success('File deleted successfully');
      fetchMediaFiles(); // Refresh the list
    } catch (error) {
      console.error('Error deleting file:', error, 'File path:', filePath);
      toast.error(`Failed to delete file: ${filePath}`);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy URL');
    }
  };

  const downloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFiles = mediaFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FolderOpen className="w-6 h-6 mr-2 text-lime-600" />
            Media Library
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all your media files and images
          </p>
        </div>
        
        {/* Upload Button */}
        <div className="flex items-center space-x-3">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="media-upload"
            disabled={uploading}
          />
          <label
            htmlFor="media-upload"
            className={`flex items-center px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors cursor-pointer ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? 'Uploading...' : 'Upload Files'}
          </label>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {filteredFiles.length} of {mediaFiles.length} files
              </span>
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-lime-100 text-lime-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-lime-100 text-lime-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Files */}
      {loading ? (
        <div className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-6">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="aspect-square bg-gray-200 animate-pulse"></div>
                <div className="p-3">
                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media files found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'No files match your search.' : 'Upload some files to get started.'}
          </p>
          {!searchTerm && (
            <label
              htmlFor="media-upload"
              className="inline-flex items-center px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </label>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-6">
              {filteredFiles.map((file, index) => (
                <div
                  key={index}
                  className="group relative border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  {/* Image */}
                  <div className="relative aspect-square">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    
                    {/* Actions Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => copyToClipboard(file.url)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-md border border-gray-200"
                            title="Copy URL"
                          >
                            <Copy className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => downloadFile(file.url, file.name)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-md border border-gray-200"
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => deleteFile(file.path)}
                            className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-md border border-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* File Info */}
                  <div className="p-3">
                    <p className="text-xs text-gray-600 truncate font-medium">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatFileSize(file.size)} • {file.folder}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 bg-gray-200 flex items-center justify-center rounded-lg">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 ml-4">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFileSize(file.size)} • {file.folder} • {file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(file.url)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadFile(file.url, file.name)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFile(file.path)}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 