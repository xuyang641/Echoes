// 滤镜处理核心算法 (Based on Canvas API)

export interface Filter {
  id: string;
  name: string;
  apply: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export const FILTERS: Filter[] = [
  {
    id: 'original',
    name: '原图',
    apply: () => {}, // No-op
  },
  {
    id: 'grayscale',
    name: '黑白',
    apply: (ctx, width, height) => {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg; // R
        data[i + 1] = avg; // G
        data[i + 2] = avg; // B
      }
      ctx.putImageData(imageData, 0, 0);
    },
  },
  {
    id: 'sepia',
    name: '复古',
    apply: (ctx, width, height) => {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        data[i] = r * 0.393 + g * 0.769 + b * 0.189; // R
        data[i + 1] = r * 0.349 + g * 0.686 + b * 0.168; // G
        data[i + 2] = r * 0.272 + g * 0.534 + b * 0.131; // B
      }
      ctx.putImageData(imageData, 0, 0);
    },
  },
  {
    id: 'warm',
    name: '暖阳',
    apply: (ctx, width, height) => {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] + 30); // Boost Red
        data[i + 1] = Math.min(255, data[i + 1] + 10); // Boost Green slightly
      }
      ctx.putImageData(imageData, 0, 0);
    },
  },
  {
    id: 'cool',
    name: '冷调',
    apply: (ctx, width, height) => {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i + 2] = Math.min(255, data[i + 2] + 30); // Boost Blue
      }
      ctx.putImageData(imageData, 0, 0);
    },
  },
  {
    id: 'vintage',
    name: '胶片',
    apply: (ctx, width, height) => {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Boost contrast
        const factor = (259 * (20 + 255)) / (255 * (259 - 20));
        data[i] = factor * (data[i] - 128) + 128;
        data[i + 1] = factor * (data[i + 1] - 128) + 128;
        data[i + 2] = factor * (data[i + 2] - 128) + 128;
        
        // Add slight yellow tint (Sepia-ish)
        data[i] = Math.min(255, data[i] + 10);
        data[i + 1] = Math.min(255, data[i + 1] + 5);
      }
      ctx.putImageData(imageData, 0, 0);
    },
  },
];

export async function applyFilterToImage(imageSrc: string, filterId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Apply filter
      const filter = FILTERS.find(f => f.id === filterId);
      if (filter && filterId !== 'original') {
        filter.apply(ctx, canvas.width, canvas.height);
      }

      // Export as base64
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });
}