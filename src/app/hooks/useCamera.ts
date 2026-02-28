import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useState } from 'react';

export function useCamera() {
  const [photo, setPhoto] = useState<string | null>(null);

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera // 直接打开相机
      });

      if (image.dataUrl) {
        setPhoto(image.dataUrl);
        return image.dataUrl;
      }
    } catch (error) {
      console.error('User cancelled or failed to take photo:', error);
    }
    return null;
  };

  const pickFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos // 打开相册
      });

      if (image.dataUrl) {
        setPhoto(image.dataUrl);
        return image.dataUrl;
      }
    } catch (error) {
      console.error('User cancelled or failed to pick photo:', error);
    }
    return null;
  };

  return {
    photo,
    takePhoto,
    pickFromGallery
  };
}