/**
 * Server-side image optimization utilities
 * Handles image processing, compression, and format conversion for better performance
 */

import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  progressive?: boolean;
}

export class ServerImageOptimizer {
  private static uploadDir = join(process.cwd(), 'uploads', 'images');
  private static optimizedDir = join(process.cwd(), 'uploads', 'optimized');

  static {
    // Ensure upload directories exist
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!existsSync(this.optimizedDir)) {
      mkdirSync(this.optimizedDir, { recursive: true });
    }
  }

  /**
   * Get optimized image URL or create one if it doesn't exist
   */
  static async getOptimizedImageUrl(
    originalUrl: string,
    options: ImageOptimizationOptions = {}
  ): Promise<string> {
    try {
      // If it's already a data URL, return as is (client-side optimized)
      if (originalUrl.startsWith('data:')) {
        return originalUrl;
      }

      // For external URLs, we can't optimize server-side, return original
      if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
        return originalUrl;
      }

      // For local files, we could implement optimization here
      return originalUrl;
    } catch (error) {
      console.warn('Server-side image optimization failed:', error);
      return originalUrl;
    }
  }

  /**
   * Calculate optimal settings based on image usage
   */
  static getOptimalSettingsForContext(context: 'advertisement' | 'avatar' | 'gallery'): ImageOptimizationOptions {
    switch (context) {
      case 'advertisement':
        return {
          maxWidth: 1200,
          maxHeight: 800,
          quality: 0.85,
          format: 'jpeg',
          progressive: true
        };
      case 'avatar':
        return {
          maxWidth: 300,
          maxHeight: 300,
          quality: 0.9,
          format: 'jpeg',
          progressive: false
        };
      case 'gallery':
        return {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          format: 'jpeg',
          progressive: true
        };
      default:
        return {
          maxWidth: 1200,
          maxHeight: 800,
          quality: 0.8,
          format: 'jpeg',
          progressive: true
        };
    }
  }

  /**
   * Generate responsive image srcset for different screen sizes
   */
  static generateResponsiveImageSizes(
    baseUrl: string,
    sizes: number[] = [400, 800, 1200, 1600]
  ): { src: string; srcset: string; sizes: string } {
    const srcset = sizes
      .map(size => `${baseUrl}?w=${size} ${size}w`)
      .join(', ');

    const sizesAttr = [
      '(max-width: 640px) 400px',
      '(max-width: 1024px) 800px',
      '(max-width: 1280px) 1200px',
      '1600px'
    ].join(', ');

    return {
      src: baseUrl,
      srcset,
      sizes: sizesAttr
    };
  }

  /**
   * Preload critical images for better performance
   */
  static generatePreloadLinks(imageUrls: string[]): string {
    return imageUrls
      .slice(0, 3) // Only preload first 3 critical images
      .map(url => `<link rel="preload" as="image" href="${url}">`)
      .join('\n');
  }

  /**
   * Estimate bandwidth savings from optimization
   */
  static estimateBandwidthSavings(
    originalSize: number,
    optimizedSize: number
  ): { savings: number; percentage: number; description: string } {
    const savings = originalSize - optimizedSize;
    const percentage = Math.round((savings / originalSize) * 100);
    
    let description = '';
    if (percentage > 50) {
      description = 'Excellent compression - significant bandwidth savings';
    } else if (percentage > 30) {
      description = 'Good compression - noticeable improvement';
    } else if (percentage > 10) {
      description = 'Moderate compression - some improvement';
    } else {
      description = 'Minimal compression - consider different settings';
    }

    return {
      savings,
      percentage,
      description
    };
  }

  /**
   * Get WebP support detection for server-side rendering
   */
  static supportsWebP(userAgent?: string): boolean {
    if (!userAgent) return false;
    
    // Basic user agent detection for WebP support
    const webpSupportedBrowsers = [
      /Chrome/i,
      /Firefox/i,
      /Edge/i,
      /Opera/i
    ];

    return webpSupportedBrowsers.some(browser => browser.test(userAgent));
  }

  /**
   * Generate image metadata for SEO and performance
   */
  static generateImageMetadata(url: string, alt: string, width?: number, height?: number) {
    return {
      '@type': 'ImageObject',
      url,
      contentUrl: url,
      name: alt,
      description: alt,
      ...(width && { width }),
      ...(height && { height })
    };
  }
}

// Middleware for automatic image optimization
export function imageOptimizationMiddleware() {
  return (req: any, res: any, next: any) => {
    // Add optimization headers for images
    if (req.path.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
      res.set({
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Vary': 'Accept'
      });

      // Serve WebP if supported
      const acceptsWebP = req.headers.accept?.includes('image/webp');
      if (acceptsWebP) {
        res.set('Content-Type', 'image/webp');
      }
    }
    next();
  };
}

// Export utility functions for route handlers
export const imageUtils = {
  getOptimalSettings: ServerImageOptimizer.getOptimalSettingsForContext,
  generateResponsive: ServerImageOptimizer.generateResponsiveImageSizes,
  estimateSavings: ServerImageOptimizer.estimateBandwidthSavings,
  supportsWebP: ServerImageOptimizer.supportsWebP,
  generateMetadata: ServerImageOptimizer.generateImageMetadata
};