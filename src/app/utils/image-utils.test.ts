import { describe, it, expect, vi, beforeEach } from 'vitest';
import { optimizeImage, generateThumbnail } from './image-utils';

// Mock the heavy imageCompression library so tests run fast without real file manipulation
vi.mock('browser-image-compression', () => {
  const mockCompress = vi.fn().mockImplementation(async (file, options) => {
    // Return a fake compressed file that's smaller than the original
    return new File(['compressed data'], file.name, { type: options.fileType || file.type });
  });

  // Attach the getDataUrlFromFile mock method to the main mock function
  // @ts-ignore
  mockCompress.getDataUrlFromFile = vi.fn().mockResolvedValue('data:image/webp;base64,fake-base64-data');
  
  return { default: mockCompress };
});

describe('Image Optimization Utilities', () => {
  let mockFile: File;

  beforeEach(() => {
    // Create a mock large file (1MB)
    const largeData = new Array(1024 * 1024).fill('a').join('');
    mockFile = new File([largeData], 'test-photo.jpg', { type: 'image/jpeg' });
    vi.clearAllMocks();
  });

  describe('optimizeImage', () => {
    it('should compress image using default options', async () => {
      const result = await optimizeImage(mockFile);
      
      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe('test-photo.jpg');
      
      // The browser-image-compression library should have been called
      const imageCompression = (await import('browser-image-compression')).default;
      expect(imageCompression).toHaveBeenCalledTimes(1);
      expect(imageCompression).toHaveBeenCalledWith(mockFile, expect.objectContaining({
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.8
      }));
    });

    it('should respect custom optimization options', async () => {
      const customOptions = {
        maxSizeMB: 2,
        maxWidthOrHeight: 800,
        fileType: 'image/png',
        initialQuality: 0.9
      };
      
      await optimizeImage(mockFile, customOptions);
      
      const imageCompression = (await import('browser-image-compression')).default;
      expect(imageCompression).toHaveBeenCalledWith(mockFile, expect.objectContaining(customOptions));
    });
  });

  describe('generateThumbnail', () => {
    it('should generate a base64 thumbnail string', async () => {
      const result = await generateThumbnail(mockFile);
      
      expect(typeof result).toBe('string');
      expect(result).toBe('data:image/webp;base64,fake-base64-data');
      
      // Ensure aggressive compression settings were used for thumbnail
      const imageCompression = (await import('browser-image-compression')).default;
      expect(imageCompression).toHaveBeenCalledWith(mockFile, expect.objectContaining({
        maxSizeMB: 0.05,
        maxWidthOrHeight: 300,
      }));
      
      // Ensure the base64 conversion was called
      // @ts-ignore
      expect(imageCompression.getDataUrlFromFile).toHaveBeenCalledTimes(1);
    });
  });
});