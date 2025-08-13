import { useState, useCallback } from 'react';
import { useImageCompression } from '@/utils/imageCompression';

interface OptimizationStats {
  originalSize: number;
  compressedSize: number;
  savings: number;
  percentage: number;
  timeElapsed: number;
}

interface UseImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  onProgress?: (progress: number) => void;
  onComplete?: (stats: OptimizationStats) => void;
}

/**
 * Advanced hook for image optimization with progress tracking and statistics
 */
export function useImageOptimization(options: UseImageOptimizationOptions = {}) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<OptimizationStats | null>(null);
  const { compressImage, estimateCompression } = useImageCompression();

  const optimizeImage = useCallback(async (imageUrl: string) => {
    setIsOptimizing(true);
    setProgress(0);
    const startTime = Date.now();

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      options.onProgress?.(10);

      // Perform compression
      const compressedUrl = await compressImage(imageUrl, {
        maxWidth: options.maxWidth || 1200,
        maxHeight: options.maxHeight || 800,
        quality: options.quality || 0.8,
        format: options.format || 'jpeg'
      });

      clearInterval(progressInterval);
      setProgress(100);

      // Calculate stats
      const originalSize = estimateImageSize(imageUrl);
      const compressedSize = estimateImageSize(compressedUrl);
      const savings = originalSize - compressedSize;
      const percentage = Math.round((savings / originalSize) * 100);
      const timeElapsed = Date.now() - startTime;

      const optimizationStats: OptimizationStats = {
        originalSize,
        compressedSize,
        savings,
        percentage,
        timeElapsed
      };

      setStats(optimizationStats);
      options.onComplete?.(optimizationStats);

      return compressedUrl;
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw error;
    } finally {
      setIsOptimizing(false);
    }
  }, [compressImage, options, estimateCompression]);

  const optimizeBatch = useCallback(async (imageUrls: string[]) => {
    setIsOptimizing(true);
    setProgress(0);

    try {
      const results: string[] = [];
      const totalImages = imageUrls.length;

      for (let i = 0; i < imageUrls.length; i++) {
        const optimizedUrl = await optimizeImage(imageUrls[i]);
        results.push(optimizedUrl);
        
        const currentProgress = Math.round(((i + 1) / totalImages) * 100);
        setProgress(currentProgress);
        options.onProgress?.(currentProgress);
      }

      return results;
    } catch (error) {
      console.error('Batch optimization failed:', error);
      throw error;
    } finally {
      setIsOptimizing(false);
    }
  }, [optimizeImage, options]);

  const estimateImageSize = (dataUrl: string): number => {
    if (dataUrl.startsWith('data:')) {
      const base64 = dataUrl.split(',')[1];
      return Math.round((base64.length * 3) / 4);
    }
    return 0;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const reset = useCallback(() => {
    setIsOptimizing(false);
    setProgress(0);
    setStats(null);
  }, []);

  return {
    optimizeImage,
    optimizeBatch,
    isOptimizing,
    progress,
    stats,
    formatFileSize: (bytes: number) => formatFileSize(bytes),
    reset
  };
}