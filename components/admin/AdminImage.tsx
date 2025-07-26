import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface AdminImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackIcon?: React.ReactNode;
  onError?: () => void;
}

export default function AdminImage({ 
  src, 
  alt, 
  className = "w-full h-full object-cover", 
  style,
  fallbackIcon = <ImageIcon className="w-6 h-6 text-gray-400" />,
  onError 
}: AdminImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`} style={style}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={style}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
} 