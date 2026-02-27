/**
 * Utility to extract a color palette from an image using HTML5 Canvas
 */

export interface ColorPalette {
  dominant: string;
  vibrant: string;
  muted: string;
  darkVibrant?: string; // Add optional property
  all: string[];
}

export async function extractPalette(imageSrc: string): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Resize for performance
      const size = 50;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size).data;
      const colorCounts: Record<string, number> = {};
      const colors: {r: number, g: number, b: number}[] = [];

      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        if (a < 128) continue; // Skip transparent

        // Quantize colors slightly to group similar ones
        const qr = Math.round(r / 10) * 10;
        const qg = Math.round(g / 10) * 10;
        const qb = Math.round(b / 10) * 10;
        const rgb = `rgb(${qr},${qg},${qb})`;

        colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
        colors.push({r, g, b});
      }

      // Sort by frequency
      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color);

      // Simple vibrant/muted logic (very basic approximation)
      const dominant = sortedColors[0] || 'rgb(200,200,200)';
      
      // Pick top 5 unique-ish colors
      const palette: ColorPalette = {
        dominant,
        vibrant: sortedColors.find(c => {
          const [r, g, b] = c.match(/\d+/g)!.map(Number);
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          return (max - min) > 40; // High saturation
        }) || dominant,
        muted: sortedColors.find(c => {
          const [r, g, b] = c.match(/\d+/g)!.map(Number);
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          return (max - min) < 30; // Low saturation
        }) || dominant,
        darkVibrant: sortedColors.find(c => {
            const [r, g, b] = c.match(/\d+/g)!.map(Number);
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            return (max - min) > 40 && lum < 100; // High saturation AND dark
        }),
        all: sortedColors.slice(0, 5)
      };

      resolve(palette);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
  });
}

export function rgbToHex(rgb: string): string {
  const matches = rgb.match(/\d+/g);
  if (!matches) return '#cccccc';
  const [r, g, b] = matches.map(Number);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}