import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const PHOTO_DIR = 'photos';

/**
 * Save a Base64 string to a file in the app's data directory.
 * Returns the file path (URI) suitable for <img src> on native (Capacitor.convertFileSrc).
 */
export async function savePicture(base64Data: string, fileName: string): Promise<string> {
  // If not native, just return the base64 string (web fallback)
  if (!Capacitor.isNativePlatform()) {
    return base64Data;
  }

  try {
    // Strip metadata prefix if present (e.g. "data:image/jpeg;base64,")
    const data = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    
    // Ensure directory exists
    try {
      await Filesystem.mkdir({
        path: PHOTO_DIR,
        directory: Directory.Data,
        recursive: true
      });
    } catch (e) {
      // Ignore if exists
    }

    const savedFile = await Filesystem.writeFile({
      path: `${PHOTO_DIR}/${fileName}`,
      data: data,
      directory: Directory.Data,
    });

    // Return the web-accessible URI (e.g., http://localhost/_capacitor_file_/...)
    return Capacitor.convertFileSrc(savedFile.uri);
  } catch (error) {
    console.error('Error saving picture to filesystem:', error);
    return base64Data;
  }
}

/**
 * Load a picture from the filesystem.
 * This is mostly handled by Capacitor.convertFileSrc, but if we need to read base64 back:
 */
export async function loadPictureAsBase64(filePath: string): Promise<string> {
  // If it's already a base64 string or http url, return as is
  if (filePath.startsWith('data:') || filePath.startsWith('http')) {
    return filePath;
  }

  if (!Capacitor.isNativePlatform()) {
    return filePath;
  }

  try {
    // Read file
    const readFile = await Filesystem.readFile({
      path: filePath,
    });
    return `data:image/jpeg;base64,${readFile.data}`;
  } catch (error) {
    console.error('Error loading picture:', error);
    return '';
  }
}

/**
 * Delete a picture from filesystem
 */
export async function deletePicture(filePath: string): Promise<void> {
  // If not native or not a local file, nothing to delete
  if (!Capacitor.isNativePlatform() || filePath.startsWith('data:')) {
    return;
  }

  try {
    // If it's a converted web URI, we need to extract the original path or use the URI if it's file://
    let pathToDelete = filePath;

    // Capacitor.convertFileSrc on Android/iOS usually results in http://localhost/_capacitor_file_/ or capacitor://localhost/_capacitor_file_/
    if (filePath.includes('_capacitor_file_')) {
      // Extract the actual path after _capacitor_file_
      // This is a bit hacky but works for standard Capacitor behavior
      const parts = filePath.split('_capacitor_file_');
      if (parts.length > 1) {
        pathToDelete = decodeURIComponent(parts[1]);
        // Remove leading slash if it exists and we're on Android (which sometimes adds it)
        if (pathToDelete.startsWith('/') && Capacitor.getPlatform() === 'android') {
          // Keep it as is, Filesystem.deleteFile handles absolute paths if they start with /
        }
      }
    }

    await Filesystem.deleteFile({
      path: pathToDelete
    });
    console.log('Successfully deleted file:', pathToDelete);
  } catch (err) {
    // It's okay if the file doesn't exist
    console.warn('Error deleting file (it might not exist):', err);
  }
}
