/**
 * Image compression utility for optimizing images before display
 * Reduces file size while maintaining visual quality for faster loading
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'jpeg' | 'webp' | 'png';
  maintainAspectRatio?: boolean;
}

export class ImageCompressor {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;

  private static getCanvas(): HTMLCanvasElement {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
    return this.canvas;
  }

  /**
   * Compresses an image URL and returns a compressed data URL
   */
  static async compressImageUrl(
    imageUrl: string, 
    options: CompressionOptions = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const compressedDataUrl = this.compressImage(img, options);
          resolve(compressedDataUrl);
        } catch (error) {
          // If compression fails, return original URL
          resolve(imageUrl);
        }
      };
      
      img.onerror = () => {
        // If image loading fails, return original URL
        resolve(imageUrl);
      };
      
      img.src = imageUrl;
    });
  }

  /**
   * Compresses an HTML Image element
   */
  static compressImage(
    img: HTMLImageElement, 
    options: CompressionOptions = {}
  ): string {
    const {
      maxWidth = 800,
      maxHeight = 600,
      quality = 0.8,
      format = 'jpeg',
      maintainAspectRatio = true
    } = options;

    const canvas = this.getCanvas();
    const ctx = this.ctx!;

    // Calculate new dimensions
    let { width, height } = this.calculateDimensions(
      img.width, 
      img.height, 
      maxWidth, 
      maxHeight, 
      maintainAspectRatio
    );

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas and draw image
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    // Return compressed data URL
    const mimeType = `image/${format}`;
    return canvas.toDataURL(mimeType, quality);
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean
  ): { width: number; height: number } {
    if (!maintainAspectRatio) {
      return { 
        width: Math.min(originalWidth, maxWidth),
        height: Math.min(originalHeight, maxHeight)
      };
    }

    const aspectRatio = originalWidth / originalHeight;
    
    let width = Math.min(originalWidth, maxWidth);
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
      height = Math.min(originalHeight, maxHeight);
      width = height * aspectRatio;
    }

    return { 
      width: Math.round(width), 
      height: Math.round(height) 
    };
  }

  /**
   * Get optimal compression settings based on image size
   */
  static getOptimalSettings(fileSize: number): CompressionOptions {
    if (fileSize > 2 * 1024 * 1024) { // > 2MB
      return {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.7,
        format: 'jpeg'
      };
    } else if (fileSize > 1 * 1024 * 1024) { // > 1MB
      return {
        maxWidth: 1600,
        maxHeight: 1000,
        quality: 0.8,
        format: 'jpeg'
      };
    } else if (fileSize > 500 * 1024) { // > 500KB
      return {
        maxWidth: 2000,
        maxHeight: 1200,
        quality: 0.85,
        format: 'jpeg'
      };
    }
    
    // Small files - minimal compression
    return {
      maxWidth: 2400,
      maxHeight: 1600,
      quality: 0.9,
      format: 'jpeg'
    };
  }

  /**
   * Check if browser supports WebP format
   */
  static supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Estimate file size reduction percentage
   */
  static estimateCompression(
    originalWidth: number,
    originalHeight: number,
    options: CompressionOptions
  ): number {
    const { maxWidth = 800, maxHeight = 600, quality = 0.8 } = options;
    
    const { width, height } = this.calculateDimensions(
      originalWidth,
      originalHeight,
      maxWidth,
      maxHeight,
      true
    );

    const pixelReduction = (width * height) / (originalWidth * originalHeight);
    const qualityReduction = quality;
    
    return Math.round((1 - (pixelReduction * qualityReduction)) * 100);
  }
}

// Helper hook for React components
export function useImageCompression() {
  const compressImage = async (
    imageUrl: string,
    options?: CompressionOptions
  ): Promise<string> => {
    try {
      return await ImageCompressor.compressImageUrl(imageUrl, options);
    } catch (error) {
      console.warn('Image compression failed:', error);
      return imageUrl;
    }
  };

  const getOptimalSettings = (fileSize: number): CompressionOptions => {
    return ImageCompressor.getOptimalSettings(fileSize);
  };

  const supportsWebP = (): boolean => {
    return ImageCompressor.supportsWebP();
  };

  return {
    compressImage,
    getOptimalSettings,
    supportsWebP,
    estimateCompression: ImageCompressor.estimateCompression
  };
}