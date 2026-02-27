// Image Optimization Worker
import imageCompression from 'browser-image-compression';

export interface ImageOptimizationOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  fileType?: string;
  initialQuality?: number;
}

export async function optimizeImage(file: File, options: ImageOptimizationOptions = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  fileType: 'image/webp',
  initialQuality: 0.8
}): Promise<File> {
  console.log(`Starting image optimization for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight,
      useWebWorker: true,
      fileType: options.fileType,
      initialQuality: options.initialQuality,
    });

    console.log(`Optimization complete: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    return compressedFile;
  } catch (error) {
    console.error('Image optimization failed:', error);
    throw error;
  }
}

export async function generateThumbnail(file: File): Promise<string> {
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.05, // Very small size for thumbnail
      maxWidthOrHeight: 300, // Small dimensions
      useWebWorker: true,
      fileType: 'image/webp'
    });
    
    return await imageCompression.getDataUrlFromFile(compressedFile);
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    throw error;
  }
}
