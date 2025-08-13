import { useState, useEffect, useRef } from 'react';
import { useImageCompression } from '@/utils/imageCompression';
import { Loader2 } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  compression?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'webp' | 'png';
  };
  fallbackSrc?: string;
  showLoader?: boolean;
  lazy?: boolean;
  onCompressionComplete?: (originalSize: string, compressedSize: string) => void;
}

/**
 * OptimizedImage component with intelligent compression and loading
 * Features:
 * - Automatic image compression based on size and format
 * - Progressive loading with blur-to-sharp transition
 * - Lazy loading with intersection observer
 * - WebP format detection and conversion
 * - Error handling with fallback images
 * - Loading states with spinner
 */
export function OptimizedImage({
  src,
  alt,
  compression = {},
  fallbackSrc,
  showLoader = true,
  lazy = true,
  onCompressionComplete,
  className = '',
  style = {},
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [compressionStats, setCompressionStats] = useState<{
    original: string;
    compressed: string;
    reduction: number;
  } | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { compressImage, supportsWebP } = useImageCompression();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Load and compress image
  useEffect(() => {
    if (!isInView || !src) return;

    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);

      // For data URLs, try to compress
      if (src.startsWith('data:')) {
        try {
          // Determine optimal compression settings
          const defaultCompression = {
            maxWidth: 1200,
            maxHeight: 800,
            quality: 0.8,
            format: (supportsWebP() ? 'webp' : 'jpeg') as 'jpeg' | 'webp' | 'png',
            ...compression
          };

          // Compress the image
          const compressedSrc = await compressImage(src, defaultCompression);
          
          // Calculate compression stats
          if (compressedSrc !== src) {
            const originalSize = estimateImageSize(src);
            const compressedSize = estimateImageSize(compressedSrc);
            const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
            
            setCompressionStats({
              original: formatFileSize(originalSize),
              compressed: formatFileSize(compressedSize),
              reduction
            });

            onCompressionComplete?.(
              formatFileSize(originalSize),
              formatFileSize(compressedSize)
            );
          }

          setImageSrc(compressedSrc);
        } catch (error) {
          console.warn('Image compression failed:', error);
          setImageSrc(src); // Fall back to original
        }
      } else {
        // For regular URLs, use them directly without compression
        setImageSrc(src);
      }
    };

    loadImage();
  }, [isInView, src, compression, compressImage, supportsWebP, onCompressionComplete]);

  // Handle image load success
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setIsLoading(false);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
    }
  };

  // Estimate image file size from data URL
  const estimateImageSize = (dataUrl: string): number => {
    if (dataUrl.startsWith('data:')) {
      const base64 = dataUrl.split(',')[1];
      return Math.round((base64.length * 3) / 4);
    }
    return 0; // Can't estimate external URLs
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Loading placeholder
  if (!isInView) {
    return (
      <div
        ref={containerRef}
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
        style={{ minHeight: '200px', ...style }}
        {...props}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Loading spinner */}
      {isLoading && showLoader && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
          style={style}
        >
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div 
          className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}
          style={{ minHeight: '200px', ...style }}
        >
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm">Image failed to load</div>
          </div>
        </div>
      )}

      {/* Optimized image - Always render to trigger load events */}
      {!hasError && (
        <img
          ref={imgRef}
          src={imageSrc || src}
          alt={alt}
          className={`transition-all duration-500 ${
            isLoading ? 'opacity-0 blur-sm' : 'opacity-100 blur-0'
          } ${className}`}
          style={style}
          onLoad={handleImageLoad}
          onError={handleImageError}
          {...props}
        />
      )}

      {/* Compression stats (development only) */}
      {process.env.NODE_ENV === 'development' && compressionStats && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {compressionStats.reduction > 0 && (
            <div>Saved {compressionStats.reduction}%</div>
          )}
        </div>
      )}
    </div>
  );
}

