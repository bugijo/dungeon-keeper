
import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ImageLoaderProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackText?: string;
  width?: number | string;
  height?: number | string;
  fallbackClassName?: string;
}

const ImageLoader: React.FC<ImageLoaderProps> = ({
  src,
  alt,
  className = '',
  fallbackText = '',
  width,
  height,
  fallbackClassName = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null | undefined>(src);

  useEffect(() => {
    setImageSrc(src);
    setLoading(true);
    setError(false);
  }, [src]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  // Gerar iniciais para o fallback
  const getInitials = () => {
    if (fallbackText) {
      return fallbackText.substring(0, 2).toUpperCase();
    }
    return alt.substring(0, 2).toUpperCase();
  };

  if (!imageSrc || error) {
    return (
      <div 
        className={`bg-fantasy-dark/50 flex items-center justify-center rounded ${fallbackClassName}`}
        style={{ width, height }}
      >
        <span className="text-fantasy-gold">{getInitials()}</span>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <Skeleton 
          className={`rounded ${className}`}
          style={{ width, height }}
        />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${loading ? 'hidden' : ''} ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        style={{ width, height }}
        loading="lazy"
      />
    </>
  );
};

export default ImageLoader;
